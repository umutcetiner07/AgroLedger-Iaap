/**
 * decisionGuard ve shadowMode birim testleri.
 * Test edilen: canDecide sensör zamanı kontrolü, getShadowMode mod atama.
 * Prisma mock'u kullanılır.
 */
import { canDecide } from '@/lib/decisionGuard'
import { getShadowMode, recordShadowDecision } from '@/lib/shadowMode'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    sensor: { findMany: jest.fn() },
    shadowDecision: { create: jest.fn() },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// ─── canDecide ────────────────────────────────────────────────────────────────

describe('canDecide', () => {
  beforeEach(() => jest.clearAllMocks())

  test('hiç sensör yoksa can=false, status=NO_SENSORS döndürmeli', async () => {
    ;(mockPrisma.sensor.findMany as jest.Mock).mockResolvedValue([])

    const result = await canDecide(1)

    expect(result.can).toBe(false)
    expect(result.status).toBe('NO_SENSORS')
  })

  test('son okuma < 15 dakika önce → REAL_TIME döndürmeli', async () => {
    const recentDate = new Date(Date.now() - 10 * 60 * 1000) // 10 dakika önce
    ;(mockPrisma.sensor.findMany as jest.Mock).mockResolvedValue([
      { lastReadingAt: recentDate },
    ])

    const result = await canDecide(1)

    expect(result.can).toBe(true)
    expect(result.status).toBe('REAL_TIME')
  })

  test('son okuma 15-120 dakika arasında → DELAYED döndürmeli', async () => {
    const delayedDate = new Date(Date.now() - 60 * 60 * 1000) // 1 saat önce
    ;(mockPrisma.sensor.findMany as jest.Mock).mockResolvedValue([
      { lastReadingAt: delayedDate },
    ])

    const result = await canDecide(1)

    expect(result.can).toBe(true)
    expect(result.status).toBe('DELAYED')
  })

  test('son okuma > 120 dakika → SENSOR_OFFLINE döndürmeli', async () => {
    const oldDate = new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 saat önce
    ;(mockPrisma.sensor.findMany as jest.Mock).mockResolvedValue([
      { lastReadingAt: oldDate },
    ])

    const result = await canDecide(1)

    expect(result.can).toBe(false)
    expect(result.status).toBe('SENSOR_OFFLINE')
  })

  test('en güncel sensör alınmalı — eski sensör sonucu etkilememeli', async () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000)
    const old = new Date(Date.now() - 5 * 60 * 60 * 1000)
    ;(mockPrisma.sensor.findMany as jest.Mock).mockResolvedValue([
      { lastReadingAt: old },
      { lastReadingAt: recent }, // Bu en güncel
    ])

    const result = await canDecide(1)

    expect(result.can).toBe(true)
    expect(result.status).toBe('REAL_TIME')
  })

  test('lastReadingAt null olan sensör ile en güncel diğerine bakmalı', async () => {
    const recent = new Date(Date.now() - 8 * 60 * 1000)
    ;(mockPrisma.sensor.findMany as jest.Mock).mockResolvedValue([
      { lastReadingAt: null },
      { lastReadingAt: recent },
    ])

    const result = await canDecide(1)

    expect(result.status).toBe('REAL_TIME')
  })
})

// ─── getShadowMode ────────────────────────────────────────────────────────────

describe('getShadowMode', () => {
  test('farmId % 3 === 0 → GHOST döndürmeli', async () => {
    expect(await getShadowMode(3)).toBe('GHOST')
    expect(await getShadowMode(6)).toBe('GHOST')
    expect(await getShadowMode(9)).toBe('GHOST')
  })

  test('farmId % 3 === 1 → LEARNING döndürmeli', async () => {
    expect(await getShadowMode(1)).toBe('LEARNING')
    expect(await getShadowMode(4)).toBe('LEARNING')
    expect(await getShadowMode(7)).toBe('LEARNING')
  })

  test('farmId % 3 === 2 → FULL döndürmeli', async () => {
    expect(await getShadowMode(2)).toBe('FULL')
    expect(await getShadowMode(5)).toBe('FULL')
    expect(await getShadowMode(8)).toBe('FULL')
  })
})

// ─── recordShadowDecision ────────────────────────────────────────────────────

describe('recordShadowDecision', () => {
  beforeEach(() => jest.clearAllMocks())

  test('karar Prisma ile kaydedilmeli', async () => {
    ;(mockPrisma.shadowDecision.create as jest.Mock).mockResolvedValue({ id: 1 })

    await recordShadowDecision(1, 'IRRIGATE', 'GHOST')

    expect(mockPrisma.shadowDecision.create).toHaveBeenCalledWith({
      data: { farmId: 1, mode: 'GHOST', decision: 'IRRIGATE' },
    })
  })
})
