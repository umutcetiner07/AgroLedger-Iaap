import "dotenv/config"
import { PrismaClient } from '../generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('demo1234', 10)

  // Regions
  const region1 = await prisma.region.create({ data: { name: 'Almaty Region', code: 'ALA' } })
  const region2 = await prisma.region.create({ data: { name: 'Astana Region', code: 'AST' } })

  // CropTypes
  const crop1 = await prisma.cropType.create({ data: { name: 'Wheat', description: 'Winter wheat' } })
  const crop2 = await prisma.cropType.create({ data: { name: 'Corn', description: 'Maize' } })

  // Users
  const superAdmin = await prisma.user.create({ data: { email: 'super@iaap.kz', name: 'Super Admin', role: 'SUPER_ADMIN', password: hashedPassword } })
  const coopManager1 = await prisma.user.create({ data: { email: 'manager1@iaap.kz', name: 'Coop Manager 1', role: 'COOP_MANAGER', password: hashedPassword } })
  const coopManager2 = await prisma.user.create({ data: { email: 'manager2@iaap.kz', name: 'Coop Manager 2', role: 'COOP_MANAGER', password: hashedPassword } })

  const farmers = []
  for (let i = 1; i <= 8; i++) {
    const farmer = await prisma.user.create({ data: { email: `farmer${i}@iaap.kz`, name: `Farmer ${i}`, role: 'FARMER', password: hashedPassword } })
    farmers.push(farmer)
  }

  // Water Committee
  const committee = await prisma.user.create({ data: { email: 'committee@iaap.kz', name: 'Water Committee', role: 'WATER_COMMITTEE', password: hashedPassword } })

  // Cooperatives
  const coop1 = await prisma.cooperative.create({ data: { name: 'Coop Almaty', regionId: region1.id, managerId: coopManager1.id } })
  const coop2 = await prisma.cooperative.create({ data: { name: 'Coop Astana', regionId: region2.id, managerId: coopManager2.id } })

  // Farms
  const farms = []
  for (let i = 0; i < 8; i++) {
    const farm = await prisma.farm.create({ data: { name: `Farm ${i+1}`, farmerId: farmers[i].id, cooperativeId: i < 4 ? coop1.id : coop2.id, cropTypeId: i % 2 === 0 ? crop1.id : crop2.id, sowingDate: new Date('2024-03-01'), areaHa: 10 + i } })
    farms.push(farm)
  }

  // Sensors
  const sensors = []
  for (let i = 0; i < 16; i++) {
    const sensor = await prisma.sensor.create({ data: { farmId: farms[i % 8].id, name: `Sensor ${i+1}`, type: 'Soil Moisture', lat: 43.222 + (i * 0.01), lng: 76.851 + (i * 0.01), isEstimated: i % 4 === 0, battery: 80 + (i % 20) } })
    sensors.push(sensor)
  }

  // SensorReadings - 30 days
  const now = new Date()
  for (let d = 0; d < 30; d++) {
    const date = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
    for (let s = 0; s < 16; s++) {
      await prisma.sensorReading.create({ data: { sensorId: sensors[s].id, timestamp: date, value: 20 + Math.random() * 30, dataChannel: 'moisture', isEstimated: s % 4 === 0 } })
    }
  }

  // WaterSaving — schema alanları: actualUsage, baselineUsage, savings, baselineType
  await prisma.waterSaving.create({ data: { farmId: farms[0].id, actualUsage: 85, baselineUsage: 100, savings: 15, baselineType: 'PROXY' } })
  await prisma.waterSaving.create({ data: { farmId: farms[1].id, actualUsage: 80, baselineUsage: 100, savings: 20, baselineType: 'HYBRID' } })
  await prisma.waterSaving.create({ data: { farmId: farms[2].id, actualUsage: 75, baselineUsage: 100, savings: 25, baselineType: 'REAL' } })

  // AnomalyLogs
  await prisma.anomalyLog.create({ data: { sensorId: sensors[0].id, type: 'LOW_MOISTURE', description: 'Moisture below threshold', confidenceScore: 0.85, farmerResponse: 'MANUAL_IRRIGATION', responseToken: 'token123' } })
  await prisma.anomalyLog.create({ data: { sensorId: sensors[1].id, type: 'HIGH_TEMPERATURE', description: 'Temperature spike', confidenceScore: 0.90 } })

  console.log('Seed data created successfully')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })