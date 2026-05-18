import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.created') {
    // Authorize-only — do nothing yet, wait for Laura's YES
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const items = JSON.parse(session.metadata?.items ?? '[]')
      const customerName = session.customer_details?.name ?? 'Customer'
      const customerCity = session.customer_details?.address?.city ?? ''
      const customerState = session.customer_details?.address?.state ?? ''

      // Save order as PENDING
      const order = await prisma.order.create({
        data: {
          stripeSessionId: session.id,
          customerEmail: session.customer_details?.email ?? '',
          status: 'PENDING',
          total: (session.amount_total ?? 0) / 100,
          items: {
            create: items.map((item: { productId: string; quantity: number; price: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              pieceCount: 1,
              price: item.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      })

      // Mark items as sold
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { inStock: false },
        })
      }

      // Build product list for the text
      const productNames = order.items.map(i => i.product.name).join(', ')

      // Text Laura
      await twilioClient.messages.create({
        body: `New order! ${productNames} → ${customerName}, ${customerCity} ${customerState}. Reply YES to ship or NO if unavailable. Order ID: ${order.id}`,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to: process.env.LAURA_PHONE!,
      })

    } catch (error) {
      console.error('Order processing error:', error)
    }
  }

  return NextResponse.json({ received: true })
}