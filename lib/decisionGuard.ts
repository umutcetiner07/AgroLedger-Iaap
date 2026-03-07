import { PrismaClient } from "../generated/prisma"

const prisma = new PrismaClient()

export async function canDecide(farmId: number): Promise<{ can: boolean, status: string }> {
  const sensors = await prisma.sensor.findMany({
    where: { farmId },
    select: { lastReadingAt: true }
  })

  if (sensors.length === 0) return { can: false, status: "NO_SENSORS" }

  const now = new Date()
  const latest = sensors.reduce((latest, sensor) => {
    if (!sensor.lastReadingAt) return latest
    return sensor.lastReadingAt > latest ? sensor.lastReadingAt : latest
  }, new Date(0))

  const diffMs = now.getTime() - latest.getTime()
  const diffMin = diffMs / (1000 * 60)

  if (diffMin < 15) return { can: true, status: "REAL_TIME" }
  if (diffMin < 120) return { can: true, status: "DELAYED" }
  return { can: false, status: "SENSOR_OFFLINE" }
}