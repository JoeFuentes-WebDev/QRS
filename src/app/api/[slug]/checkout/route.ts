import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'Use POST /api/checkout/session instead' },
    { status: 410 }
  )
}
