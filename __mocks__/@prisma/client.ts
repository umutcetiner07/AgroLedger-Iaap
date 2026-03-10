/**
 * Prisma Client mock'u — testlerde gerçek veritabanı bağlantısı açılmaz.
 * Her test dosyasında jest.mock('@prisma/client') yazmaya gerek kalmaz.
 * Tüm Prisma metodları jest.fn() olarak başlatılır, test içinde override edilebilir.
 */

// Yaygın kullanılan FarmerResponse enum değerleri
export const FarmerResponse = {
  MANUAL_IRRIGATION: 'MANUAL_IRRIGATION',
  CONFIRMED: 'CONFIRMED',
  NO_RESPONSE: 'NO_RESPONSE',
} as const

export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COOP_MANAGER: 'COOP_MANAGER',
  FARMER: 'FARMER',
  WATER_COMMITTEE: 'WATER_COMMITTEE',
} as const

export const ShadowMode = {
  GHOST: 'GHOST',
  LEARNING: 'LEARNING',
  FULL: 'FULL',
} as const

export const BaselineType = {
  PROXY: 'PROXY',
  HYBRID: 'HYBRID',
  REAL: 'REAL',
} as const

// Mock PrismaClient sınıfı
export class PrismaClient {
  weatherLog = {
    aggregate: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  }
  anomalyLog = {
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  }
  sensor = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  }
  farm = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  }
  gatewayHealth = {
    findMany: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    groupBy: jest.fn(),
  }
  maintenanceTicket = {
    findFirst: jest.fn(),
    create: jest.fn(),
  }
  user = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  }
  cooperative = {
    findMany: jest.fn(),
  }
  waterSaving = {
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  }
  waterAlert = {
    count: jest.fn(),
  }
  contract = {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  }
  $transaction = jest.fn((ops: unknown[]) => Promise.all(ops))
  $queryRaw = jest.fn()
  $disconnect = jest.fn()
}
