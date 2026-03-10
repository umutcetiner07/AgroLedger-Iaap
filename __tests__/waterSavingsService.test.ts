/**
 * WaterSavingsService birim testleri.
 * Test edilen: validateSavingsData iş kuralları ve baseline tip belirleme mantığı.
 * Prisma mock'u ile gerçek DB bağlantısı açılmaz.
 */
import { WaterSavingsService } from '@/lib/waterSavingsService'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    farm: { findUnique: jest.fn(), count: jest.fn() },
    waterSaving: { create: jest.fn(), aggregate: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    weatherLog: { aggregate: jest.fn() },
    contract: { findFirst: jest.fn() },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// ─── Test veri fabrikaları ────────────────────────────────────────────────────

const makeBaseFarm = (readingCount: number, overrides = {}) => {
  const readings = Array.from({ length: readingCount }, (_, i) => ({
    id: i + 1,
    value: 100,
    timestamp: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000), // aylık aralıklı
    sensorId: 1,
    dataChannel: 'FLOW',
    isEstimated: false,
    createdAt: new Date(),
  }))

  return {
    id: 1,
    name: 'Test Çiftliği',
    farmerId: 'farmer-1',
    cooperativeId: 1,
    areaHa: 5,
    manualIrrigationCount: 0,
    cooperative: { regionId: 1, region: { name: 'Almaty' } },
    sensors: [{ id: 1, readings }],
    ...overrides,
  }
}

// ─── calculateBaseline — Tip Belirleme ───────────────────────────────────────

describe('WaterSavingsService.calculateBaseline', () => {
  const commonMocks = () => {
    ;(mockPrisma.weatherLog.aggregate as jest.Mock).mockResolvedValue({
      _sum: { rainfall: 10 },
      _avg: { tempC: 22, humidity: 55 },
    })
    ;(mockPrisma.waterSaving.aggregate as jest.Mock).mockResolvedValue({
      _avg: { baselineUsage: 110 },
    })
  }

  test('sensör verisi olmayan çiftlik → PROXY baseline kullanmalı', async () => {
    commonMocks()
    ;(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(makeBaseFarm(0))

    const result = await WaterSavingsService.calculateBaseline(1)

    expect(result.baselineType).toBe('PROXY')
    expect(result.wnb).toBeGreaterThan(0)
    expect(result.factors.realMonths).toBe(0)
  })

  test('12 aydan az sensör verisi → HYBRID baseline kullanmalı', async () => {
    commonMocks()
    // 5 farklı aylık okuma
    const readings = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      value: 90 + i,
      timestamp: new Date(2024, i, 15), // Ocak-Mayıs
      sensorId: 1, dataChannel: 'FLOW', isEstimated: false, createdAt: new Date(),
    }))
    ;(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue({
      ...makeBaseFarm(0),
      sensors: [{ id: 1, readings }],
    })

    const result = await WaterSavingsService.calculateBaseline(1)

    expect(result.baselineType).toBe('HYBRID')
    expect(result.factors.realMonths).toBe(5)
    expect(result.factors.proxyValue).toBeDefined()
    expect(result.factors.realValue).toBeDefined()
  })

  test('12+ aylık sensör verisi → REAL baseline kullanmalı', async () => {
    commonMocks()
    // 12 farklı aylık okuma
    const readings = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      value: 85,
      timestamp: new Date(2024, i, 15), // Tüm aylar
      sensorId: 1, dataChannel: 'FLOW', isEstimated: false, createdAt: new Date(),
    }))
    ;(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue({
      ...makeBaseFarm(0),
      sensors: [{ id: 1, readings }],
    })

    const result = await WaterSavingsService.calculateBaseline(1)

    expect(result.baselineType).toBe('REAL')
  })

  test('çiftlik bulunamazsa Error fırlatmalı', async () => {
    ;(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(null)

    await expect(WaterSavingsService.calculateBaseline(999)).rejects.toThrow(
      'Çiftlik bulunamadı (ID: 999)'
    )
  })
})

// ─── calculateAndSaveSavings ──────────────────────────────────────────────────

describe('WaterSavingsService.calculateAndSaveSavings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockPrisma.weatherLog.aggregate as jest.Mock).mockResolvedValue({
      _sum: { rainfall: 0 },
      _avg: { tempC: 25, humidity: 40 },
    })
    ;(mockPrisma.waterSaving.aggregate as jest.Mock).mockResolvedValue({
      _avg: { baselineUsage: 100 },
    })
    ;(mockPrisma.farm.findUnique as jest.Mock).mockResolvedValue(makeBaseFarm(0))
    ;(mockPrisma.contract.findFirst as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.waterSaving.create as jest.Mock).mockResolvedValue({
      id: 'saving-1', farmId: 1, savings: 60, actualUsage: 40, baselineUsage: 100, baselineType: 'PROXY',
    })
  })

  test('tasarruf hesaplanıp kaydedilmeli', async () => {
    const result = await WaterSavingsService.calculateAndSaveSavings({
      farmId: 1,
      actualConsumption: 40,
    })

    expect(result.savings).toBeDefined()
    expect(result.payment).toBeGreaterThan(0)
    expect(mockPrisma.waterSaving.create).toHaveBeenCalledTimes(1)
  })

  test('tüketim baseline\'dan fazlaysa validasyon uyarı üretmeli', async () => {
    // WNB = regionNorm(110) * weatherFactor(1.2 default for rainfall=10) ≈ 120-132
    // actualConsumption: 1000 → kesinlikle 2x üzeri
    ;(mockPrisma.waterSaving.create as jest.Mock).mockResolvedValue({
      id: 'saving-2', farmId: 1, savings: 0, actualUsage: 1000, baselineUsage: 110, baselineType: 'PROXY',
    })

    const result = await WaterSavingsService.calculateAndSaveSavings({
      farmId: 1,
      actualConsumption: 1000,
    })

    expect(result.payment).toBeGreaterThanOrEqual(0)
    // 1000 > 2 * baseline(~120) → uyarı üretmeli
    const hasWarning = result.validation.warnings.some((w) =>
      w.includes('2 katından fazla') || w.includes('Tüketim baseline')
    )
    expect(hasWarning).toBe(true)
  })

  test('sıfır tüketim warning üretmeli ama valid olmalı', async () => {
    ;(mockPrisma.waterSaving.create as jest.Mock).mockResolvedValue({
      id: 'saving-3', farmId: 1, savings: 100, actualUsage: 0, baselineUsage: 100, baselineType: 'PROXY',
    })

    const result = await WaterSavingsService.calculateAndSaveSavings({
      farmId: 1,
      actualConsumption: 0,
    })

    expect(result.validation.isValid).toBe(true) // sıfır tüketim invalid değil, sadece warning
    expect(result.validation.warnings.some((w) => w.includes('Sıfır tüketim'))).toBe(true)
  })

  test('negatif tüketim isValid=false döndürmeli', async () => {
    // Negatif tüketim → validation fail
    ;(mockPrisma.waterSaving.create as jest.Mock).mockResolvedValue({
      id: 'saving-4', farmId: 1, savings: 0, actualUsage: -10, baselineUsage: 100, baselineType: 'PROXY',
    })

    const result = await WaterSavingsService.calculateAndSaveSavings({
      farmId: 1,
      actualConsumption: -10,
    })

    expect(result.validation.isValid).toBe(false)
    expect(result.validation.warnings.some((w) => w.includes('Negatif'))).toBe(true)
  })
})
