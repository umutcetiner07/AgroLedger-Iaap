/**
 * API: Sensör anomali tespiti.
 * FIX (P1): getServerSession ile kimlik doğrulama eklendi — yetkisiz anomali oluşturmayı engeller.
 * FIX (P1): sensorId ve type için input validation eklendi.
 * FIX: Anlamlı HTTP durum kodları ve loglama eklendi.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AnomalyService } from '@/lib/anomalyService'

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Kimlik doğrulama kontrolü
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON gövdesi' }, { status: 400 })
  }

  const { sensorId, type, description } = body as Record<string, unknown>

  // Zorunlu alan validasyonu
  if (typeof sensorId !== 'number' || sensorId <= 0) {
    return NextResponse.json(
      { error: 'sensorId pozitif bir sayı olmalıdır' },
      { status: 400 }
    )
  }
  if (typeof type !== 'string' || type.trim() === '') {
    return NextResponse.json(
      { error: 'type alanı zorunlu bir string olmalıdır' },
      { status: 400 }
    )
  }
  if (typeof description !== 'string' || description.trim() === '') {
    return NextResponse.json(
      { error: 'description alanı zorunlu bir string olmalıdır' },
      { status: 400 }
    )
  }

  try {
    const result = await AnomalyService.createAnomaly({
      sensorId,
      type: type.trim(),
      description: description.trim(),
    })

    console.info(
      `[Anomaly:check] Kullanıcı=${session.user?.email} | Sensör=${sensorId} | Skor=${result.score.toFixed(2)} | Alert=${result.shouldAlert}`
    )

    return NextResponse.json({
      score: result.score,
      action: result.shouldAlert ? 'alert' : 'ignore',
      anomalyId: result.anomaly?.id ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Anomaly:check] Hata — Sensör=${sensorId}:`, message)
    return NextResponse.json(
      { error: 'Anomali kontrolü başarısız', detail: message },
      { status: 500 }
    )
  }
}