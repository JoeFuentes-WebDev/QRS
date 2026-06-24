import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export type CheckoutItemInput = {
  productId: string
  quantity: number
}

export type CreateCheckoutSessionInput = {
  sellerId: string
  items: CheckoutItemInput[]
}

export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CheckoutValidationError'
  }
}

function requireAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set')
  }
  return appUrl.replace(/\/$/, '')
}

export function constructStripeWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }
  return stripe.webhooks.constructEvent(body, signature, secret)
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<{ url: string }> {
  const { sellerId, items } = input

  if (!items.length) {
    throw new CheckoutValidationError('No items in cart')
  }

  for (const item of items) {
    if (!item.productId || item.quantity < 1) {
      throw new CheckoutValidationError('Invalid cart item')
    }
  }

  const seller = await prisma.seller.findUnique({ where: { id: sellerId } })
  if (!seller) {
    throw new CheckoutValidationError('Seller not found')
  }
  if (!seller.stripeConnectOnboarded || !seller.stripeConnectAccountId) {
    throw new CheckoutValidationError('This shop is not accepting payments yet')
  }

  const productIds = items.map((item) => item.productId)
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      sellerId,
      published: true,
    },
  })

  if (products.length !== productIds.length) {
    throw new CheckoutValidationError('One or more items are unavailable')
  }

  const productMap = new Map(products.map((product) => [product.id, product]))

  let sessionTotalCents = 0
  const lineItems: Array<{
    price_data: {
      currency: 'usd'
      product_data: {
        name: string
        images?: string[]
        metadata: { productId: string }
      }
      unit_amount: number
    }
    quantity: number
  }> = []

  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw new CheckoutValidationError('One or more items are unavailable')
    }
    if (product.stock < item.quantity) {
      throw new CheckoutValidationError('One or more items are out of stock')
    }

    sessionTotalCents += product.price * item.quantity
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name,
          ...(product.images[0] ? { images: [product.images[0]] } : {}),
          metadata: {
            productId: product.id,
          },
        },
        unit_amount: product.price,
      },
      quantity: item.quantity,
    })
  }

  const applicationFeeAmount = Math.floor(sessionTotalCents * 0.02)
  const appUrl = requireAppUrl()

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    success_url: `${appUrl}/${seller.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/${seller.slug}/cancel`,
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: seller.stripeConnectAccountId,
      },
    },
    metadata: {
      sellerId: seller.id,
      items: JSON.stringify(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      ),
    },
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL')
  }

  return { url: session.url }
}

export type CheckoutSessionLineItem = {
  productId: string
  quantity: number
  unitAmountCents: number
  name: string
}

export async function getCheckoutSessionLineItems(
  sessionId: string
): Promise<CheckoutSessionLineItem[]> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })

  const rows = session.line_items?.data ?? []

  return rows.map((row) => {
    const product = row.price?.product
    if (typeof product !== 'object' || product === null) {
      throw new Error(`Missing expanded product on checkout line item for session ${sessionId}`)
    }
    if ('deleted' in product && product.deleted) {
      throw new Error(`Deleted product on checkout line item for session ${sessionId}`)
    }

    const productId = product.metadata?.productId ?? ''
    if (!productId) {
      throw new Error(`Missing productId metadata on checkout line item for session ${sessionId}`)
    }

    return {
      productId,
      quantity: row.quantity ?? 1,
      unitAmountCents: row.price?.unit_amount ?? 0,
      name: row.description ?? 'Item',
    }
  })
}
