import { NextRequest, NextResponse } from 'next/server'
import {
  CheckoutValidationError,
  createCheckoutSession,
} from '@/services/checkout.service'

type CheckoutSessionBody = {
  sellerId?: string
  items?: Array<{ productId?: string; quantity?: number }>
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CheckoutSessionBody
  try {
    body = (await req.json()) as CheckoutSessionBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const sellerId = body.sellerId?.trim()
  const items = body.items

  if (!sellerId) {
    return NextResponse.json({ error: 'sellerId is required' }, { status: 400 })
  }

  if (!items?.length) {
    return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
  }

  try {
    const session = await createCheckoutSession({
      sellerId,
      items: items.map((item) => ({
        productId: item.productId ?? '',
        quantity: item.quantity ?? 0,
      })),
    })
    return NextResponse.json(session)
  } catch (error) {
    if (error instanceof CheckoutValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Checkout session error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
