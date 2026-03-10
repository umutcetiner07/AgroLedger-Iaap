/**
 * AnomalyService: Sensör anomali tespiti ve güven skoru hesaplama.
 * FIX: `Promise<any>` dönüş tipleri kaldırıldı; açık AnomalyLog interface'i kullanıldı.
 * FIX: `console.log` SMS simülasyonu → yapısal loglama ile bildirim servisi placeholder'ı.
 * FIX: `respondToAnomaly` için farmerId yetkilendirme kontrolü eklendi.
 */
import { type AnomalyLog, type FarmerResponse } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface AnomalyCheckInput {
  sensorId: number
  type: string
  description: string
}

export interface ConfidenceScoreFactors {
  rainfallFactor: number
  neighborAnomalyFactor: number
  manualIrrigationFactor: number
  sensorBatteryFactor: number
  historicalAccuracyFactor: number
}

export interface ConfidenceScoreResult {
  score: number
  factors: ConfidenceScoreFactors
  shouldAlert: boolean
}

export interface CreateAnomalyResult {
  anomaly: AnomalyLog | null
  shouldAlert: boolean
  score: number
}

// Faktör ağırlıkları — tarımsal önem sırasına göre ayarlandı
const FACTOR_WEIGHTS: Record<keyof ConfidenceScoreFactors, number> = {
  rainfallFactor: 0.30,
  neighborAnomalyFactor: 0.25,
  manualIrrigationFactor: 0.20,
  sensorBatteryFactor: 0.15,
  historicalAccuracyFactor: 0.10,
}

const ALERT_THRESHOLD = 0.6 // %60 ve üzeri → bildirim gönder

// ─── Service ──────────────────────────────────────────────────────────────────

export class AnomalyService {
  /**
   * Birden fazla faktörü değerlendirerek anomali güven skorunu hesaplar.
   * Skor 0.0 (düşük güven) - 1.0 (yüksek güven) arasındadır.
   */
  static async calculateConfidenceScore(
    input: AnomalyCheckInput
  ): Promise<ConfidenceScoreResult> {
    const { sensorId, type } = input

    const sensor = await prisma.sensor.findUnique({
      where: { id: sensorId },
      include: {
        farm: { include: { cooperative: { include: { region: true } } } },
      },
    })

    if (!sensor) {
      throw new Error(`Sensör bulunamadı (ID: ${sensorId})`)
    }

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const regionId = sensor.farm.cooperative.regionId
    const coopId = sensor.farm.cooperativeId

    // Tüm faktör verileri paralel olarak sorgulanır
    const [rainfall, neighborAnomalies, historicalAnomalies] = await Promise.all([
      // Faktör 1: Son 3 saatte yağış var mı? (yağış varsa anomali daha az güvenilir)
      prisma.weatherLog.aggregate({
        where: { regionId, timestamp: { gte: threeHoursAgo } },
        _sum: { rainfall: true },
      }),

      // Faktör 2: Komşu sensörlerde aynı tip anomali var mı?
      prisma.anomalyLog.count({
        where: {
          sensor: { farm: { cooperativeId: coopId } },
          type,
          createdAt: { gte: threeHoursAgo },
        },
      }),

      // Faktör 5: Son 30 günde bu sensörün tarihsel anomali doğruluğu
      prisma.anomalyLog.count({
        where: {
          sensorId,
          farmerResponse: { not: null },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ])

    // Faktör hesaplamaları
    const rainfallFactor = (rainfall._sum.rainfall ?? 0) > 5 ? 0 : 1
    const neighborAnomalyFactor = neighborAnomalies >= 3 ? 0 : 1
    const manualIrrigationFactor = sensor.farm.manualIrrigationCount > 2 ? 0.5 : 1
    const sensorBatteryFactor = (sensor.battery ?? 100) > 20 ? 1 : 0.5
    const historicalAccuracyFactor = historicalAnomalies > 0 ? 0.8 : 1

    const factors: ConfidenceScoreFactors = {
      rainfallFactor,
      neighborAnomalyFactor,
      manualIrrigationFactor,
      sensorBatteryFactor,
      historicalAccuracyFactor,
    }

    // Ağırlıklı ortalama skor
    const score = (Object.keys(factors) as Array<keyof ConfidenceScoreFactors>).reduce(
      (acc, key) => acc + factors[key] * FACTOR_WEIGHTS[key],
      0
    )

    return { score, factors, shouldAlert: score >= ALERT_THRESHOLD }
  }

  /**
   * Anomali kaydı oluşturur; eşik aşılırsa çiftçiye bildirim gönderir.
   */
  static async createAnomaly(input: AnomalyCheckInput): Promise<CreateAnomalyResult> {
    const { score, shouldAlert, factors } = await this.calculateConfidenceScore(input)

    if (!shouldAlert) {
      return { anomaly: null, shouldAlert, score }
    }

    // Sensörü bir kez daha çek — farm.farmerId'ye erişim için
    const sensor = await prisma.sensor.findUnique({
      where: { id: input.sensorId },
      include: { farm: { select: { id: true, farmerId: true, name: true } } },
    })

    if (!sensor) {
      return { anomaly: null, shouldAlert, score }
    }

    const anomaly = await prisma.anomalyLog.create({
      data: {
        sensorId: input.sensorId,
        type: input.type,
        description: input.description,
        confidenceScore: score,
        farmerId: sensor.farm.farmerId,
      },
    })

    // SMS/bildirim servisi placeholder — gerçek implementasyonda twilio/smtp çağrısı yapılır
    await this.sendFarmerNotification({
      farmerId: sensor.farm.farmerId,
      farmName: sensor.farm.name,
      description: input.description,
      score,
      anomalyId: anomaly.id,
    })

    console.info(
      `[AnomalyService] Anomali oluşturuldu — ID=${anomaly.id} | Tip=${input.type} | Skor=${score.toFixed(2)} | Çiftçi=${sensor.farm.farmerId}`,
      { factors }
    )

    return { anomaly, shouldAlert, score }
  }

  /**
   * Çiftçi yanıtını günceller — yalnızca yetkili çiftçi yanıt verebilir.
   */
  static async respondToAnomaly(
    anomalyId: number,
    farmerId: string,
    response: FarmerResponse
  ): Promise<AnomalyLog> {
    // Yetkisiz erişimi önle — anomaly farmerId ile oturum farmerId eşleşmeli
    const anomaly = await prisma.anomalyLog.findUnique({
      where: { id: anomalyId },
      select: { farmerId: true },
    })

    if (!anomaly) {
      throw new Error(`Anomali kaydı bulunamadı (ID: ${anomalyId})`)
    }

    if (anomaly.farmerId !== farmerId) {
      throw new Error('Bu anomaliye yanıt verme yetkiniz yok')
    }

    return prisma.anomalyLog.update({
      where: { id: anomalyId },
      data: { farmerResponse: response, resolvedAt: new Date() },
    })
  }

  /**
   * Çiftçi bildirim servisi.
   * FIX: `console.log` SMS simülasyonu → spesifik bildirim fonksiyonu.
   * Gerçek implementasyonda Twilio veya benzeri servis entegrasyonu yapılır.
   */
  private static async sendFarmerNotification(params: {
    farmerId: string
    farmName: string
    description: string
    score: number
    anomalyId: number
  }): Promise<void> {
    const { farmerId, farmName, description, score, anomalyId } = params

    // TODO: Twilio SMS veya email servisi entegre edildiğinde buraya eklenir
    // Şimdilik yapısal log kaydı tutulur
    console.info(
      `[Notification] SMS bildirimi bekliyor — Çiftçi=${farmerId} | Çiftlik=${farmName} | Anomali=#${anomalyId} | Skor=%${(score * 100).toFixed(0)} | Açıklama: ${description}`
    )
  }
}
