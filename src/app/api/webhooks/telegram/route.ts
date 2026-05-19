import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessage, sendTelegramPhoto } from '@/lib/telegram'
import { Shippo } from 'shippo'

const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    const message = update.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = String(message.chat.id)
    const text = (message.text ?? '').trim().toUpperCase()

    // Only respond to Laura's chat
    if (chatId !== process.env.LAURA_CHAT_ID) {
      return NextResponse.json({ ok: true })
    }

    // Find most recent pending order
    const order = await prisma.order.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    })

    if (!order) {
      await sendTelegramMessage(chatId, 'No pending orders found.')
      return NextResponse.json({ ok: true })
    }

    const productNames = order.items.map(i => i.product.name).join(', ')

    if (text === 'YES' || text === 'Y') {
      await sendTelegramMessage(chatId, '⏳ Generating your shipping label...')

      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)
      const address = session.customer_details?.address

      if (!address) {
        await sendTelegramMessage(chatId, 'Could not find shipping address. Check Stripe dashboard.')
        return NextResponse.json({ ok: true })
      }

      const shipment = await shippo.shipments.create({
        addressFrom: {
          name: process.env.LAURA_ADDRESS_NAME!,
          street1: process.env.LAURA_ADDRESS_STREET!,
          city: process.env.LAURA_ADDRESS_CITY!,
          state: process.env.LAURA_ADDRESS_STATE!,
          zip: process.env.LAURA_ADDRESS_ZIP!,
          country: 'US',
        },
        addressTo: {
          name: session.customer_details?.name ?? 'Customer',
          street1: address.line1 ?? '',
          street2: address.line2 ?? '',
          city: address.city ?? '',
          state: address.state ?? '',
          zip: address.postal_code ?? '',
          country: 'US',
        },
        parcels: [{
          length: '12',
          width: '12',
          height: '8',
          distanceUnit: 'in' as const,
          weight: '3',
          massUnit: 'lb' as const,
        }],
        async: false,
      })

      const rates = (shipment.rates ?? []) as Array<{ provider: string; amount: string; objectId: string }>
      const uspsRate = rates
        .filter(r => r.provider === 'USPS')
        .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0]

      if (!uspsRate) {
        await sendTelegramMessage(chatId, 'Could not get USPS rate. Check Shippo dashboard.')
        return NextResponse.json({ ok: true })
      }

      const transaction = await shippo.transactions.create({
        rate: uspsRate.objectId,
        labelFileType: 'PNG' as const,
        async: false,
      })

      const tx = transaction as { qrCodeUrl?: string; labelUrl?: string }
      const qrUrl = tx.qrCodeUrl ?? tx.labelUrl ?? ''

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      })

      if (qrUrl) {
        await sendTelegramPhoto(chatId, qrUrl, `📦 Ship: ${productNames}\nShow this QR at USPS counter.`)
      } else {
        await sendTelegramMessage(chatId, `Label generated but no QR. Check Shippo dashboard.`)
      }

    } else if (text === 'NO' || text === 'N') {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)

      if (session.payment_intent) {
        await stripe.paymentIntents.cancel(session.payment_intent as string)
      }

      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { inStock: true },
        })
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })

      await sendTelegramMessage(chatId, `✓ Cancelled. ${productNames} is back in the shop. Customer not charged.`)

    } else {
      await sendTelegramMessage(chatId, 'Reply YES to ship or NO to cancel.')
    }

  } catch (error) {
    console.error('Telegram webhook error:', error)
  }

  return NextResponse.json({ ok: true })
}