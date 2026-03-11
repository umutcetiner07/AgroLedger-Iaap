/**
 * Cron: SLA dondurma kontrolü.
 * FIX (P0): CRON_SECRET header doğrulaması eklendi.
 * FIX: try-catch ve anlamlı loglama eklendi.
 * Aktif hava uyarısı varsa tüm aktif sözleşmeler dondurulur.
 */
export const dynamic = 'force-dynamic'
import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  if (!validateCronSecret(req)) {
    console.warn('[Cron:sla-check] Yetkisiz erişim denemesi')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const activeAlertCount = await prisma.weatherAlert.count({
      where: { active: true },
    })

    if (activeAlertCount === 0) {
      console.info('[Cron:sla-check] Aktif uyarı yok — SLA değişmedi')
      return NextResponse.json({ status: 'SLA checked', frozen: false, alertCount: 0 })
    }

    // Yalnızca henüz dondurulmamış aktif sözleşmeleri dondur
    const { count } = await prisma.contract.updateMany({
      where: { slaFrozen: false },
      data: { slaFrozen: true },
    })

    console.info(
      `[Cron:sla-check] ${activeAlertCount} aktif uyarı nedeniyle ${count} sözleşme donduruldu`
    )

    return NextResponse.json({
      status: 'SLA checked',
      frozen: true,
      alertCount: activeAlertCount,
      contractsFrozen: count,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Cron:sla-check] Hata:', message)
    return NextResponse.json(
      { error: 'SLA check failed', detail: message },
      { status: 500 }
    )
  }
}