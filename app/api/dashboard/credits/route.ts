import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch all credit applications with related data
    const contracts = await prisma.contract.findMany({
      include: {
        farmer: {
          select: {
            name: true
          }
        },
        farm: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for frontend
    const transformedCredits = contracts.map(contract => ({
      id: contract.id,
      farmerName: contract.farmer.name,
      farmName: contract.farm.name,
      status: contract.slaFrozen ? 'APPROVED' : 
              contract.endDate === null ? 'REJECTED' : 'PENDING',
      savingsSharePct: contract.savingsSharePct,
      createdAt: contract.createdAt
    }))

    return NextResponse.json({ credits: transformedCredits })
  } catch (error) {
    console.error('Error fetching credit applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit applications' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
