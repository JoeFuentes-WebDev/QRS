import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const resend = new Resend(process.env.RESEND_API_KEY!)

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

      // Email Laura
      await resend.emails.send({
        from: 'orders@lauras-pots.com',
        to: process.env.LAURA_EMAIL!,
        subject: `New order: ${productNames}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1c1917;">New Order 🏺</h2>
            <p><strong>Item:</strong> ${productNames}</p>
            <p><strong>Customer:</strong> ${customerName}, ${customerCity} ${customerState}</p>
            <p><strong>Order total:</strong> $${order.total.toFixed(2)}</p>
            <p style="margin-top: 32px;">Can you ship this piece?</p>
            <div style="margin-top: 16px; display: flex; gap: 12px;">
              <a href="${yesUrl}" style="background: #1c1917; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-right: 12px;">
                ✓ Yes, I'll ship it
              </a>
              <a href="${noUrl}" style="background: #f5f5f4; color: #57534e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                ✕ No, it's unavailable
              </a>
            </div>
            <p style="margin-top: 32px; color: #a8a29e; font-size: 12px;">Order ID: ${order.id}</p>
          </div>
        `,
      })

    } catch (error) {
      console.error('Order processing error:', error)
    }
  }

  return NextResponse.json({ received: true })
}