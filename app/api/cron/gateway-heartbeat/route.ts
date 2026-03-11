import { NextResponse } from "next/server"
import { GatewayService } from "../../../../lib/gatewayService"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Tüm kooperatiflerin gateway'lerini kontrol et
    const cooperatives = await prisma.cooperative.findMany()
    const allResults: any[] = []

    for (const coop of cooperatives) {
      const results = await GatewayService.updateHeartbeat(coop.id)
      allResults.push(...results)
    }

    // Özet istatistikler
    const summary = {
      totalGateways: allResults.length,
      healthy: allResults.filter(r => r.status === 'HEALTHY').length,
      warning: allResults.filter(r => r.status === 'WARNING').length,
      critical: allResults.filter(r => r.status === 'CRITICAL').length,
      maintenanceNeeded: allResults.filter(r => r.needsMaintenance).length
    }

    return NextResponse.json({
      status: 'Heartbeat updated successfully',
      summary,
      details: allResults
    })
  } catch (error) {
    console.error("Gateway heartbeat error:", error)
    return NextResponse.json(
      { error: "Gateway heartbeat failed" },
      { status: 500 }
    )
  }
}
