import "dotenv/config"
import { PrismaClient } from '../generated/prisma'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'

const prisma = new PrismaClient()

// Create write stream for logging
const logStream = fs.createWriteStream('seed-output.log', { flags: 'w' })

const originalConsoleLog = console.log
console.log = (...args) => {
  originalConsoleLog(...args)
  logStream.write(args.join(' ') + '\n')
}

async function main() {
  console.log('🌱 BerekeAI AgroLedger - Kazakh Farmers Seed Starting...')
  
  try {
    // 1. Delete all existing data first
    console.log('🧹 Cleaning existing data...')
    await prisma.sensorReading.deleteMany({})
    await prisma.irrigationEvent.deleteMany({})
    await prisma.maintenanceTicket.deleteMany({})
    await prisma.anomalyLog.deleteMany({})
    await prisma.waterSaving.deleteMany({})
    await prisma.fieldHealthScore.deleteMany({})
    await prisma.shadowDecision.deleteMany({})
    await prisma.sensor.deleteMany({})
    await prisma.complianceReport.deleteMany({})
    await prisma.contract.deleteMany({})
    await prisma.farm.deleteMany({})
    await prisma.cooperative.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.cropType.deleteMany({})
    await prisma.region.deleteMany({})
    console.log('✅ All data cleaned')

    // 2. Create Regions
    console.log('📍 Creating regions...')
    const regions = await Promise.all([
      prisma.region.create({
        data: { name: 'Almaty Region', code: 'ALM' }
      }),
      prisma.region.create({
        data: { name: 'Turkestan Region', code: 'TRK' }
      }),
      prisma.region.create({
        data: { name: 'Karaganda Region', code: 'KRG' }
      }),
      prisma.region.create({
        data: { name: 'Pavlodar Region', code: 'PVL' }
      }),
      prisma.region.create({
        data: { name: 'Kostanay Region', code: 'KST' }
      })
    ])

    // 3. Create Crop Types
    console.log('🌾 Creating crop types...')
    const cropTypes = await Promise.all([
      prisma.cropType.create({
        data: { name: 'Wheat', description: 'Common wheat variety' }
      }),
      prisma.cropType.create({
        data: { name: 'Cotton', description: 'Cotton crop' }
      }),
      prisma.cropType.create({
        data: { name: 'Sunflower', description: 'Sunflower seeds' }
      }),
      prisma.cropType.create({
        data: { name: 'Barley', description: 'Barley grain' }
      }),
      prisma.cropType.create({
        data: { name: 'Rice', description: 'Rice paddy' }
      })
    ])

    // 4. Create Admin User for Cooperative Managers
    console.log('Creating admin user...')
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@berekeai.kz',
        name: 'BerekeAI Admin',
        password: await bcrypt.hash('admin2024', 10),
        role: 'SUPER_ADMIN'
      }
    })

    // 5. Create Cooperatives
    console.log('Creating cooperatives...')
    const cooperatives = await Promise.all([
      prisma.cooperative.create({
        data: {
          name: 'Almaty Agricultural Cooperative',
          regionId: regions[0].id,
          managerId: adminUser.id
        }
      }),
      prisma.cooperative.create({
        data: {
          name: 'Turkestan Farm Union',
          regionId: regions[1].id,
          managerId: adminUser.id
        }
      }),
      prisma.cooperative.create({
        data: {
          name: 'Karaganda Farmers Association',
          regionId: regions[2].id,
          managerId: adminUser.id
        }
      }),
      prisma.cooperative.create({
        data: {
          name: 'Pavlodar Agricultural Collective',
          regionId: regions[3].id,
          managerId: adminUser.id
        }
      }),
      prisma.cooperative.create({
        data: {
          name: 'Kostanay Farm Partnership',
          regionId: regions[4].id,
          managerId: adminUser.id
        }
      })
    ])

    // 6. Create Farmers (Users)
    console.log('👨‍🌾 Creating farmers...')
    const hashedPassword = await bcrypt.hash('kazakh2024', 10)
    
    const farmers = await Promise.all([
      prisma.user.create({
        data: {
          email: 'aibek.dzhaksybekov@berekeai.kz',
          name: 'Aibek Dzhaksybekov',
          password: hashedPassword,
          role: 'FARMER'
        }
      }),
      prisma.user.create({
        data: {
          email: 'nursultan.bekov@berekeai.kz',
          name: 'Nursultan Bekov',
          password: hashedPassword,
          role: 'FARMER'
        }
      }),
      prisma.user.create({
        data: {
          email: 'zarina.akhmetova@berekeai.kz',
          name: 'Zarina Akhmetova',
          password: hashedPassword,
          role: 'FARMER'
        }
      }),
      prisma.user.create({
        data: {
          email: 'marat.seitkali@berekeai.kz',
          name: 'Marat Seitkali',
          password: hashedPassword,
          role: 'FARMER'
        }
      }),
      prisma.user.create({
        data: {
          email: 'aigul.nurmagambetova@berekeai.kz',
          name: 'Aigul Nurmagambetova',
          password: hashedPassword,
          role: 'FARMER'
        }
      })
    ])

    // 6. Create Farms with real Kazakhstan GPS coordinates
    console.log('🏞️ Creating farms...')
    const farmData = [
      {
        name: 'Aibek\'s Wheat Farm North',
        farmerId: farmers[0].id,
        cooperativeId: cooperatives[0].id,
        cropTypeId: cropTypes[0].id, // Wheat
        sowingDate: new Date('2024-03-15'),
        areaHa: 120.5
      },
      {
        name: 'Aibek\'s Cotton Field South',
        farmerId: farmers[0].id,
        cooperativeId: cooperatives[0].id,
        cropTypeId: cropTypes[1].id, // Cotton
        sowingDate: new Date('2024-04-01'),
        areaHa: 85.0
      },
      {
        name: 'Nursultan\'s Sunflower Estate',
        farmerId: farmers[1].id,
        cooperativeId: cooperatives[1].id,
        cropTypeId: cropTypes[2].id, // Sunflower
        sowingDate: new Date('2024-03-20'),
        areaHa: 95.3
      },
      {
        name: 'Nursultan\'s Rice Paddy',
        farmerId: farmers[1].id,
        cooperativeId: cooperatives[1].id,
        cropTypeId: cropTypes[4].id, // Rice
        sowingDate: new Date('2024-04-10'),
        areaHa: 45.8
      },
      {
        name: 'Zarina\'s Barley Field',
        farmerId: farmers[2].id,
        cooperativeId: cooperatives[2].id,
        cropTypeId: cropTypes[3].id, // Barley
        sowingDate: new Date('2024-03-25'),
        areaHa: 150.0
      },
      {
        name: 'Zarina\'s Wheat Expansion',
        farmerId: farmers[2].id,
        cooperativeId: cooperatives[2].id,
        cropTypeId: cropTypes[0].id, // Wheat
        sowingDate: new Date('2024-03-18'),
        areaHa: 200.0
      },
      {
        name: 'Marat\'s Cotton Farm',
        farmerId: farmers[3].id,
        cooperativeId: cooperatives[3].id,
        cropTypeId: cropTypes[1].id, // Cotton
        sowingDate: new Date('2024-04-05'),
        areaHa: 75.6
      },
      {
        name: 'Marat\'s Sunflower Field',
        farmerId: farmers[3].id,
        cooperativeId: cooperatives[3].id,
        cropTypeId: cropTypes[2].id, // Sunflower
        sowingDate: new Date('2024-03-22'),
        areaHa: 55.2
      },
      {
        name: 'Aigul\'s Wheat Farm',
        farmerId: farmers[4].id,
        cooperativeId: cooperatives[4].id,
        cropTypeId: cropTypes[0].id, // Wheat
        sowingDate: new Date('2024-03-12'),
        areaHa: 180.7
      },
      {
        name: 'Aigul\'s Barley Field',
        farmerId: farmers[4].id,
        cooperativeId: cooperatives[4].id,
        cropTypeId: cropTypes[3].id, // Barley
        sowingDate: new Date('2024-03-28'),
        areaHa: 95.4
      }
    ]

    // Store GPS coordinates for sensor creation
    const farmCoordinates = [
      { lat: 43.2220, lng: 76.8512 }, // Almaty region
      { lat: 43.1220, lng: 76.9512 }, // Almaty region
      { lat: 43.3020, lng: 68.2702 }, // Turkestan region
      { lat: 43.2520, lng: 68.3202 }, // Turkestan region
      { lat: 49.8043, lng: 73.1408 }, // Karaganda region
      { lat: 49.7543, lng: 73.1908 }, // Karaganda region
      { lat: 52.2833, lng: 76.9667 }, // Pavlodar region
      { lat: 52.2333, lng: 77.0167 }, // Pavlodar region
      { lat: 53.2144, lng: 63.6246 }, // Kostanay region
      { lat: 53.1644, lng: 63.6746 }  // Kostanay region
    ]

    const farms = await Promise.all(
      farmData.map(farm => prisma.farm.create({ data: farm }))
    )

    // 7. Create Field Health Scores (FHS: 45-95)
    console.log('📊 Creating field health scores...')
    const fieldHealthScores = await Promise.all(
      farms.map((farm, index) => {
        const score = Math.floor(Math.random() * 51) + 45 // 45-95 range
        const growthStage = Math.floor(Math.random() * 90) + 30 // 30-120 days
        const ndvi = (Math.random() * 0.6 + 0.3).toFixed(3) // 0.3-0.9 range
        const radar = (Math.random() * 0.5 + 0.4).toFixed(3) // 0.4-0.9 range
        
        return prisma.fieldHealthScore.create({
          data: {
            farmId: farm.id,
            score: score,
            growthStageDays: growthStage,
            ndviValue: parseFloat(ndvi),
            radarValue: parseFloat(radar),
            ndviWeight: 0.5,
            radarWeight: 0.5
          }
        })
      })
    )

    // 8. Create Water Savings with irrigation dates (within past 30 days)
    console.log('💧 Creating water savings data...')
    const waterSavings = await Promise.all(
      farms.map((farm, index) => {
        const daysAgo = Math.floor(Math.random() * 30) + 1 // 1-30 days ago
        const lastIrrigation = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        const actualUsage = Math.floor(Math.random() * 5000) + 2000 // 2000-7000 cubic meters
        const baselineUsage = actualUsage * (1 + Math.random() * 0.3 + 0.1) // 10-40% higher baseline
        const savings = baselineUsage - actualUsage
        
        return prisma.waterSaving.create({
          data: {
            farmId: farm.id,
            createdAt: lastIrrigation,
            actualUsage: actualUsage,
            baselineUsage: baselineUsage,
            savings: savings,
            baselineType: 'HYBRID'
          }
        })
      })
    )

    // 9. Create Credit Applications (Contracts)
    console.log('💳 Creating credit applications...')
    const creditStatuses = ['APPROVED', 'PENDING', 'REJECTED']
    const contracts = await Promise.all(
      farmers.map((farmer, index) => {
        const status = creditStatuses[index % 3]
        const startDate = new Date('2024-01-01')
        const endDate = status === 'APPROVED' ? new Date('2024-12-31') : null
        
        return prisma.contract.create({
          data: {
            farmId: farms[index * 2].id, // First farm of each farmer
            farmerId: farmer.id,
            savingsSharePct: 15.0 + Math.random() * 10, // 15-25%
            slaFrozen: status === 'APPROVED',
            startDate: startDate,
            endDate: endDate
          }
        })
      })
    )

    // 10. Create Sensors for each farm
    console.log('📡 Creating sensors...')
    const sensorTypes = ['MOISTURE', 'TEMPERATURE', 'LIGHT', 'PH', 'NUTRIENT']
    const sensors: {
      farmId: number;
      name: string;
      type: string;
      lat: number;
      lng: number;
      isEstimated: boolean;
      battery: number;
      lastReadingAt: Date;
    }[] = []
    
    farms.forEach((farm, farmIndex) => {
      const farmLat = farmCoordinates[farmIndex].lat
      const farmLng = farmCoordinates[farmIndex].lng
      
      sensorTypes.forEach((type, typeIndex) => {
        sensors.push({
          farmId: farm.id,
          name: `${farm.name} - ${type} Sensor`,
          type: type,
          lat: farmLat + (Math.random() - 0.5) * 0.01, // Small variation
          lng: farmLng + (Math.random() - 0.5) * 0.01,
          isEstimated: false,
          battery: 70 + Math.random() * 30, // 70-100%
          lastReadingAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Within 24h
        })
      })
    })
    
    const createdSensors = await Promise.all(
      sensors.map(sensor => prisma.sensor.create({ data: sensor }))
    )

    // Summary
    console.log('\n📊 SEED SUMMARY:')
    console.log(`📍 Regions: ${regions.length}`)
    console.log(`🤝 Cooperatives: ${cooperatives.length}`)
    console.log(`🌾 Crop Types: ${cropTypes.length}`)
    console.log(`👨‍🌾 Farmers: ${farmers.length}`)
    console.log(`🏞️ Farms: ${farms.length}`)
    console.log(`📊 Field Health Scores: ${fieldHealthScores.length}`)
    console.log(`💧 Water Savings: ${waterSavings.length}`)
    console.log(`💳 Credit Applications: ${contracts.length}`)
    console.log(`📡 Sensors: ${createdSensors.length}`)
    
    console.log('\n🎉 KAZAKH FARMERS DATA SUCCESSFULLY SEEDED!')
    console.log('🌐 BerekeAI AgroLedger is ready for testing!')
    
    // Display farmer credentials
    console.log('\n🔑 FARMER CREDENTIALS:')
    farmers.forEach((farmer, index) => {
      console.log(`${index + 1}. ${farmer.name}`)
      console.log(`   Email: ${farmer.email}`)
      console.log(`   Password: kazakh2024`)
      console.log(`   Region: ${regions[index].name}`)
      console.log(`   Farms: ${farms.filter(f => f.farmerId === farmer.id).length}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Seeding error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed script error:', error)
    process.exit(1)
  })