import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "../../../../generated/prisma"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const { farmId, actualConsumption } = await req.json()

  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: { cooperative: { include: { region: true } }, sensors: { include: { readings: true } } }
  })
  if (!farm) return NextResponse.json({ error: "Farm not found" }, { status: 404 })

  // Calculate realMonths
  const readings = farm.sensors.flatMap(s => s.readings)
  const uniqueMonths = new Set(readings.map(r => r.timestamp.getMonth()))
  const realMonths = uniqueMonths.size

  let wnb = 0
  const regionNorm = 100 // mock
  const weatherFactor = 1.2 // mock

  if (realMonths < 12) {
    // HYBRID
    const w = realMonths / 12
    const proxy = regionNorm * weatherFactor
    const realAvg = readings.reduce((sum, r) => sum + r.value, 0) / readings.length || proxy
    wnb = (1 - w) * proxy + w * realAvg
  } else {
    // REAL
    const last3Years = readings.filter(r => r.timestamp > new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000))
    const realAvg = last3Years.reduce((sum, r) => sum + r.value, 0) / last3Years.length || regionNorm
    wnb = realAvg * weatherFactor
  }

  const savedM3 = Math.max(0, wnb - actualConsumption)
  const payment = savedM3 * 0.15 // mock price

  // Save to WaterSaving
  await prisma.waterSaving.create({
    data: {
      farmId,
      baselineType: realMonths < 12 ? 'HYBRID' : 'REAL',
      savingsPct: savedM3 / wnb * 100,
      calculatedAt: new Date()
    }
  })

  return NextResponse.json({ wnb, savedM3, payment })
}