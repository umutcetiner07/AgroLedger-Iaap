import { NextRequest, NextResponse } from "next/server"
import { AnomalyService } from "../../../../lib/anomalyService"

export async function POST(req: NextRequest) {
  try {
    const { sensorId, type, description } = await req.json()

    const result = await AnomalyService.createAnomaly({
      sensorId,
      type,
      description
    })

    return NextResponse.json({
      score: result.score,
      action: result.shouldAlert ? 'alert' : 'ignore',
      anomalyId: result.anomaly?.id
    })
  } catch (error) {
    console.error("Anomaly check error:", error)
    return NextResponse.json(
      { error: "Anomaly check failed" },
      { status: 500 }
    )
  }
}