const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function seedDashboard() {
  try {
    // Dashboard verilerini ekle
    await prisma.dashboardStats.create({
      data: {
        totalSavings: 300,
        efficiency: 94.2,
        activeFarms: 1,
        totalPayment: 45,
        trendData: [
          { date: '01.03', value: 40 },
          { date: '03.03', value: 30 },
          { date: '05.03', value: 65 },
          { date: '07.03', value: 45 },
          { date: '09.03', value: 90 },
          { date: '11.03', value: 70 },
          { date: '12.03', value: 85 }
        ]
      }
    });

    console.log('✅ Dashboard verileri başarıyla eklendi!');
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDashboard();
