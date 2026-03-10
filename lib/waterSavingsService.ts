/**
 * WaterSavingsService: Su tasarrufu hesaplama ve kaydetme.
 * FIX (P1): regionNorm ve weatherFactor artık sabit değil — WeatherLog tablosundan hesaplanıyor.
 * FIX (P1): `sensors: { include: { readings: true } }` → readings için son 1000 kayıt limiti.
 * FIX (P1): Ödeme oranı `Contract.savingsSharePct` üzerinden dinamik hesaplanıyor.
 * FIX: Tüm `any` tipleri kaldırıldı, açık interface'ler tanımlandı.
 */
import { type WaterSaving } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface WaterSavingsInput {
  farmId: number
  actualConsumption: number
}

export interface BaselineCalculation {
  wnb: number
  baselineType: 'PROXY' | 'HYBRID' | 'REAL'
  factors: {
    regionNorm: number
    weatherFactor: number
    realMonths: number
    proxyValue?: number
    realValue?: number
  }
}

export interface SavingsValidation {
  isValid: boolean
  warnings: string[]
}

export interface CalculateSavingsResult {
  savings: WaterSaving
  baseline: BaselineCalculation
  payment: number
  validation: SavingsValidation
}

export interface FarmSavingsStats {
  totalSavings: number
  averageSavingsPercentage: number
  farmsCount: number
  baselineTypeDistribution: Record<string, number>
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

/**
 * Son 30 günlük WeatherLog verilerinden hava etkisi katsayısını hesaplar.
 * Yüksek yağış → daha az sulama ihtiyacı (düşük katsayı).
 * FIX: Hardcoded 1.2 yerine gerçek meteorolojik veri kullanılıyor.
 */
async function calculateWeatherFactor(regionId: number): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const weatherAgg = await prisma.weatherLog.aggregate({
    where: { regionId, timestamp: { gte: thirtyDaysAgo } },
    _sum: { rainfall: true },
    _avg: { tempC: true, humidity: true },
  })

  const totalRainfall = weatherAgg._sum.rainfall ?? 0
  const avgTemp = weatherAgg._avg.tempC ?? 20
  const avgHumidity = weatherAgg._avg.humidity ?? 50

  // Sulama ihtiyacı heuristics:
  // yüksek yağış → düşük sulama ihtiyacı / düşük yağış + sıcaklık → yüksek ihtiyaç
  if (totalRainfall >= 50) return 0.8   // Yeterli yağış — az sulama
  if (totalRainfall >= 20) return 1.0   // Normal
  if (avgTemp > 30 && avgHumidity < 40) return 1.5  // Sıcak + kuru → çok sulama
  return 1.2                            // Varsayılan hafif kuraklık
}

/**
 * Bölgenin geçmiş su tüketim ortalamalarından bölgesel norm hesaplar.
 * FIX: Hardcoded 100 m³/hektar yerine DB geçmişi kullanılıyor.
 */
async function calculateRegionNorm(regionId: number): Promise<number> {
  const regionAvg = await prisma.waterSaving.aggregate({
    where: {
      farm: { cooperative: { regionId } },
    },
    _avg: { baselineUsage: true },
  })

  // Yeterli tarihsel veri yoksa FAO-56 referans değerine geri dön (100 m³/hektar)
  return regionAvg._avg.baselineUsage ?? 100
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class WaterSavingsService {
  /**
   * Water Needs Baseline (WNB) hesaplar.
   * PROXY → HYBRID → REAL geçişi gerçek sensör verisi ay sayısına göre belirlenir.
   */
  static async calculateBaseline(farmId: number): Promise<BaselineCalculation> {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        cooperative: { include: { region: true } },
        sensors: {
          include: {
            // FIX: Tüm readings yerine en güncel 1000 kayıt alınır — bellek optimizasyonu
            readings: {
              orderBy: { timestamp: 'desc' },
              take: 1000,
            },
          },
        },
      },
    })

    if (!farm) throw new Error(`Çiftlik bulunamadı (ID: ${farmId})`)

    const regionId = farm.cooperative.regionId
    const readings = farm.sensors.flatMap((s) => s.readings)
    const uniqueMonths = new Set(readings.map((r) => r.timestamp.getMonth()))
    const realMonths = uniqueMonths.size

    // FIX: Bölge normu ve hava faktörü DB'den hesaplanıyor
    const [regionNorm, weatherFactor] = await Promise.all([
      calculateRegionNorm(regionId),
      calculateWeatherFactor(regionId),
    ])

    let wnb = 0
    let baselineType: 'PROXY' | 'HYBRID' | 'REAL' = 'PROXY'
    let proxyValue: number | undefined
    let realValue: number | undefined

    if (realMonths === 0) {
      baselineType = 'PROXY'
      wnb = regionNorm * weatherFactor
      proxyValue = wnb
    } else if (realMonths < 12) {
      baselineType = 'HYBRID'
      const weight = realMonths / 12
      proxyValue = regionNorm * weatherFactor
      const avgReading =
        readings.reduce((sum, r) => sum + r.value, 0) / readings.length
      realValue = avgReading || proxyValue
      wnb = (1 - weight) * proxyValue + weight * realValue
    } else {
      baselineType = 'REAL'
      const threeYearsAgo = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)
      const recentReadings = readings.filter((r) => r.timestamp >= threeYearsAgo)
      const avgRecent =
        recentReadings.length > 0
          ? recentReadings.reduce((sum, r) => sum + r.value, 0) / recentReadings.length
          : regionNorm
      realValue = avgRecent
      wnb = realValue * weatherFactor
    }

    return {
      wnb,
      baselineType,
      factors: { regionNorm, weatherFactor, realMonths, proxyValue, realValue },
    }
  }

  /**
   * Su tasarrufunu hesaplar, doğrular ve kaydeder.
   * FIX: Ödeme oranı çiftliğin aktif sözleşmesinden alınıyor (Contract.savingsSharePct).
   */
  static async calculateAndSaveSavings(
    input: WaterSavingsInput
  ): Promise<CalculateSavingsResult> {
    const { farmId, actualConsumption } = input

    const [baseline, activeContract] = await Promise.all([
      this.calculateBaseline(farmId),
      prisma.contract.findFirst({
        where: { farmId, slaFrozen: false },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const savedM3 = Math.max(0, baseline.wnb - actualConsumption)
    const savingsPercentage = baseline.wnb > 0 ? (savedM3 / baseline.wnb) * 100 : 0

    // FIX: Sabit 0.15 TL/m³ yerine sözleşmeden dinamik oran — yoksa 0.15 TL varsayılan
    const sharePercent = activeContract?.savingsSharePct ?? 15
    const paymentRatePerM3 = 0.15 * (sharePercent / 15) // 15% = 0.15 TL base
    const payment = savedM3 * paymentRatePerM3

    const validation = this.validateSavingsData({
      actualConsumption,
      baseline: baseline.wnb,
      savings: savedM3,
      savingsPercentage,
    })

    const savings = await prisma.waterSaving.create({
      data: {
        farmId,
        actualUsage: actualConsumption,
        baselineUsage: baseline.wnb,
        savings: savedM3,
        baselineType: baseline.baselineType,
      },
    })

    console.info(
      `[WaterSavings] Çiftlik=${farmId} | Baseline=${baseline.wnb.toFixed(2)}m³ | Gerçek=${actualConsumption}m³ | Tasarruf=${savedM3.toFixed(2)}m³ | Ödeme=₺${payment.toFixed(2)}`
    )

    return { savings, baseline, payment, validation }
  }

  /**
   * Su tasarrufu verilerini iş kurallarına göre doğrular.
   * Private — yalnızca calculateAndSaveSavings içinden çağrılır.
   */
  private static validateSavingsData(data: {
    actualConsumption: number
    baseline: number
    savings: number
    savingsPercentage: number
  }): SavingsValidation {
    const warnings: string[] = []
    let isValid = true

    if (data.actualConsumption < 0) {
      warnings.push('Negatif tüketim değeri — sensör verisi kontrol edilmeli')
      isValid = false
    }

    if (data.actualConsumption === 0) {
      warnings.push('Sıfır tüketim — sensör arızası veya izole çiftlik olabilir')
    }

    if (data.savingsPercentage > 50) {
      warnings.push('Tasarruf oranı %50 üzeri — olağandışı değer, doğrulama önerilir')
    }

    if (data.baseline > 0 && data.actualConsumption / data.baseline > 2) {
      warnings.push(
        'Tüketim baseline\'ın 2 katından fazla — anormallik araştırılmalı'
      )
    }

    return { isValid, warnings }
  }

  /**
   * Çiftliğin geçmiş tasarruf kayıtlarını döndürür.
   */
  static async getFarmSavingsHistory(
    farmId: number,
    months = 12
  ): Promise<WaterSaving[]> {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    return prisma.waterSaving.findMany({
      where: { farmId, createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Bölgesel su tasarrufu istatistiklerini DB aggregation ile hesaplar.
   */
  static async getRegionalSavingsStats(regionId: number): Promise<FarmSavingsStats> {
    const [totalAgg, countResult, distribution] = await Promise.all([
      prisma.waterSaving.aggregate({
        where: { farm: { cooperative: { regionId } } },
        _sum: { savings: true },
        _avg: { savings: true, baselineUsage: true },
      }),

      prisma.farm.count({ where: { cooperative: { regionId } } }),

      prisma.waterSaving.groupBy({
        by: ['baselineType'],
        where: { farm: { cooperative: { regionId } } },
        _count: { id: true },
      }),
    ])

    const totalSavings = totalAgg._sum.savings ?? 0
    const avgSavings = totalAgg._avg.savings ?? 0
    const avgBaseline = totalAgg._avg.baselineUsage ?? 1
    const averageSavingsPercentage =
      avgBaseline > 0 ? (avgSavings / avgBaseline) * 100 : 0

    const baselineTypeDistribution = distribution.reduce<Record<string, number>>(
      (acc, d) => {
        acc[d.baselineType] = d._count.id
        return acc
      },
      {}
    )

    return {
      totalSavings,
      averageSavingsPercentage,
      farmsCount: countResult,
      baselineTypeDistribution,
    }
  }
}
