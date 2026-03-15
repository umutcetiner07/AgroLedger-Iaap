const { PrismaClient } = require('./generated/prisma')

async function main() {
  console.log('💧 Water savings verileri ekleniyor...')
  
  try {
    const prisma = new PrismaClient()
    
    // Farm 1 için water savings kaydı oluştur
    const waterSaving = await prisma.waterSaving.upsert({
      where: { id: 'ws_1' },
      update: {
        actualUsage: 1200,
        baselineUsage: 1500,
        savings: 300
      },
      create: {
        id: 'ws_1',
        farmId: 1,
        actualUsage: 1200,
        baselineUsage: 1500,
        savings: 300,
        baselineType: 'HYBRID'
      }
    })
    
    console.log(`✅ Water Saving: ${waterSaving.savings}m³ tasarruf (Farm ID: ${waterSaving.farmId})`)
    
    // Kontrol
    const totalWaterSavings = await prisma.waterSaving.count()
    console.log(`💧 Toplam Water Savings: ${totalWaterSavings}`)
    
    console.log('\n🎉 Water savings verileri eklendi!')
    console.log('🌐 Dashboard stats test edilebilir!')
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('❌ Hata:', error.message)
    console.error('🔍 Detay:', error)
    process.exit(1)
  }
}

main()
