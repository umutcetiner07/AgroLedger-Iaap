import { NextResponse } from "next/server"
import { PrismaClient } from "../../../../generated/prisma"

const prisma = new PrismaClient()

export async function GET() {
  // Simulate Gateway A silence, measure Gateway B
  const gateways = await prisma.gatewayHealth.findMany()

  for (const gw of gateways) {
    // Mock battery
    const battery = Math.random() * 100
    let intervalHours = 6
    if (battery > 60) intervalHours = 6
    else if (battery > 20) intervalHours = 12
    else intervalHours = 24

    await prisma.gatewayHealth.update({
      where: { id: gw.id },
      data: { heartbeatIntervalHours: intervalHours }
    })

    // Mock failover
    const captureRate = Math.random() * 100
    if (captureRate < 80) {
      await prisma.maintenanceTicket.create({
        data: {
          sensorId: 1, // mock
          userId: 'super-admin-id', // mock, but use real
          title: 'Gateway Failover',
          description: `Low capture rate: ${captureRate}%`
        }
      })
    }
  }

  return NextResponse.json({ status: 'Heartbeat updated' })
}