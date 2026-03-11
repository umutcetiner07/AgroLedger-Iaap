/**
 * Cron: Gateway kalp atışı güncellemesi.
 * FIX (P0): CRON_SECRET header doğrulaması eklendi — yetkisiz tetiklemeyi engeller.
 * Her kooperatifin gateway'leri güncellenip bakım ticket'ları oluşturulur.
 */
export const dynamic = 'force-dynamic'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GatewayService } from '@/lib/gatewayService'

/**
 * Authorization header'daki CRON_SECRET değerini doğrular.
 * Vercel Cron Jobs, Authorization: Bearer <secret> header'ı otomatik gönderir.
 */
function validateCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET ortam değişkeni tanımlanmamış')
    return false
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Yetkisiz erişimi erken reddet
  if (!validateCronSecret(req)) {
    console.warn('[Cron:gateway-heartbeat] Yetkisiz erişim denemesi')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cooperatives = await prisma.cooperative.findMany({
      select: { id: true, name: true },
    })

    const allResults = await Promise.all(
      cooperatives.map((coop) => GatewayService.updateHeartbeat(coop.id))
    )

    const flatResults = allResults.flat()

    const summary = {
      totalGateways: flatResults.length,
      healthy: flatResults.filter((r) => r.status === 'HEALTHY').length,
      warning: flatResults.filter((r) => r.status === 'WARNING').length,
      critical: flatResults.filter((r) => r.status === 'CRITICAL').length,
      maintenanceNeeded: flatResults.filter((r) => r.needsMaintenance).length,
    }

    console.info('[Cron:gateway-heartbeat] Tamamlandı:', summary)

    return NextResponse.json({
      status: 'Heartbeat updated successfully',
      summary,
      details: flatResults,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Cron:gateway-heartbeat] Kritik hata:', message)
    return NextResponse.json(
      { error: 'Gateway heartbeat failed', detail: message },
      { status: 500 }
    )
  }
}