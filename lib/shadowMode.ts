import { prisma } from "@/lib/prisma"
// FIX: Prisma generate öncesi type erişimi için string literal kullanıldı
type ShadowMode = 'GHOST' | 'LEARNING' | 'FULL'

export async function getShadowMode(farmId: number): Promise<ShadowMode> {
  // Simple logic based on farmId
  if (farmId % 3 === 0) return "GHOST"
  if (farmId % 3 === 1) return "LEARNING"
  return "FULL"
}

export async function recordShadowDecision(farmId: number, suggested: string, mode: ShadowMode) {
  await prisma.shadowDecision.create({
    data: {
      farmId,
      mode,
      decision: suggested
    }
  })
}