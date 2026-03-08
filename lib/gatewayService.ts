import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

export interface GatewayHealthInput {
  cooperativeId: number
  status?: string
  lastHeartbeatResult?: string
  batteryLevel?: number
  captureRate?: number
}

export interface HeartbeatResult {
  gatewayId: number
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE'
  nextHeartbeatAt: Date
  heartbeatIntervalHours: number
  lastHeartbeatResult: string
  captureRate?: number
  batteryLevel?: number
  needsMaintenance: boolean
}

export class GatewayService {
  /**
   * Gateway kalp atışı güncelle
   */
  static async updateHeartbeat(cooperativeId: number): Promise<HeartbeatResult[]> {
    const gateways = await prisma.gatewayHealth.findMany({
      where: { cooperativeId },
      include: {
        cooperative: true
      }
    })

    const results: HeartbeatResult[] = []

    for (const gateway of gateways) {
      // Mock battery ve capture rate
      const batteryLevel = Math.random() * 100
      const captureRate = Math.random() * 100

      // Kalp atışı aralığını belirle (batarya durumuna göre)
      let intervalHours = 6
      if (batteryLevel > 60) intervalHours = 6
      else if (batteryLevel > 20) intervalHours = 12
      else intervalHours = 24

      // Durum belirle
      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' = 'HEALTHY'
      let needsMaintenance = false
      let lastHeartbeatResult = 'OK'

      if (batteryLevel < 10) {
        status = 'CRITICAL'
        needsMaintenance = true
        lastHeartbeatResult = 'Critical battery level'
      } else if (batteryLevel < 20 || captureRate < 80) {
        status = 'WARNING'
        needsMaintenance = true
        lastHeartbeatResult = `Low battery: ${batteryLevel.toFixed(1)}% or Low capture: ${captureRate.toFixed(1)}%`
      } else if (captureRate < 50) {
        status = 'CRITICAL'
        needsMaintenance = true
        lastHeartbeatResult = `Very low capture rate: ${captureRate.toFixed(1)}%`
      }

      const nextHeartbeatAt = new Date()
      nextHeartbeatAt.setHours(nextHeartbeatAt.getHours() + intervalHours)

      // Gateway'i güncelle
      const updatedGateway = await prisma.gatewayHealth.update({
        where: { id: gateway.id },
        data: {
          lastHeartbeatAt: new Date(),
          nextHeartbeatAt,
          heartbeatIntervalHours: intervalHours,
          lastHeartbeatResult,
          status
        }
      })

      // Bakım gerekliyse ticket oluştur
      if (needsMaintenance) {
        await this.createMaintenanceTicket(updatedGateway, captureRate, batteryLevel)
      }

      results.push({
        gatewayId: updatedGateway.id,
        status,
        nextHeartbeatAt,
        heartbeatIntervalHours: intervalHours,
        lastHeartbeatResult,
        captureRate,
        batteryLevel,
        needsMaintenance
      })
    }

    return results
  }

  /**
   * Bakım ticket'ı oluştur
   */
  private static async createMaintenanceTicket(
    gateway: any,
    captureRate: number,
    batteryLevel: number
  ): Promise<void> {
    // Aynı gateway için açık ticket var mı kontrol et
    const existingTicket = await prisma.maintenanceTicket.findFirst({
      where: {
        status: 'OPEN',
        title: { contains: `Gateway ${gateway.id}` }
      }
    })

    if (existingTicket) return // Açık ticket varsa yenisi oluşturma

    await prisma.maintenanceTicket.create({
      data: {
        sensorId: 1, // Mock sensor ID - gerçek sistemde güncellenmeli
        userId: 'super-admin-id', // Mock user ID - gerçek sistemde güncellenmeli
        title: `Gateway ${gateway.id} Bakım Gerektiriyor`,
        description: `Durum: ${gateway.status}\nYakalama Oranı: ${captureRate.toFixed(1)}%\nBatarya: ${batteryLevel.toFixed(1)}%\nSon Sonuç: ${gateway.lastHeartbeatResult}`,
        priority: gateway.status === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
        status: 'OPEN'
      }
    })

    console.log(`Maintenance ticket created for Gateway ${gateway.id}`)
  }

  /**
   * Kooperatifin gateway durumunu getir
   */
  static async getCooperativeGatewayStatus(cooperativeId: number): Promise<any[]> {
    return await prisma.gatewayHealth.findMany({
      where: { cooperativeId },
      include: {
        cooperative: true
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  /**
   * Tüm gateway'lerin genel durumunu getir
   */
  static async getAllGatewaysStatus(): Promise<{
    total: number
    healthy: number
    warning: number
    critical: number
    offline: number
    gateways: any[]
  }> {
    const gateways = await prisma.gatewayHealth.findMany({
      include: {
        cooperative: true
      }
    })

    const status = {
      total: gateways.length,
      healthy: gateways.filter(g => g.status === 'HEALTHY').length,
      warning: gateways.filter(g => g.status === 'WARNING').length,
      critical: gateways.filter(g => g.status === 'CRITICAL').length,
      offline: gateways.filter(g => g.status === 'OFFLINE').length
    }

    return {
      ...status,
      gateways
    }
  }

  /**
   * Gateway durumunu manuel olarak güncelle
   */
  static async updateGatewayStatus(
    gatewayId: number,
    status: string,
    result?: string
  ): Promise<any> {
    return await prisma.gatewayHealth.update({
      where: { id: gatewayId },
      data: {
        status,
        lastHeartbeatResult: result || status,
        lastHeartbeatAt: new Date()
      }
    })
  }

  /**
   * Son 24 saatteki gateway aktivitesini getir
   */
  static async getRecentActivity(cooperativeId?: number): Promise<any[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const whereClause = cooperativeId 
      ? { cooperativeId, lastHeartbeatAt: { gte: twentyFourHoursAgo } }
      : { lastHeartbeatAt: { gte: twentyFourHoursAgo } }

    return await prisma.gatewayHealth.findMany({
      where: whereClause,
      include: {
        cooperative: true
      },
      orderBy: { lastHeartbeatAt: 'desc' }
    })
  }
}
