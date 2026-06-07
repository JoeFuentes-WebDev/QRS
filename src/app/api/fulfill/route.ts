import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { Shippo } from 'shippo'

const resend = new Resend(process.env.RESEND_API_KEY!)
const shippo = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY! })

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const action = searchParams.get('action')

  if (!orderId || !action) {
    return new NextResponse('Invalid request', { status: 400 })
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: { orderItems: { include: { product: true } } },
  })

  if (!order) {
    return new NextResponse('Order not found', { status: 404 })
  }

  if (order.status !== 'PENDING') {
    return new NextResponse(`
      <html><body style="font-family:sans-serif;text-align:center;padding:48px;">
        <h2>Already processed</h2>
        <p>This order has already been ${order.status.toLowerCase()}.</p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  const productNames = order.orderItems.map(i => i.product.name).join(', ')

  if (action === 'yes') {
    try {
      // Get shipping address from Stripe
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)
      const address = session.customer_details?.address

      if (!address) {
        return new NextResponse(`
          <html><body style="font-family:sans-serif;text-align:center;padding:48px;">
            <h2>Error</h2><p>Could not find shipping address. Check Stripe dashboard.</p>
          </body></html>
        `, { headers: { 'Content-Type': 'text/html' } })
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
          email: process.env.LAURA_ADDRESS_EMAIL!,
          phone: process.env.LAURA_ADDRESS_PHONE!,
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

      // Get cheapest USPS rate
      const rates = (shipment.rates ?? []) as Array<{ provider: string; amount: string; objectId: string }>
      const uspsRate = rates
        .filter(r => r.provider === 'USPS')
        .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0]

      if (!uspsRate) {
        return new NextResponse(`
          <html><body style="font-family:sans-serif;text-align:center;padding:48px;">
            <h2>Error</h2><p>Could not get USPS rate. Check Shippo dashboard.</p>
          </body></html>
        `, { headers: { 'Content-Type': 'text/html' } })
      }

      // Purchase label
      const transaction = await shippo.transactions.create({
        rate: uspsRate.objectId,
        labelFileType: 'PNG' as const,
        async: false,
      })

      const tx = transaction as { qrCodeUrl?: string; labelUrl?: string }
      const qrUrl = tx.qrCodeUrl ?? tx.labelUrl

      // Update order
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CONFIRMED' },
      })

      // Email Laura the QR code
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: process.env.LAURA_EMAIL!,
        subject: `Shipping label for: ${productNames}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2>Your shipping label is ready 📦</h2>
            <p><strong>Item:</strong> ${productNames}</p>
            <p>Wrap the piece, put it in a flat rate box, and show this QR code at USPS:</p>
            <div style="margin-top:24px;text-align:center;">
              <img src="${qrUrl}" style="width:200px;height:200px;" alt="QR Code" />
            </div>
            <p style="margin-top:16px;"><a href="${qrUrl}">Or tap here to open the label</a></p>
          </div>
        `,
      })

      return new NextResponse(`
        <html><body style="font-family:sans-serif;text-align:center;padding:48px;">
          <h2>✓ Confirmed!</h2>
          <p>Shipping label sent to your email. Wrap up <strong>${productNames}</strong> and head to USPS.</p>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' } })

    } catch (error) {
      console.error('Fulfill error:', error)
      return new NextResponse(`
        <html><body style="font-family:sans-serif;text-align:center;padding:48px;">
          <h2>Error</h2><p>Something went wrong. Check the logs.</p>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }

  } else if (action === 'no') {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)

      if (session.payment_intent) {
        await stripe.paymentIntents.cancel(session.payment_intent as string)
      }

      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { inStock: true },
        })
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })

      return new NextResponse(`
        <html><body style="font-family:sans-serif;text-align:center;padding:48px;">
          <h2>Order cancelled</h2>
          <p>The customer has not been charged. <strong>${productNames}</strong> is back in the shop.</p>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' } })

    } catch (error) {
      console.error('Cancel error:', error)
      return new NextResponse(`
        <html><body style="font-family:sans-serif;text-align:center;padding:48px;">
          <h2>Error</h2><p>Something went wrong cancelling. Check Stripe dashboard.</p>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' } })
    }
  }

  return new NextResponse('Invalid action', { status: 400 })
}