import "dotenv/config"
import { prisma } from './lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Hızlı seed başlatılıyor...')
  
  try {
    // 1. Önce mevcut verileri temizle
    console.log('🧹 Veriler temizleniyor...')
    await prisma.sensor.deleteMany({})
    await prisma.farm.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.cropType.deleteMany({})
    await prisma.region.deleteMany({})
    await prisma.cooperative.deleteMany({})
    console.log('✅ Temizleme tamamlandı')

    // 2. Region oluştur
    const region = await prisma.region.create({
      data: {
        name: 'Test Bölgesi',
        code: 'TEST-001'
      }
    })

    // 3. Cooperative oluştur
    const cooperative = await prisma.cooperative.create({
      data: {
        name: 'Test Kooperatifi',
        regionId: region.id,
        managerId: 'temp-manager'
      }
    })

    // 4. CropType oluştur
    const cropType = await prisma.cropType.create({
      data: {
        name: 'Test Mahsulü',
        description: 'Test amaçlı mahsül'
      }
    })

    // 5. User (Farmer) oluştur
    const hashedPassword = await bcrypt.hash('test1234', 10)
    const user = await prisma.user.create({
      data: {
        email: 'farmer@test.com',
        name: 'Test Çiftçi',
        password: hashedPassword,
        role: 'FARMER'
      }
    })

    // 6. Farm oluştur
    const farm = await prisma.farm.create({
      data: {
        name: 'Test Çiftliği',
        farmerId: user.id,
        cooperativeId: cooperative.id,
        cropTypeId: cropType.id,
        sowingDate: new Date('2024-03-01'),
        areaHa: 10.5
      }
    })

    // 7. 3 Sensör oluştur
    const sensors = await Promise.all([
      prisma.sensor.create({
        data: {
          farmId: farm.id,
          name: 'Sensör 1 - Nem',
          type: 'MOISTURE',
          lat: 41.0082,
          lng: 28.9784,
          isEstimated: false,
          battery: 95.5,
          lastReadingAt: new Date()
        }
      }),
      prisma.sensor.create({
        data: {
          farmId: farm.id,
          name: 'Sensör 2 - Sıcaklık',
          type: 'TEMPERATURE',
          lat: 41.0083,
          lng: 28.9785,
          isEstimated: false,
          battery: 88.2,
          lastReadingAt: new Date()
        }
      }),
      prisma.sensor.create({
        data: {
          farmId: farm.id,
          name: 'Sensör 3 - Işık',
          type: 'LIGHT',
          lat: 41.0084,
          lng: 28.9786,
          isEstimated: false,
          battery: 92.1,
          lastReadingAt: new Date()
        }
      })
    ])

    console.log('\n📊 VERİLER BAŞARIYLA EKLENDİ:')
    console.log(`👤 User: ${user.email}`)
    console.log(`🌾 Farm: ${farm.name} (ID: ${farm.id})`)
    console.log(`🌱 CropType: ${cropType.name}`)
    console.log(`📡 Sensörler: ${sensors.length} adet`)
    sensors.forEach(sensor => {
      console.log(`   - ${sensor.name} (Batarya: ${sensor.battery}%)`)
    })

    console.log('\n🎉 Dashboard kontrol edilebilir!')

  } catch (error) {
    console.error('❌ Hata:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed hatası:', error)
    process.exit(1)
  })
