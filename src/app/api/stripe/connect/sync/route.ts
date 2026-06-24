import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getSellerByClerkId } from '@/services/seller.service'
import { syncStripeConnectStatus } from '@/services/stripeConnect.service'

export async function POST(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await getSellerByClerkId(userId)
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const status = await syncStripeConnectStatus(seller)
    return NextResponse.json(status)
  } catch (error) {
    console.error('Stripe Connect sync error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh Stripe status' },
      { status: 500 }
    )
  }
}
