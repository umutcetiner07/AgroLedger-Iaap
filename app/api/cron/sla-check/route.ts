import { NextResponse } from "next/server"
import { PrismaClient } from "../../../../generated/prisma"

const prisma = new PrismaClient()

export async function GET() {
  const activeAlerts = await prisma.weatherAlert.count({
    where: { active: true }
  })

  if (activeAlerts > 0) {
    await prisma.contract.updateMany({
      data: { slaFrozen: true }
    })
  }

  return NextResponse.json({ status: 'SLA checked' })
}