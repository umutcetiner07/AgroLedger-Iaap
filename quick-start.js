const { PrismaClient } = require('./generated/prisma')

async function main() {
  console.log('🌱 Quick start başlatılıyor...')
  
  try {
    const prisma = new PrismaClient()
    
    // 1. User oluştur
    console.log('👤 User oluşturuluyor...')
    const user = await prisma.user.upsert({
      where: { email: 'umut@agroledger.com' },
      update: {
        name: 'Umut'
      },
      create: {
        id: 'admin_1',
        name: 'Umut',
        email: 'umut@agroledger.com',
        role: 'FARMER'
      }
    })
    console.log(`✅ User: ${user.name} (${user.email})`)

    // 2. Region oluştur
    console.log('🌍 Region oluşturuluyor...')
    const region = await prisma.region.upsert({
      where: { id: 1 },
      update: {
        name: 'Kazakhstan Region',
        code: 'KZ-01'
      },
      create: {
        id: 1,
        name: 'Kazakhstan Region',
        code: 'KZ-01'
      }
    })
    console.log(`✅ Region: ${region.name}`)

    // 3. CropType oluştur
    console.log('🌾 CropType oluşturuluyor...')
    const cropType = await prisma.cropType.upsert({
      where: { id: 1 },
      update: {
        name: 'Wheat'
      },
      create: {
        id: 1,
        name: 'Wheat',
        description: 'Buğday mahsülü'
      }
    })
    console.log(`✅ CropType: ${cropType.name}`)

    // 4. Cooperative oluştur
    console.log('🏢 Cooperative oluşturuluyor...')
    const cooperative = await prisma.cooperative.upsert({
      where: { id: 1 },
      update: {
        name: 'Kazakhstan Alpha Cooperative',
        regionId: region.id,
        managerId: user.id
      },
      create: {
        id: 1,
        name: 'Kazakhstan Alpha Cooperative',
        regionId: region.id,
        managerId: user.id
      }
    })
    console.log(`✅ Cooperative: ${cooperative.name}`)

    // 5. Farm oluştur
    console.log('🌾 Farm oluşturuluyor...')
    const farm = await prisma.farm.upsert({
      where: { id: 1 },
      update: {
        name: 'Kazakhstan Alpha Farm',
        farmerId: user.id,
        cropTypeId: cropType.id,
        cooperativeId: cooperative.id
      },
      create: {
        id: 1,
        name: 'Kazakhstan Alpha Farm',
        farmerId: user.id,
        cropTypeId: cropType.id,
        cooperativeId: cooperative.id,
        sowingDate: new Date('2024-03-01'),
        areaHa: 15.0
      }
    })
    console.log(`✅ Farm: ${farm.name}`)

    // 6. Kontrol
    const totalUsers = await prisma.user.count()
    const totalRegions = await prisma.region.count()
    const totalCropTypes = await prisma.cropType.count()
    const totalCooperatives = await prisma.cooperative.count()
    const totalFarms = await prisma.farm.count()

    console.log('\n📊 VERİTABANI DURUMU:')
    console.log(`👤 Toplam User: ${totalUsers}`)
    console.log(`� Toplam Region: ${totalRegions}`)
    console.log(`�🌾 Toplam CropType: ${totalCropTypes}`)
    console.log(`🏢 Toplam Cooperative: ${totalCooperatives}`)
    console.log(`🌾 Toplam Farm: ${totalFarms}`)

    // 5. Farm detayları
    const farmDetails = await prisma.farm.findUnique({
      where: { id: 1 },
      include: {
        farmer: true,
        cropType: true
      }
    })

    if (farmDetails) {
      console.log('\n🔍 FARM DETAYLARI:')
      console.log(`📝 Adı: ${farmDetails.name}`)
      console.log(`👤 Çiftçi: ${farmDetails.farmer.name} (${farmDetails.farmer.email})`)
      console.log(`🌾 Mahsül: ${farmDetails.cropType.name}`)
      console.log(`📏 Alan: ${farmDetails.areaHa} hektar`)
    }

    console.log('\n🎉 BAŞARILI - Veriler Neon DB\'ye eklendi!')
    console.log('🌐 Dashboard test edilebilir!')
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    console.error('🔍 Detay:', error)
    process.exit(1)
  }
}

main()
