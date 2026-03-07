import "dotenv/config"
import { PrismaClient } from './generated/prisma'

const prisma = new PrismaClient()

async function main() {
  try {
    // User tablosuna veri ekle
    const user = await prisma.user.create({
      data: {
        email: 'test2@example.com',
        name: 'Test User 2'
      }
    })
    console.log('Created user:', user)

    // User tablosundan sorgu çek
    const users = await prisma.user.findMany()
    console.log('All users:', users)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()