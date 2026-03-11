import "dotenv/config"
import { prisma } from './lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Doğrudan veri ekleme başlatılıyor...')
  
  try {
    // 1. User oluştur
    const hashedPassword = await bcrypt.hash('test1234', 10)
    const user = await prisma.user.create({
      data: {
        email: 'farmer@umut.com',
        name: 'Umut Çiftçi',
        password: hashedPassword,
        role: 'FARMER'
      }
    })
    console.log(`✅ User oluşturuldu: ${user.email}`)

    // 2. CropType oluştur
    const cropType = await prisma.cropType.create({
      data: {
        name: 'Wheat',
        description: 'Buğday mahsülü'
      }
    })
    console.log(`✅ CropType oluşturuldu: ${cropType.name}`)

    // 3. Farm oluştur (farmerId ve cropTypeId ile)
    const farm = await prisma.farm.create({
      data: {
        name: 'Umut Farm',
        farmerId: user.id,
        cropTypeId: cropType.id,
        cooperativeId: 1, // Varsayılan kooperatif
        sowingDate: new Date('2024-03-01'),
        areaHa: 10.5
      }
    })
    console.log(`✅ Farm oluşturuldu: ${farm.name} (ID: ${farm.id})`)

    console.log('\n🎉 VERİTABANI HAZIR!')
    console.log(`👤 User ID: ${user.id}`)
    console.log(`🌱 CropType ID: ${cropType.id}`)
    console.log(`🌾 Farm ID: ${farm.id}`)

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
