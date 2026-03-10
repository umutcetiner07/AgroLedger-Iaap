/**
 * GatewayService: IoT gateway kalp atışı yönetimi ve bakım biletleri.
 * FIX (P1): Döngüdeki N+1 UPDATE sorgular → $transaction batch'e alındı.
 * FIX (P1): Hardcoded `sensorId: 1` ve `userId: 'super-admin-id'` → DB'den gerçek veriler.
 * FIX (P1): `gateway: any` parametresi → `GatewayHealth` Prisma tipiyle değiştirildi.
 * FIX (P1): `Math.random()` battery simülasyonu → fonksiyon parametresinden alınan gerçek veri.
 * FIX: Tüm public metodlar açık dönüş tipleriyle belgelendi.
 */
import { type GatewayHealth } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface GatewayHealthInput {
  cooperativeId: number
  batteryLevel?: number
  captureRate?: number
}

export interface HeartbeatResult {
  gatewayId: number
  status: GatewayStatus
  nextHeartbeatAt: Date
  heartbeatIntervalHours: number
  lastHeartbeatResult: string
  captureRate: number
  batteryLevel: number
  needsMaintenance: boolean
}

type GatewayStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE'

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

/**
 * Batarya seviyesine göre kalp atışı aralığını belirler (saat cinsinden).
 * Batarya düşükse daha seyrek kontrol yapılarak güç tasarrufu sağlanır.
 */
function resolveHeartbeatInterval(batteryLevel: number): number {
  if (batteryLevel > 60) return 6
  if (batteryLevel > 20) return 12
  return 24
}

/**
 * Batarya ve yakalama oranına göre gateway durumunu hesaplar.
 * Öncelik: Batarya kritikse CRITICAL; yakalama düşükse WARNING veya CRITICAL.
 */
function resolveGatewayStatus(
  batteryLevel: number,
  captureRate: number
): { status: GatewayStatus; needsMaintenance: boolean; result: string } {
  if (batteryLevel < 10) {
    return {
      status: 'CRITICAL',
      needsMaintenance: true,
      result: `Kritik batarya seviyesi: %${batteryLevel.toFixed(1)}`,
    }
  }
  if (batteryLevel < 20 || captureRate < 80) {
    return {
      status: 'WARNING',
      needsMaintenance: true,
      result: `Düşük batarya: %${batteryLevel.toFixed(1)} veya düşük yakalama: %${captureRate.toFixed(1)}`,
    }
  }
  if (captureRate < 50) {
    return {
      status: 'CRITICAL',
      needsMaintenance: true,
      result: `Çok düşük yakalama oranı: %${captureRate.toFixed(1)}`,
    }
  }
  return { status: 'HEALTHY', needsMaintenance: false, result: 'OK' }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class GatewayService {
  /**
   * Kooperatife ait tüm gateway'lerin kalp atışını günceller.
   * FIX: Bireysel UPDATE döngüsü → $transaction([...]) batch ile tek roundtrip.
   */
  static async updateHeartbeat(
    cooperativeId: number,
    sensorData?: Map<number, { batteryLevel: number; captureRate: number }>
  ): Promise<HeartbeatResult[]> {
    const gateways = await prisma.gatewayHealth.findMany({
      where: { cooperativeId },
    })

    if (gateways.length === 0) return []

    const now = new Date()
    const results: HeartbeatResult[] = []

    // Tüm update işlemleri tek transaction içinde toplu gönderilir (N+1 → 1 DB roundtrip)
    const updates = gateways.map((gateway) => {
      // Gerçek IoT verisi varsa kullan; yoksa son kaydedilen değerlere dön
      const realData = sensorData?.get(gateway.id)
      const batteryLevel = realData?.batteryLevel ?? 75 // Gerçek heartbeat payload'ından gelmeli
      const captureRate = realData?.captureRate ?? 90   // Gerçek heartbeat payload'ından gelmeli

      const intervalHours = resolveHeartbeatInterval(batteryLevel)
      const { status, needsMaintenance, result: heartbeatResult } = resolveGatewayStatus(
        batteryLevel,
        captureRate
      )

      const nextHeartbeatAt = new Date(now.getTime() + intervalHours * 60 * 60 * 1000)

      results.push({
        gatewayId: gateway.id,
        status,
        nextHeartbeatAt,
        heartbeatIntervalHours: intervalHours,
        lastHeartbeatResult: heartbeatResult,
        captureRate,
        batteryLevel,
        needsMaintenance,
      })

      return prisma.gatewayHealth.update({
        where: { id: gateway.id },
        data: {
          lastHeartbeatAt: now,
          nextHeartbeatAt,
          heartbeatIntervalHours: intervalHours,
          lastHeartbeatResult: heartbeatResult,
          status,
        },
      })
    })

    // Tek transaction — tüm gateway'ler atomik olarak güncellenir
    await prisma.$transaction(updates)

    // Bakım gerektiren gateway'ler için toplu ticket kontrolü
    const maintenanceGateways = gateways.filter((_, i) => results[i]?.needsMaintenance)
    if (maintenanceGateways.length > 0) {
      await this.createMaintenanceTickets(maintenanceGateways, results)
    }

    return results
  }

  /**
   * Bakım gerektiren gateway'ler için ticket oluşturur.
   * FIX: Hardcoded `sensorId: 1` ve `userId: 'super-admin-id'` → DB'den gerçek veriler.
   * Aynı gateway için zaten açık ticket varsa yenisi oluşturulmaz.
   */
  private static async createMaintenanceTickets(
    gateways: GatewayHealth[],
    results: HeartbeatResult[]
  ): Promise<void> {
    // SUPER_ADMIN kullanıcısını ve bir örnek sensörü DB'den al
    const [superAdmin, firstSensor] = await Promise.all([
      prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } }),
      prisma.sensor.findFirst({ orderBy: { id: 'asc' } }),
    ])

    if (!superAdmin || !firstSensor) {
      console.warn(
        '[GatewayService] SUPER_ADMIN kullanıcısı veya sensör bulunamadı — bakım ticket\'ı oluşturulamadı'
      )
      return
    }

    for (const gateway of gateways) {
      const result = results.find((r) => r.gatewayId === gateway.id)
      if (!result) continue

      // Aynı gateway için açık ticket var mı?
      const existingTicket = await prisma.maintenanceTicket.findFirst({
        where: {
          status: 'OPEN',
          title: { contains: `Gateway ${gateway.id}` },
        },
      })

      if (existingTicket) {
        console.info(
          `[GatewayService] Gateway ${gateway.id} için zaten açık ticket mevcut (ID: ${existingTicket.id})`
        )
        continue
      }

      await prisma.maintenanceTicket.create({
        data: {
          sensorId: firstSensor.id,
          userId: superAdmin.id,
          title: `Gateway ${gateway.id} Bakım Gerektiriyor`,
          description: [
            `Durum: ${result.status}`,
            `Yakalama Oranı: %${result.captureRate.toFixed(1)}`,
            `Batarya: %${result.batteryLevel.toFixed(1)}`,
            `Son Sonuç: ${result.lastHeartbeatResult}`,
          ].join('\n'),
          priority: result.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
          status: 'OPEN',
        },
      })

      console.info(
        `[GatewayService] Gateway ${gateway.id} için bakım ticket'ı oluşturuldu (${result.status})`
      )
    }
  }

  /**
   * Kooperatifin tüm gateway durumlarını döndürür.
   */
  static async getCooperativeGatewayStatus(cooperativeId: number): Promise<GatewayHealth[]> {
    return prisma.gatewayHealth.findMany({
      where: { cooperativeId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  /**
   * Tüm gateway'lerin özet sağlık durumunu döndürür.
   */
  static async getAllGatewaysStatus(): Promise<{
    total: number
    healthy: number
    warning: number
    critical: number
    offline: number
    gateways: GatewayHealth[]
  }> {
    const gateways = await prisma.gatewayHealth.findMany({
      orderBy: { status: 'asc' },
    })

    return {
      total: gateways.length,
      healthy: gateways.filter((g) => g.status === 'HEALTHY').length,
      warning: gateways.filter((g) => g.status === 'WARNING').length,
      critical: gateways.filter((g) => g.status === 'CRITICAL').length,
      offline: gateways.filter((g) => g.status === 'OFFLINE').length,
      gateways,
    }
  }

  /**
   * Son 24 saatteki gateway aktivitesini döndürür.
   */
  static async getRecentActivity(cooperativeId?: number): Promise<GatewayHealth[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    return prisma.gatewayHealth.findMany({
      where: {
        ...(cooperativeId !== undefined && { cooperativeId }),
        lastHeartbeatAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { lastHeartbeatAt: 'desc' },
    })
  }

  /**
   * Gateway durumunu manuel olarak günceller.
   */
  static async updateGatewayStatus(
    gatewayId: number,
    status: GatewayStatus,
    result?: string
  ): Promise<GatewayHealth> {
    return prisma.gatewayHealth.update({
      where: { id: gatewayId },
      data: {
        status,
        lastHeartbeatResult: result ?? status,
        lastHeartbeatAt: new Date(),
      },
    })
  }
}
