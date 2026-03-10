/**
 * AnomalyService birim testleri.
 * Test edilen: calculateConfidenceScore faktör hesaplamaları ve eşik mantığı.
 * Prisma mock'u kullanılır — gerçek DB bağlantısı açılmaz.
 */
import { AnomalyService } from '@/lib/anomalyService'
import { prisma } from '@/lib/prisma'

// Prisma mock'u jest'e bağla
jest.mock('@/lib/prisma', () => ({
  prisma: {
    sensor: { findUnique: jest.fn() },
    weatherLog: { aggregate: jest.fn() },
    anomalyLog: { count: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// ─── Test veri fabrikaları ────────────────────────────────────────────────────

const makeMockSensor = (overrides = {}) => ({
  id: 1,
  battery: 80,
  farm: {
    id: 1,
    farmerId: 'farmer-1',
    name: 'Test Çiftliği',
    manualIrrigationCount: 0,
    cooperativeId: 1,
    cooperative: {
      regionId: 1,
    },
  },
  ...overrides,
})

// ─── calculateConfidenceScore ─────────────────────────────────────────────────

describe('AnomalyService.calculateConfidenceScore', () => {
  const input = { sensorId: 1, type: 'HIGH_MOISTURE', description: 'Test anomali' }

  beforeEach(() => {
    jest.clearAllMocks()
    // Varsayılan: ideal koşullar — yüksek skor beklenir
    ;(mockPrisma.sensor.findUnique as jest.Mock).mockResolvedValue(makeMockSensor())
    ;(mockPrisma.weatherLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { rainfall: 0 } })
    ;(mockPrisma.anomalyLog.count as jest.Mock).mockResolvedValue(0)
  })

  test('ideal koşullarda skor 1.0 olmalı ve alert tetiklenmeli', async () => {
    const result = await AnomalyService.calculateConfidenceScore(input)

    expect(result.score).toBeCloseTo(1.0)
    expect(result.shouldAlert).toBe(true)
    expect(result.factors.rainfallFactor).toBe(1)
    expect(result.factors.neighborAnomalyFactor).toBe(1)
    expect(result.factors.manualIrrigationFactor).toBe(1)
    expect(result.factors.sensorBatteryFactor).toBe(1)
  })

  test('yüksek yağış (>5mm) rainfallFactor=0 yapmalı', async () => {
    ;(mockPrisma.weatherLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { rainfall: 15 } })

    const result = await AnomalyService.calculateConfidenceScore(input)

    expect(result.factors.rainfallFactor).toBe(0)
    // Yağış faktörü %30 ağırlık — toplam skor 0.7 olmalı
    expect(result.score).toBeCloseTo(0.7)
  })

  test('3+ komşu anomali neighborAnomalyFactor=0 yapmalı', async () => {
    ;(mockPrisma.anomalyLog.count as jest.Mock)
      .mockResolvedValueOnce(3) // komşu anomali
      .mockResolvedValueOnce(0) // tarihsel doğruluk

    const result = await AnomalyService.calculateConfidenceScore(input)

    expect(result.factors.neighborAnomalyFactor).toBe(0)
    expect(result.score).toBeCloseTo(0.75) // 1.0 - 0.25 (komşu ağırlığı)
  })

  test('düşük batarya (<20%) sensorBatteryFactor=0.5 yapmalı', async () => {
    ;(mockPrisma.sensor.findUnique as jest.Mock).mockResolvedValue(
      makeMockSensor({ battery: 15 })
    )
    ;(mockPrisma.anomalyLog.count as jest.Mock).mockResolvedValue(0)

    const result = await AnomalyService.calculateConfidenceScore(input)

    expect(result.factors.sensorBatteryFactor).toBe(0.5)
    // Batarya faktörü %15 ağırlık — toplam 0.925 olmalı
    expect(result.score).toBeCloseTo(0.925)
  })

  test('çok kötü koşullarda skor 0.6 altında kalmalı — alert tetiklenmemeli', async () => {
    ;(mockPrisma.sensor.findUnique as jest.Mock).mockResolvedValue(
      makeMockSensor({ battery: 5, farm: { ...makeMockSensor().farm, manualIrrigationCount: 5 } })
    )
    ;(mockPrisma.weatherLog.aggregate as jest.Mock).mockResolvedValue({ _sum: { rainfall: 20 } })
    ;(mockPrisma.anomalyLog.count as jest.Mock)
      .mockResolvedValueOnce(5)   // komşu anomali
      .mockResolvedValueOnce(3)   // tarihsel

    const result = await AnomalyService.calculateConfidenceScore(input)

    expect(result.shouldAlert).toBe(false)
    expect(result.score).toBeLessThan(0.6)
  })

  test('sensör bulunamazsa Error fırlatmalı', async () => {
    ;(mockPrisma.sensor.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(AnomalyService.calculateConfidenceScore(input)).rejects.toThrow(
      'Sensör bulunamadı (ID: 1)'
    )
  })

  test('manualIrrigationCount > 2 ise manualIrrigationFactor=0.5 olmalı', async () => {
    ;(mockPrisma.sensor.findUnique as jest.Mock).mockResolvedValue(
      makeMockSensor({ farm: { ...makeMockSensor().farm, manualIrrigationCount: 3 } })
    )
    ;(mockPrisma.anomalyLog.count as jest.Mock).mockResolvedValue(0)

    const result = await AnomalyService.calculateConfidenceScore(input)

    expect(result.factors.manualIrrigationFactor).toBe(0.5)
    // Ağırlıklı etki: 0.5 * 0.20 = 0.10 düşüş → toplam 0.90
    expect(result.score).toBeCloseTo(0.9)
  })
})

// ─── respondToAnomaly ─────────────────────────────────────────────────────────

describe('AnomalyService.respondToAnomaly', () => {
  beforeEach(() => jest.clearAllMocks())

  test('yetkili çiftçi yanıt güncelleyebilmeli', async () => {
    ;(mockPrisma.anomalyLog.findUnique as jest.Mock).mockResolvedValue({ farmerId: 'farmer-1' })
    ;(mockPrisma.anomalyLog.update as jest.Mock).mockResolvedValue({ id: 1, farmerResponse: 'CONFIRMED' })

    const result = await AnomalyService.respondToAnomaly(1, 'farmer-1', 'CONFIRMED')

    expect(mockPrisma.anomalyLog.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ farmerResponse: 'CONFIRMED', resolvedAt: expect.any(Date) }),
    })
    expect(result.farmerResponse).toBe('CONFIRMED')
  })

  test('yetkisiz çiftçi yanıt vermeye çalışırsa Error fırlatmalı', async () => {
    ;(mockPrisma.anomalyLog.findUnique as jest.Mock).mockResolvedValue({ farmerId: 'farmer-1' })

    await expect(
      AnomalyService.respondToAnomaly(1, 'hacker-99', 'CONFIRMED')
    ).rejects.toThrow('Bu anomaliye yanıt verme yetkiniz yok')
  })

  test('var olmayan anomaly ID ile Error fırlatmalı', async () => {
    ;(mockPrisma.anomalyLog.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(
      AnomalyService.respondToAnomaly(999, 'farmer-1', 'CONFIRMED')
    ).rejects.toThrow('Anomali kaydı bulunamadı (ID: 999)')
  })
})
