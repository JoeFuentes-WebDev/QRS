import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import twilio from 'twilio'
import { Shippo } from 'shippo'

const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY! })

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

async function sendSMS(to: string, body: string) {
  return twilioClient.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  })
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const body = (formData.get('Body') as string ?? '').trim().toUpperCase()
  const from = formData.get('From') as string

  // Extract order ID from the last incoming message context
  // We parse it from the Body if Laura replies with YES/NO to a specific order
  const orderIdMatch = body.match(/[A-Z0-9]{25}/)
  
  // Find the most recent PENDING order if no ID in reply
  const order = orderIdMatch
    ? await prisma.order.findFirst({
        where: { id: orderIdMatch[0], status: 'PENDING' },
        include: { orderItems: { include: { product: true } } },
      })
    : await prisma.order.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: { orderItems: { include: { product: true } } },
      })

  if (!order) {
    await sendSMS(from, "No pending orders found.")
    return NextResponse.json({ ok: true })
  }

  if (body.startsWith('YES')) {
    try {
      // Get shipping address from Stripe
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)

      const address = session.customer_details?.address
      if (!address) {
        await sendSMS(from, "Could not find shipping address. Check Stripe dashboard.")
        return NextResponse.json({ ok: true })
      }

      // Create Shippo shipment
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
          distanceUnit: 'in',
          weight: '3',
          massUnit: 'lb',
        }],
        async: false,
      })

      // Get cheapest USPS rate
      const rates = (shipment.rates ?? []) as Array<{ provider: string; amount: string; objectId: string }>
      const uspsRate = rates
        .filter(r => r.provider === 'USPS')
        .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0];

      if (!uspsRate) {
        await sendSMS(from, "Could not get USPS rate. Check Shippo dashboard.")
        return NextResponse.json({ ok: true })
      }

      // Purchase label
      const transaction = await shippo.transactions.create({
        rate: uspsRate.objectId,
        labelFileType: 'PNG',
        async: false,
      })

      const tx = transaction as { qrCodeUrl?: string; labelUrl?: string }
      const qrUrl = tx.qrCodeUrl ?? tx.labelUrl
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      })

      // Text Laura the QR code
      const productNames = order.orderItems.map(i => i.product.name).join(', ')
      await sendSMS(from, `Got it! Ship: ${productNames}. Show this QR at USPS: ${qrUrl}`)

    } catch (error) {
      console.error('Shippo error:', error)
      await sendSMS(from, "Something went wrong generating the label. Check the logs.")
    }

  } else if (body.startsWith('NO')) {
    // Cancel order — void Stripe payment
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)

      if (session.payment_intent) {
        await stripe.paymentIntents.cancel(session.payment_intent as string)
      }

      // Mark items back in stock
      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { inStock: true },
        })
      }

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })

      await sendSMS(from, "Order cancelled. Customer will not be charged. Item is back in the shop.")

    } catch (error) {
      console.error('Cancel error:', error)
      await sendSMS(from, "Error cancelling order. Check Stripe dashboard.")
    }

  } else {
    await sendSMS(from, "Reply YES to ship or NO to cancel.")
  }

  // Return TwiML response
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}