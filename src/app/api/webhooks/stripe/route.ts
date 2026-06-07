import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessageWithButtons, sendTelegramPhoto } from '@/lib/telegram'
import { getDefaultSeller } from '@/lib/seller'

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
      const seller = await getDefaultSeller()
      const items = JSON.parse(session.metadata?.items ?? '[]')
      const buyerName = session.customer_details?.name ?? 'Customer'
      const buyerEmail = session.customer_details?.email ?? ''
      const address = session.customer_details?.address

      const order = await prisma.order.create({
        data: {
          sellerId: seller.id,
          stripeSessionId: session.id,
          buyerName,
          buyerEmail,
          shippingName: buyerName,
          shippingStreet: address?.line1 ?? undefined,
          shippingCity: address?.city ?? undefined,
          shippingState: address?.state ?? undefined,
          shippingZip: address?.postal_code ?? undefined,
          shippingCountry: address?.country ?? undefined,
          status: 'PENDING',
          total: (session.amount_total ?? 0) / 100,
          orderItems: {
            create: items.map((item: { productId: string; quantity: number; price: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
            })),
          },
        },
        include: { orderItems: { include: { product: true } } },
      })

      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { inStock: false },
        })
      }

      const productNames = order.orderItems.map(i => i.product.name).join(', ')
      const customerCity = address?.city ?? ''
      const customerState = address?.state ?? ''

      const firstItem = order.orderItems[0]
      if (firstItem?.product?.imageUrl) {
        await sendTelegramPhoto(
          process.env.LAURA_CHAT_ID!,
          firstItem.product.imageUrl,
          firstItem.product.name
        )
      }

      await sendTelegramMessageWithButtons(
        process.env.LAURA_CHAT_ID!,
        `🏺 <b>New Order!</b>\n\n<b>Item:</b> ${productNames}\n<b>Customer:</b> ${buyerName}, ${customerCity} ${customerState}\n<b>Total:</b> $${order.total.toFixed(2)}\n\nCan you ship this?`,
        [
          { text: '✓ Yes, ship it', callback_data: `YES:${order.id}` },
          { text: '✕ Not available', callback_data: `NO:${order.id}` },
        ]
      )

    } catch (error) {
      console.error('Order processing error:', error)
    }
  }

  return NextResponse.json({ received: true })
}
