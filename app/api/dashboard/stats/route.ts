import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WaterSavingsService } from "../../../../lib/waterSavingsService"

export async function GET() {
  try {
    // Toplam su tasarrufu verileri
    const allSavings = await prisma.waterSaving.findMany({
      include: {
        farm: {
          include: {
            cooperative: {
              include: {
                region: true
              }
            }
          }
        }
      }
    })

    const totalSavings = allSavings.reduce((sum, s) => sum + s.savings, 0)
    const totalPayment = totalSavings * 0.15 // TL/m³
    
    // Bölgesel dağılım
    const regionalMap: Record<number, {
      regionName: string
      savings: number
      farms: Set<number>
    }> = {}
    
    allSavings.forEach(saving => {
      const regionId = saving.farm.cooperative.regionId
      if (!regionalMap[regionId]) {
        regionalMap[regionId] = {
          regionName: saving.farm.cooperative.region.name,
          savings: 0,
          farms: new Set()
        }
      }
      regionalMap[regionId].savings += saving.savings
      regionalMap[regionId].farms.add(saving.farmId)
    })

    const regionalStats = Object.values(regionalMap)

    // Anomali istatistikleri
    const anomalyStats = await prisma.anomalyLog.groupBy({
      by: ['type'],
      _avg: {
        confidenceScore: true
      },
      _count: {
        id: true
      },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Son 30 gün
        }
      }
    })

    // Gateway sağlık durumu
    const gatewayStats = await prisma.gatewayHealth.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Son 7 günlük trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const dailySavings = await prisma.waterSaving.groupBy({
      by: ['createdAt'],
      _sum: {
        savings: true
      },
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    return NextResponse.json({
      totalSavings: Math.round(totalSavings),
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalFarms: new Set(allSavings.map(s => s.farmId)).size,
      regionalStats: Object.values(regionalStats).map((stat: any) => ({
        regionName: stat.regionName,
        savings: Math.round(stat.savings),
        farms: stat.farms.size
      })),
      anomalyStats: anomalyStats.map(stat => ({
        type: stat.type,
        avgConfidence: Math.round((stat._avg.confidenceScore || 0) * 100),
        count: stat._count.id
      })),
      gatewayHealth: gatewayStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>),
      dailyTrend: dailySavings.map(day => ({
        date: day.createdAt.toISOString().split('T')[0],
        savings: Math.round(day._sum.savings || 0)
      })),
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
