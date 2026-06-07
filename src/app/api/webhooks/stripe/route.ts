import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe'
import {
  routeFulfillment,
  decrementProductQuantities,
  type OrderWithItems,
} from '@/lib/fulfillment'

type CheckoutMetadata = {
  sellerId?: string
  items?: string
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let unverified: Stripe.Event
  try {
    unverified = JSON.parse(body) as Stripe.Event
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (unverified.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = unverified.data.object as Stripe.Checkout.Session
  const sellerId = session.metadata?.sellerId

  if (!sellerId) {
    return NextResponse.json({ error: 'Missing sellerId in metadata' }, { status: 400 })
  }

  const seller = await prisma.seller.findUnique({ where: { id: sellerId } })
  if (!seller?.stripeWebhookSecret) {
    return NextResponse.json({ error: 'Seller webhook secret not found' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripeClient(seller)
    event = stripe.webhooks.constructEvent(body, sig, seller.stripeWebhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const completedSession = event.data.object as Stripe.Checkout.Session

    try {
      const metadata = completedSession.metadata as CheckoutMetadata
      const items = JSON.parse(metadata.items ?? '[]') as Array<{
        productId: string
        quantity: number
        price: number
      }>

      const buyerName = completedSession.customer_details?.name ?? 'Customer'
      const buyerEmail = completedSession.customer_details?.email ?? ''
      const address = completedSession.customer_details?.address

      const existing = await prisma.order.findUnique({
        where: { stripeSessionId: completedSession.id },
      })
      if (existing) {
        return NextResponse.json({ received: true })
      }

      const order = await prisma.order.create({
        data: {
          sellerId: seller.id,
          stripeSessionId: completedSession.id,
          stripePaymentIntent:
            typeof completedSession.payment_intent === 'string'
              ? completedSession.payment_intent
              : completedSession.payment_intent?.id,
          buyerName,
          buyerEmail,
          shippingName: buyerName,
          shippingStreet: address?.line1 ?? undefined,
          shippingCity: address?.city ?? undefined,
          shippingState: address?.state ?? undefined,
          shippingZip: address?.postal_code ?? undefined,
          shippingCountry: address?.country ?? undefined,
          status: 'PENDING',
          total: (completedSession.amount_total ?? 0) / 100,
          orderItems: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
            })),
          },
        },
        include: { orderItems: { include: { product: true } } },
      })

      await decrementProductQuantities(order.orderItems, seller.id)
      await routeFulfillment(order as OrderWithItems, seller)
    } catch (error) {
      console.error('Order processing error:', error)
      return NextResponse.json({ error: 'Order processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
