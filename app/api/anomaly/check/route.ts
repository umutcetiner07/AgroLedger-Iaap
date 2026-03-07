import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "../../../../generated/prisma"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const { sensorId, type, description } = await req.json()

  let score = 5 // initial

  // Rainfall Check
  const sensor = await prisma.sensor.findUnique({
    where: { id: sensorId },
    include: { farm: { include: { cooperative: { include: { region: true } } } } }
  })
  if (!sensor) return NextResponse.json({ error: "Sensor not found" }, { status: 404 })

  const regionId = sensor.farm.cooperative.regionId
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const rainfall = await prisma.weatherLog.aggregate({
    where: { regionId, timestamp: { gte: threeHoursAgo } },
    _sum: { rainfall: true }
  })
  if ((rainfall._sum.rainfall || 0) > 5) score = 0

  // Neighbor Check
  const coopId = sensor.farm.cooperativeId
  const recentAnomalies = await prisma.anomalyLog.count({
    where: {
      sensor: { farm: { cooperativeId: coopId } },
      type,
      createdAt: { gte: threeHoursAgo }
    }
  })
  if (recentAnomalies >= 3) score = 0

  // Manual Check
  if (sensor.farm.manualIrrigationCount > 2) score -= 1

  if (score >= 3) {
    // Save anomaly
    await prisma.anomalyLog.create({
      data: {
        sensorId,
        type,
        description,
        confidenceScore: score / 5,
        farmerId: sensor.farm.farmerId
      }
    })
    // Simulate SMS
    console.log(`SMS sent to farmer: ${sensor.farm.farmer.name} - ${description}`)
  }

  return NextResponse.json({ score, action: score >= 3 ? 'alert' : 'ignore' })
}