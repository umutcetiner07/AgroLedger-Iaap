/**
 * Prisma Client tek örnek (singleton) fabrikası.
 * Development'ta hot-reload sırasında birden fazla PrismaClient oluşmasını önler.
 * FIX (P1): `export default` → `export const` (named export) yapıldı.
 * Tüm import tarafları `import { prisma }` kullandığından client kodu değişmez.
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error', 'warn'] })

// Development'ta global nesneye kaydet; üretimde her istek yeni instance açmaz
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
