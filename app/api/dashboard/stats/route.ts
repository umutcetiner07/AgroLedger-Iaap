/**
 * API: Dashboard özet istatistikleri.
 * FIX (P1): `findMany` full table scan → `aggregate` + `groupBy` sorgularına dönüştürüldü.
 * FIX (P1): Günlük trend için `$queryRaw` ile DATE_TRUNC kullanıldı — doğru gruplama.
 * FIX: Bölgesel dağılım DB tarafında groupBy ile hesaplanıyor, JS'e veri çekilmiyor.
 * FIX (Vercel Build): force-dynamic ile build-time Prisma init hatası önlendi.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface DailyTrendRow {
  day: Date
  savings: number
}

export async function GET(): Promise<NextResponse> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Tüm aggregate sorgular paralel çalışır — sıralı beklemek yerine aynı anda gönderilir
    const [totalAgg, farmCount, regionalStats, anomalyStats, gatewayStats, dailyTrend] =
      await Promise.all([
        // Toplam tasarruf ve ödeme — tüm tablo taranmadan DB aggregation ile
        prisma.waterSaving.aggregate({
          _sum: { savings: true },
        }),

        // Benzersiz çiftlik sayısı
        prisma.waterSaving.groupBy({
          by: ['farmId'],
          _count: { farmId: true },
        }),

        // Bölgesel istatistikler — DB join + group ile
        // FIX: moduleResolution:bundler $queryRaw<T> generics yerine typed variable kullanılıyor
        prisma.$queryRaw`
          SELECT
            r.name AS "regionName",
            COALESCE(SUM(ws.savings), 0)::float AS "totalSavings",
            COUNT(DISTINCT ws."farmId") AS "farmCount"
          FROM "Region" r
          JOIN "Cooperative" c ON c."regionId" = r.id
          JOIN "Farm" f ON f."cooperativeId" = c.id
          LEFT JOIN "WaterSaving" ws ON ws."farmId" = f.id
          GROUP BY r.id, r.name
          ORDER BY "totalSavings" DESC
        ` as Promise<Array<{ regionName: string; totalSavings: number; farmCount: bigint }>>,

        // Anomali istatistikleri — son 30 gün
        prisma.anomalyLog.groupBy({
          by: ['type'],
          _avg: { confidenceScore: true },
          _count: { id: true },
          where: { createdAt: { gte: thirtyDaysAgo } },
        }),

        // Gateway sağlık dağılımı
        prisma.gatewayHealth.groupBy({
          by: ['status'],
          _count: { id: true },
        }),

        // Günlük trend — DATE_TRUNC ile doğru günlük gruplama (PostgreSQL)
        prisma.$queryRaw`
          SELECT
            DATE_TRUNC('day', "createdAt") AS day,
            COALESCE(SUM(savings), 0)::float AS savings
          FROM "WaterSaving"
          WHERE "createdAt" >= ${sevenDaysAgo}
          GROUP BY DATE_TRUNC('day', "createdAt")
          ORDER BY day ASC
        ` as Promise<DailyTrendRow[]>,
      ])

    const totalSavings = totalAgg._sum.savings ?? 0
    const totalPayment = totalSavings * 0.15

    return NextResponse.json({
      totalSavings: Math.round(totalSavings),
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalFarms: farmCount.length,
      regionalStats: regionalStats.map((r) => ({
        regionName: r.regionName,
        savings: Math.round(r.totalSavings),
        farms: Number(r.farmCount),
      })),
      anomalyStats: anomalyStats.map((stat) => ({
        type: stat.type,
        avgConfidence: Math.round((stat._avg.confidenceScore ?? 0) * 100),
        count: stat._count.id,
      })),
      gatewayHealth: gatewayStats.reduce((acc: Record<string, number>, stat) => {
        acc[stat.status] = stat._count.id
        return acc
      }, {} as Record<string, number>),
      dailyTrend: dailyTrend.map((row) => ({
        date: row.day.toISOString().split('T')[0],
        savings: Math.round(row.savings),
      })),
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Dashboard:stats] Hata:', message)
    return NextResponse.json(
      { error: 'Dashboard istatistikleri alınamadı', detail: message },
      { status: 500 }
    )
  }
}
