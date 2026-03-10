/**
 * API: Su tasarrufu hesaplama ve kaydetme.
 * FIX (P1): getServerSession ile kimlik doğrulama eklendi.
 * FIX (P1): farmId ve actualConsumption için input validation eklendi.
 * FIX: Kullanıcı kimliği loğa yazılır, hata mesajları ayrıntılandırıldı.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WaterSavingsService } from '@/lib/waterSavingsService'

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

  const { farmId, actualConsumption } = body as Record<string, unknown>

  // Zorunlu alan validasyonu
  if (typeof farmId !== 'number' || farmId <= 0) {
    return NextResponse.json(
      { error: 'farmId pozitif bir sayı olmalıdır' },
      { status: 400 }
    )
  }
  if (typeof actualConsumption !== 'number' || actualConsumption < 0) {
    return NextResponse.json(
      { error: 'actualConsumption sıfır veya pozitif bir sayı olmalıdır' },
      { status: 400 }
    )
  }

  try {
    const result = await WaterSavingsService.calculateAndSaveSavings({
      farmId,
      actualConsumption,
    })

    console.info(
      `[Savings:calculate] Kullanıcı=${session.user?.email} | Çiftlik=${farmId} | Tasarruf=${result.savings.savings.toFixed(2)}m³ | Ödeme=₺${result.payment.toFixed(2)}`
    )

    return NextResponse.json({
      wnb: result.baseline.wnb,
      savedM3: result.savings.savings,
      payment: result.payment,
      baselineType: result.baseline.baselineType,
      validation: result.validation,
      factors: result.baseline.factors,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Savings:calculate] Hata — Çiftlik=${farmId}:`, message)
    return NextResponse.json(
      { error: 'Tasarruf hesaplama başarısız', detail: message },
      { status: 500 }
    )
  }
}