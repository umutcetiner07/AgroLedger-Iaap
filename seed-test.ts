import "dotenv/config"
import { prisma } from './lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Test verileri ekleniyor...')
  
  try {
    // 1. Önce tüm verileri temizle (test için)
    console.log('🧹 Mevcut veriler temizleniyor...')
    
    // Anomalileri temizle
    await prisma.anomalyLog.deleteMany({})
    
    // Sensör okumalarını temizle
    await prisma.sensorReading.deleteMany({})
    
    // Sensörleri temizle
    await prisma.sensor.deleteMany({})
    
    // Çiftlikleri temizle
    await prisma.farm.deleteMany({})
    
    // Kullanıcıları temizle (admin hariç)
    await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@agroledger.com'
        }
      }
    })

    console.log('✅ Veriler temizlendi')

    // 2. Test Çiftliği oluştur
    console.log('🏞 Test çiftliği oluşturuluyor...')
    
    const testFarm = await prisma.farm.create({
      data: {
        name: 'Test Çiftliği',
        farmerId: 'test-farmer-001',
        cooperativeId: 1,
        cropTypeId: 1,
        sowingDate: new Date('2024-03-01'),
        areaHa: 10.5,
        manualIrrigationCount: 0
      }
    })

    console.log(`✅ Çiftlik oluşturuldu: ${testFarm.name} (ID: ${testFarm.id})`)

    // 3. Sağlıklı Sensörler oluştur (3 adet)
    console.log('📡 Sağlıklı sensörler oluşturuluyor...')
    
    const healthySensors = [
      {
        farmId: testFarm.id,
        name: 'Nem Sensörü 1',
        type: 'MOISTURE',
        lat: 41.0082,
        lng: 28.9784,
        isEstimated: false,
        battery: 95.5,
        lastReadingAt: new Date(Date.now() - 5 * 60 * 1000) // 5 dakika önce
      },
      {
        farmId: testFarm.id,
        name: 'Sıcaklık Sensörü 2',
        type: 'TEMPERATURE',
        lat: 41.0083,
        lng: 28.9785,
        isEstimated: false,
        battery: 88.2,
        lastReadingAt: new Date(Date.now() - 3 * 60 * 1000) // 3 dakika önce
      },
      {
        farmId: testFarm.id,
        name: 'Işık Sensörü 3',
        type: 'LIGHT',
        lat: 41.0084,
        lng: 28.9786,
        isEstimated: false,
        battery: 92.1,
        lastReadingAt: new Date(Date.now() - 2 * 60 * 1000) // 2 dakika önce
      }
    ]

    const createdSensors = await Promise.all(
      healthySensors.map(sensor => 
        prisma.sensor.create({ data: sensor })
      )
    )

    console.log(`✅ ${createdSensors.length} sağlıklı sensör oluşturuldu`)

    // 4. Sensör Okumaları Ekle
    console.log('📊 Sensör okumaları ekleniyor...')
    
    const readings: any[] = []
    const now = new Date()
    
    createdSensors.forEach((sensor, index) => {
      // Son 24 saatteki okumalar
      for (let i = 0; i < 10; i++) {
        const readingTime = new Date(now.getTime() - (i * 60 * 60 * 1000))
        
        readings.push({
          sensorId: sensor.id,
          timestamp: readingTime,
          value: Math.random() * 100, // Rastgele değer
          dataChannel: sensor.type.toLowerCase(),
          isEstimated: false
        })
      }
    })

    // Tek tek ekle (createMany yerine)
    for (const reading of readings) {
      await prisma.sensorReading.create({ data: reading })
    }

    console.log(`✅ ${readings.length} sensör okuması eklendi`)

    // 5. Test Kullanıcısı Oluştur
    console.log('👤 Test kullanıcısı oluşturuluyor...')
    
    const hashedPassword = await bcrypt.hash('test1234', 10)
    
    const testUser = await prisma.user.create({
      data: {
        email: 'test-farmer@agroledger.com',
        name: 'Test Çiftçi',
        password: hashedPassword,
        role: 'FARMER'
      }
    })

    console.log(`✅ Test kullanıcısı oluşturuldu: ${testUser.email}`)

    // 6. Özet Bilgiler
    const totalSensors = await prisma.sensor.count()
    const totalFarms = await prisma.farm.count()
    const totalReadings = await prisma.sensorReading.count()
    const totalUsers = await prisma.user.count()

    console.log('\n📊 VERİTABANI ÖZETİ:')
    console.log(`🌾 Toplam Çiftlik: ${totalFarms}`)
    console.log(`📡 Toplam Sensör: ${totalSensors}`)
    console.log(`📊 Toplam Okuma: ${totalReadings}`)
    console.log(`👤 Toplam Kullanıcı: ${totalUsers}`)
    console.log(`🔋 Sensör Batarya Ortalaması: ${(healthySensors.reduce((sum, s) => sum + (s as any).battery, 0) / healthySensors.length).toFixed(1)}%`)
    
    // 7. Decision Guard Test
    console.log('\n🛡️ Decision Guard Testi...')
    const { Logger } = await import('./lib/logger')
    
    // DecisionGuard'ı test et
    const decisionResult = await (await import('./lib/decisionGuard')).canDecide(testFarm.id)
    
    console.log(`🎯 Karar Sonucu: ${decisionResult.status}`)
    console.log(`✅ Karar Verilebilir: ${decisionResult.can}`)
    
    if (decisionResult.details) {
      console.log('📋 Detaylar:', decisionResult.details)
    }

    console.log('\n🎉 TEST VERİLERİ BAŞARIYLA EKLENDİ!')
    console.log('🌐 API artık test edilebilir!')
    
  } catch (error) {
    console.error('❌ Hata:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('❌ Seed script hatası:', error)
    process.exit(1)
  })
