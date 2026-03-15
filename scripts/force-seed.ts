import "dotenv/config"
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Force seed başlatılıyor...')
  
  try {
    // 1. Önce CropType oluştur (Wheat)
    console.log('🌾 CropType oluşturuluyor...')
    const cropType = await prisma.cropType.upsert({
      where: { id: 1 }, // ID ile unique key kullan
      update: {
        name: 'Wheat',
        description: 'Buğday mahsülü'
      },
      create: {
        id: 1,
        name: 'Wheat',
        description: 'Buğday mahsülü'
      }
    })
    console.log(`✅ CropType: ${cropType.name} (ID: ${cropType.id})`)

    // 2. User oluştur (Umut)
    console.log('👤 User oluşturuluyor...')
    const hashedPassword = await bcrypt.hash('test1234', 10)
    const user = await prisma.user.upsert({
      where: { email: 'umut@test.com' }, // Email unique
      update: {
        name: 'Umut',
        password: hashedPassword,
        role: 'FARMER'
      },
      create: {
        email: 'umut@test.com',
        name: 'Umut',
        password: hashedPassword,
        role: 'FARMER'
      }
    })
    console.log(`✅ User: ${user.name} (${user.email}) (ID: ${user.id})`)

    // 3. Farm oluştur (Umut Farm) - ilişkili olarak
    console.log('🌾 Farm oluşturuluyor...')
    
    // Varsayılan cooperative ve region ID'leri kontrol et
    let cooperativeId = 1
    let regionId = 1
    
    // Eğer cooperative yoksa oluştur
    const cooperative = await prisma.cooperative.upsert({
      where: { id: cooperativeId },
      update: {},
      create: {
        id: cooperativeId,
        name: 'Test Kooperatifi',
        regionId: regionId,
        managerId: user.id
      }
    })

    // Eğer region yoksa oluştur
    await prisma.region.upsert({
      where: { id: regionId },
      update: {},
      create: {
        id: regionId,
        name: 'Test Bölgesi',
        code: 'TEST-001'
      }
    })

    const farm = await prisma.farm.upsert({
      where: { id: 1 }, // ID ile unique key kullan
      update: {
        name: 'Umut Farm',
        farmerId: user.id,
        cropTypeId: cropType.id,
        cooperativeId: cooperativeId,
        sowingDate: new Date('2024-03-01'),
        areaHa: 10.5
      },
      create: {
        id: 1,
        name: 'Umut Farm',
        farmerId: user.id,
        cropTypeId: cropType.id,
        cooperativeId: cooperativeId,
        sowingDate: new Date('2024-03-01'),
        areaHa: 10.5
      }
    })
    console.log(`✅ Farm: ${farm.name} (ID: ${farm.id})`)

    // 4. Kontrol - Kaç farm var?
    const totalFarms = await prisma.farm.count()
    const totalUsers = await prisma.user.count()
    const totalCropTypes = await prisma.cropType.count()

    console.log('\n📊 VERİTABANI DURUMU:')
    console.log(`🌾 Toplam CropType: ${totalCropTypes}`)
    console.log(`👤 Toplam User: ${totalUsers}`)
    console.log(`🌾 Toplam Farm: ${totalFarms}`)
    
    // 5. Farm detaylarını kontrol et
    const farmDetails = await prisma.farm.findUnique({
      where: { id: farm.id },
      include: {
        farmer: true,
        cropType: true,
        cooperative: {
          include: {
            region: true
          }
        }
      }
    })

    if (farmDetails) {
      console.log('\n🔍 FARM DETAYLARI:')
      console.log(`📝 Adı: ${farmDetails.name}`)
      console.log(`👤 Çiftçi: ${farmDetails.farmer.name} (${farmDetails.farmer.email})`)
      console.log(`🌾 Mahsül: ${farmDetails.cropType.name}`)
      console.log(`🏢 Kooperatif: ${farmDetails.cooperative.name}`)
      console.log(`📍 Bölge: ${farmDetails.cooperative.region?.name || 'Belirsiz'}`)
      console.log(`📏 Alan: ${farmDetails.areaHa} hektar`)
      console.log(`📅 Ekim Tarihi: ${farmDetails.sowingDate.toLocaleDateString('tr-TR')}`)
    }

    console.log('\n🎉 DONE - Veriler başarıyla eklendi!')
    console.log('🌐 Artık API test edilebilir!')
    
  } catch (error) {
    console.error('❌ Hata:', error)
    console.error('🔍 Hata detayı:', error.message)
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
