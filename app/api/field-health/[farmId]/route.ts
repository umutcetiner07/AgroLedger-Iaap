import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "../../../../generated/prisma"

const prisma = new PrismaClient()

function getPhenologyWeights(daysSinceSowing: number) {
  if (daysSinceSowing <= 15) return { ndvi: 0.3, radar: 0.7 }
  if (daysSinceSowing >= 75) return { ndvi: 0.6, radar: 0.4 }
  // Linear interpolation
  const progress = (daysSinceSowing - 15) / (75 - 15)
  const ndvi = 0.3 + progress * (0.6 - 0.3)
  const radar = 0.7 + progress * (0.4 - 0.7)
  return { ndvi, radar }
}

export async function GET(req: NextRequest, { params }: { params: { farmId: string } }) {
  const farmId = parseInt(params.farmId)
  const farm = await prisma.farm.findUnique({ where: { id: farmId } })
  if (!farm) return NextResponse.json({ error: "Farm not found" }, { status: 404 })

  const daysSinceSowing = Math.floor((Date.now() - farm.sowingDate.getTime()) / (1000 * 60 * 60 * 24))
  const weights = getPhenologyWeights(daysSinceSowing)

  // Mock values
  const ndviValue = Math.random() * 0.8 + 0.2
  const radarValue = Math.random() * 0.8 + 0.2

  let score = 0
  if (ndviValue) {
    score = ndviValue * weights.ndvi + radarValue * weights.radar
  } else {
    score = radarValue * 0.85
  }

  // Save
  await prisma.fieldHealthScore.create({
    data: {
      farmId,
      score,
      growthStageDays: daysSinceSowing,
      ndviValue,
      radarValue,
      ndviWeight: weights.ndvi,
      radarWeight: weights.radar
    }
  })

  // Last 30 days trend
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const trend = await prisma.fieldHealthScore.findMany({
    where: { farmId, calculatedAt: { gte: thirtyDaysAgo } },
    orderBy: { calculatedAt: 'asc' }
  })

  return NextResponse.json({ score, trend })
}