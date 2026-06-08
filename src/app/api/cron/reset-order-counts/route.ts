import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await prisma.seller.updateMany({
    data: {
      monthlyOrderCount: 0,
      billingPeriodStart: new Date(),
    },
  })

  return NextResponse.json({ reset: result.count })
}
