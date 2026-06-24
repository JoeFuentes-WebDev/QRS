import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { trackSellerEvent } from '@/services/analytics.service'
import {
  constructStripeWebhookEvent,
  getCheckoutSessionLineItems,
} from '@/services/checkout.service'
import { sendBuyerOrderConfirmation } from '@/services/email.service'
import { notifySellerNewOrder } from '@/services/notification.service'
import {
  createOrderFromCheckout,
  orderExistsByStripeSessionId,
} from '@/services/order.service'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = constructStripeWebhookEvent(body, signature)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const sellerId = session.metadata?.sellerId

  if (!sellerId) {
    return NextResponse.json({ error: 'Missing sellerId in metadata' }, { status: 400 })
  }

  try {
    if (await orderExistsByStripeSessionId(session.id)) {
      return NextResponse.json({ received: true })
    }

    const buyerEmail = session.customer_details?.email?.trim()
    if (!buyerEmail) {
      return NextResponse.json({ error: 'Missing buyer email' }, { status: 400 })
    }

    const lineItems = await getCheckoutSessionLineItems(session.id)
    const stripePaymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null)

    const order = await createOrderFromCheckout({
      sellerId,
      stripeSessionId: session.id,
      stripePaymentIntentId,
      buyerEmail,
      lineItems,
    })

    const totalCents = lineItems.reduce(
      (sum, line) => sum + line.unitAmountCents * line.quantity,
      0
    )

    void sendBuyerOrderConfirmation({
      to: buyerEmail,
      storeName: order.seller.storeName,
      items: lineItems.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        unitPriceCents: line.unitAmountCents,
      })),
      totalCents,
    })

    void notifySellerNewOrder({
      order,
      seller: {
        notificationEmail: order.seller.notificationEmail,
        storeName: order.seller.storeName,
        telegramChatId: order.seller.telegramChatId,
        sellerPhone: order.seller.sellerPhone,
      },
    })

    void trackSellerEvent(order.seller.clerkUserId, 'order.placed')
  } catch (error) {
    console.error('Order processing error:', error)
    return NextResponse.json({ error: 'Order processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
