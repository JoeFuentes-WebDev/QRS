import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessageWithButtons } from '@/lib/telegram'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const items = JSON.parse(session.metadata?.items ?? '[]')
      const customerName = session.customer_details?.name ?? 'Customer'
      const customerEmail = session.customer_details?.email ?? ''
      const customerCity = session.customer_details?.address?.city ?? ''
      const customerState = session.customer_details?.address?.state ?? ''

      // Save order as PENDING
      const order = await prisma.order.create({
        data: {
          stripeSessionId: session.id,
          customerEmail,
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

      const productNames = order.items.map(i => i.product.name).join(', ')
      const appUrl = process.env.NEXT_PUBLIC_APP_URL!
      const yesUrl = `${appUrl}/api/fulfill?orderId=${order.id}&action=yes`
      const noUrl = `${appUrl}/api/fulfill?orderId=${order.id}&action=no`

      // Text Laura via Telegram
      await sendTelegramMessage(
        process.env.LAURA_CHAT_ID!,
        `🏺 <b>New Order!</b>\n\n<b>Item:</b> ${productNames}\n<b>Customer:</b> ${customerName}, ${customerCity} ${customerState}\n<b>Total:</b> $${order.total.toFixed(2)}\n\n<a href="${yesUrl}">✓ Yes, I'll ship it</a>\n<a href="${noUrl}">✕ No, unavailable</a>`
      )

    } catch (error) {
      console.error('Order processing error:', error)
    }
  }

  return NextResponse.json({ received: true })
}