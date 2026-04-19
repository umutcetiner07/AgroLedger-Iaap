import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Testing login credentials...')
  
  try {
    // Find first user
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true
      }
    })
    
    if (!user) {
      console.log('❌ No users found in database')
      return
    }
    
    console.log('📋 User found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Password (first 20 chars): ${user.password?.substring(0, 20)}...`)
    
    // Test password comparison
    const testPassword = 'kazakh2024'
    
    if (user.password) {
      const match = await bcrypt.compare(testPassword, user.password)
      console.log(`🔐 Password comparison for "${testPassword}": ${match ? '✅ SUCCESS' : '❌ FAILED'}`)
      
      if (match) {
        console.log('✅ Login should work with these credentials:')
        console.log(`   Email: ${user.email}`)
        console.log(`   Password: ${testPassword}`)
      } else {
        console.log('❌ Password mismatch detected!')
      }
    } else {
      console.log('❌ User has no password set')
    }
    
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
