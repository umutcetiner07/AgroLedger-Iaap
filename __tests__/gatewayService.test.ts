/**
 * GatewayService birim testleri.
 * Test edilen: heartbeat durum belirleme, bakım koşulları, N+1 fix (transaction).
 * Math.random() simülasyonu kaldırıldığından testler deterministik.
 */
import { GatewayService } from '@/lib/gatewayService'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    gatewayHealth: { findMany: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
    maintenanceTicket: { findFirst: jest.fn(), create: jest.fn() },
    user: { findFirst: jest.fn() },
    sensor: { findFirst: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const makeGateway = (id: number, overrides = {}) => ({
  id,
  cooperativeId: 1,
  status: 'HEALTHY',
  lastHeartbeatAt: new Date(),
  nextHeartbeatAt: new Date(),
  heartbeatIntervalHours: 6,
  lastHeartbeatResult: 'OK',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// ─── updateHeartbeat ──────────────────────────────────────────────────────────

describe('GatewayService.updateHeartbeat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockPrisma.gatewayHealth.update as jest.Mock).mockImplementation(({ where }) =>
      Promise.resolve(makeGateway(where.id))
    )
    ;(mockPrisma.maintenanceTicket.findFirst as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.maintenanceTicket.create as jest.Mock).mockResolvedValue({ id: 1 })
    ;(mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'admin-1', role: 'SUPER_ADMIN' })
    ;(mockPrisma.sensor.findFirst as jest.Mock).mockResolvedValue({ id: 1 })
  })

  test('gateway yoksa boş dizi döndürmeli', async () => {
    ;(mockPrisma.gatewayHealth.findMany as jest.Mock).mockResolvedValue([])

    const results = await GatewayService.updateHeartbeat(1)

    expect(results).toEqual([])
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  test('HEALTHY koşullarda status=HEALTHY döndürmeli, bakım gerekmemeli', async () => {
    ;(mockPrisma.gatewayHealth.findMany as jest.Mock).mockResolvedValue([makeGateway(1)])

    const sensorData = new Map([[1, { batteryLevel: 85, captureRate: 95 }]])
    const results = await GatewayService.updateHeartbeat(1, sensorData)

    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('HEALTHY')
    expect(results[0].needsMaintenance).toBe(false)
    expect(results[0].heartbeatIntervalHours).toBe(6) // Yüksek batarya → 6 saat
  })

  test('düşük batarya (%15) → WARNING ve bakım gerektirir', async () => {
    ;(mockPrisma.gatewayHealth.findMany as jest.Mock).mockResolvedValue([makeGateway(1)])

    const sensorData = new Map([[1, { batteryLevel: 15, captureRate: 90 }]])
    const results = await GatewayService.updateHeartbeat(1, sensorData)

    expect(results[0].status).toBe('WARNING')
    expect(results[0].needsMaintenance).toBe(true)
    expect(results[0].heartbeatIntervalHours).toBe(12) // Orta batarya → 12 saat
  })

  test('kritik batarya (%5) → CRITICAL ve bakım gerektirir', async () => {
    ;(mockPrisma.gatewayHealth.findMany as jest.Mock).mockResolvedValue([makeGateway(1)])

    const sensorData = new Map([[1, { batteryLevel: 5, captureRate: 90 }]])
    const results = await GatewayService.updateHeartbeat(1, sensorData)

    expect(results[0].status).toBe('CRITICAL')
    expect(results[0].needsMaintenance).toBe(true)
    expect(results[0].heartbeatIntervalHours).toBe(24) // Kritik batarya → 24 saat
  })

  test('çok düşük yakalama oranı (%40) → CRITICAL (batarya normal)', async () => {
    ;(mockPrisma.gatewayHealth.findMany as jest.Mock).mockResolvedValue([makeGateway(1)])

    const sensorData = new Map([[1, { batteryLevel: 70, captureRate: 40 }]])
    const results = await GatewayService.updateHeartbeat(1, sensorData)

    expect(results[0].status).toBe('CRITICAL')
    expect(results[0].needsMaintenance).toBe(true)
    // batteryLevel=70 (>60) → interval=6h (captureRate kötü olsa da batarya seviyesi belirler)
    expect(results[0].heartbeatIntervalHours).toBe(6)
  })

  test('birden fazla gateway tek $transaction ile güncellenmeli (N+1 fix)', async () => {
    ;(mockPrisma.gatewayHealth.findMany as jest.Mock).mockResolvedValue([
      makeGateway(1), makeGateway(2), makeGateway(3),
    ])
    const sensorData = new Map([
      [1, { batteryLevel: 80, captureRate: 95 }],
      [2, { batteryLevel: 80, captureRate: 95 }],
      [3, { batteryLevel: 80, captureRate: 95 }],
    ])

    const results = await GatewayService.updateHeartbeat(1, sensorData)

    expect(results).toHaveLength(3)
    // N+1 fix: $transaction bir kez çağrılmalı, 3 ayrı update değil
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
  })

  test('zaten açık ticket varsa yenisi oluşturulmamalı', async () => {
    ;(mockPrisma.gatewayHealth.findMany as jest.Mock).mockResolvedValue([makeGateway(1)])
    ;(mockPrisma.maintenanceTicket.findFirst as jest.Mock).mockResolvedValue({ id: 99, status: 'OPEN' })

    const sensorData = new Map([[1, { batteryLevel: 5, captureRate: 40 }]])
    await GatewayService.updateHeartbeat(1, sensorData)

    expect(mockPrisma.maintenanceTicket.create).not.toHaveBeenCalled()
  })
})

// ─── getAllGatewaysStatus ─────────────────────────────────────────────────────

describe('GatewayService.getAllGatewaysStatus', () => {
  test('gateway sayımları status\'a göre doğru hesaplanmalı', async () => {
    ;(mockPrisma.gatewayHealth.findMany as jest.Mock).mockResolvedValue([
      makeGateway(1, { status: 'HEALTHY' }),
      makeGateway(2, { status: 'HEALTHY' }),
      makeGateway(3, { status: 'WARNING' }),
      makeGateway(4, { status: 'CRITICAL' }),
      makeGateway(5, { status: 'OFFLINE' }),
    ])

    const result = await GatewayService.getAllGatewaysStatus()

    expect(result.total).toBe(5)
    expect(result.healthy).toBe(2)
    expect(result.warning).toBe(1)
    expect(result.critical).toBe(1)
    expect(result.offline).toBe(1)
  })
})
