import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Fetch all farms with related data
    const farms = await prisma.farm.findMany({
      include: {
        farmer: {
          select: {
            name: true
          }
        },
        cropType: {
          select: {
            name: true
          }
        },
        cooperative: {
          include: {
            region: {
              select: {
                name: true
              }
            }
          }
        },
        scores: {
          take: 1,
          orderBy: {
            calculatedAt: 'desc'
          }
        },
        waterSavings: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Transform data for frontend
    const transformedFarms = farms.map(farm => ({
      id: farm.id,
      name: farm.name,
      farmerName: farm.farmer.name,
      region: farm.cooperative.region.name,
      cropType: farm.cropType.name,
      fhsScore: farm.scores[0]?.score || 0,
      lat: 43.2220 + (Math.random() - 0.5) * 0.1, // Add small variation around Kazakhstan
      lng: 76.8512 + (Math.random() - 0.5) * 0.1,
      lastIrrigation: farm.waterSavings[0]?.createdAt || new Date(),
      areaHa: farm.areaHa
    }))

    return NextResponse.json({ farms: transformedFarms })
  } catch (error) {
    console.error('Error fetching farms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch farms data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
