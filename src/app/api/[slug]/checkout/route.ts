import { NextRequest, NextResponse } from 'next/server'
import type { CartItem } from '@/types'
import { prisma } from '@/lib/prisma'
import { getSellerBySlug } from '@/lib/seller'
import { getStripeClient, sellerHasStripeConfigured } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { items }: { items: CartItem[] } = await req.json()

    const seller = await getSellerBySlug(slug)
    if (!seller) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    if (!sellerHasStripeConfigured(seller)) {
      return NextResponse.json(
        { error: 'This shop is not accepting payments yet.' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, sellerId: seller.id, inStock: true },
      })
      if (!product) {
        return NextResponse.json(
          { error: 'One or more items are no longer available' },
          { status: 400 }
        )
      }
    }

    const stripe = getStripeClient(seller)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          images: item.product.imageUrl ? [item.product.imageUrl] : [],
          metadata: {
            productId: item.productId,
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      customer_email: undefined,
      success_url: `${appUrl}/${slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${slug}`,
      metadata: {
        sellerId: seller.id,
        slug,
        items: JSON.stringify(
          items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          }))
        ),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    const message =
      error instanceof Error ? error.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
