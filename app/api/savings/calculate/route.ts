import { NextRequest, NextResponse } from "next/server"
import { WaterSavingsService } from "../../../../lib/waterSavingsService"

export async function POST(req: NextRequest) {
  try {
    const { farmId, actualConsumption } = await req.json()

    const result = await WaterSavingsService.calculateAndSaveSavings({
      farmId,
      actualConsumption
    })

    return NextResponse.json({
      wnb: result.baseline.wnb,
      savedM3: result.savings.savings,
      payment: result.payment,
      baselineType: result.baseline.baselineType,
      validation: result.validation,
      factors: result.baseline.factors
    })
  } catch (error) {
    console.error("Savings calculation error:", error)
    return NextResponse.json(
      { error: "Savings calculation failed" },
      { status: 500 }
    )
  }
}
