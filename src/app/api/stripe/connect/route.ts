import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { trackSellerEvent } from '@/services/analytics.service'
import { getSellerByClerkId } from '@/services/seller.service'
import {
  createAccountLink,
  getOrCreateConnectAccount,
} from '@/services/stripeConnect.service'

export async function POST(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await getSellerByClerkId(userId)
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await currentUser()
  const email =
    seller.notificationEmail ??
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress

  if (!email) {
    return NextResponse.json(
      { error: 'Seller notification email is required' },
      { status: 400 }
    )
  }

  try {
    const accountId = await getOrCreateConnectAccount(seller.id, email)
    const url = await createAccountLink(accountId)
    return NextResponse.json({ url })
  } catch (error) {
    void trackSellerEvent(seller.clerkUserId, 'stripe.connect_failed', {
      sellerId: seller.clerkUserId,
      error: error instanceof Error ? error.message : 'unknown',
    })

    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe Connect onboarding error:', {
        type: error.type,
        code: error.code,
        message: error.message,
        requestId: error.requestId,
      })
      return NextResponse.json(
        {
          error: 'Failed to start Stripe Connect onboarding',
          message: error.message,
        },
        { status: error.statusCode ?? 500 }
      )
    }

    console.error('Stripe Connect onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to start Stripe Connect onboarding' },
      { status: 500 }
    )
  }
}
