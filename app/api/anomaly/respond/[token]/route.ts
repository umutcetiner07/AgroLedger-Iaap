import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// FIX (Vercel Build): Prisma'nın build-time statik değerlendirmesini önle
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { response } = await req.json()

  const anomaly = await prisma.anomalyLog.findFirst({
    where: { responseToken: params.token }
  })

  if (!anomaly) return NextResponse.json({ error: "Invalid token" }, { status: 404 })

  const tokenExpiry = new Date(anomaly.createdAt.getTime() + 30 * 60 * 1000)
  if (new Date() > tokenExpiry) return NextResponse.json({ error: "Token expired" }, { status: 410 })

  await prisma.anomalyLog.update({
    where: { id: anomaly.id },
    data: {
      farmerResponse: response,
      responseToken: null,
      resolvedAt: new Date()
    }
  })

  if (response === "MANUAL_IRRIGATION") {
    const sensor = await prisma.sensor.findUnique({ where: { id: anomaly.sensorId } })
    if (sensor) {
      await prisma.farm.update({
        where: { id: sensor.farmId },
        data: { manualIrrigationCount: { increment: 1 } }
      })
    }
  }

  return NextResponse.json({ success: true })
}
