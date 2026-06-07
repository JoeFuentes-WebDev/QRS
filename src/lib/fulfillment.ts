import type { Order, OrderItem, Product, Seller } from '@prisma/client'
import Stripe from 'stripe'
import { Shippo } from 'shippo'
import { prisma } from '@/lib/prisma'
import { getStripeClient } from '@/lib/stripe'
import { sendOrderEmail } from '@/lib/resend'
import {
  sendTelegramMessage,
  sendTelegramMessageWithButtons,
  sendTelegramPhoto,
} from '@/lib/telegram'

export type OrderWithItems = Order & {
  orderItems: (OrderItem & { product: Product })[]
}

export async function decrementProductQuantities(
  orderItems: OrderWithItems['orderItems'],
  sellerId: string
): Promise<void> {
  for (const item of orderItems) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, sellerId },
    })
    if (!product) continue

    if (product.quantity === null) continue

    const newQty = product.quantity - item.quantity
    await prisma.product.update({
      where: { id: product.id },
      data: {
        quantity: Math.max(0, newQty),
        inStock: newQty > 0,
      },
    })
  }
}

export async function restoreProductQuantities(
  orderItems: OrderWithItems['orderItems'],
  sellerId: string
): Promise<void> {
  for (const item of orderItems) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, sellerId },
    })
    if (!product) continue

    if (product.quantity === null) {
      await prisma.product.update({
        where: { id: product.id },
        data: { inStock: true },
      })
      continue
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        quantity: product.quantity + item.quantity,
        inStock: true,
      },
    })
  }
}

export async function routeFulfillment(
  order: OrderWithItems,
  seller: Seller
): Promise<void> {
  if (seller.fulfillmentType === 'EMAIL') {
    await sendOrderEmail(order, seller)
    return
  }

  if (seller.fulfillmentType === 'TELEGRAM') {
    await sendTelegramFulfillment(order, seller)
    return
  }
}

async function sendTelegramFulfillment(
  order: OrderWithItems,
  seller: Seller
): Promise<void> {
  const botToken = seller.telegramBotToken
  const chatId = seller.telegramChatId
  if (!botToken?.trim() || !chatId?.trim()) {
    throw new Error('Telegram bot token or chat ID not configured for seller')
  }

  const productNames = order.orderItems.map((i) => i.product.name).join(', ')
  const customerCity = order.shippingCity ?? ''
  const customerState = order.shippingState ?? ''

  const firstItem = order.orderItems[0]
  if (firstItem?.product?.imageUrl) {
    await sendTelegramPhoto(
      botToken,
      chatId,
      firstItem.product.imageUrl,
      firstItem.product.name
    )
  }

  await sendTelegramMessageWithButtons(
    botToken,
    chatId,
    `🏺 <b>New Order!</b>\n\n<b>Item:</b> ${productNames}\n<b>Customer:</b> ${order.buyerName ?? 'Customer'}, ${customerCity} ${customerState}\n<b>Total:</b> $${order.total.toFixed(2)}\n\nCan you ship this?`,
    [
      { text: '✓ Yes, ship it', callback_data: `YES:${order.id}` },
      { text: '✕ Not available', callback_data: `NO:${order.id}` },
    ]
  )
}

function getShippoClient(seller: Seller): Shippo {
  if (!seller.shippoApiKey?.trim()) {
    throw new Error('Shippo API key not configured for seller')
  }
  return new Shippo({ apiKeyHeader: seller.shippoApiKey })
}

async function getCheckoutSession(
  order: OrderWithItems,
  seller: Seller
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient(seller)
  return stripe.checkout.sessions.retrieve(order.stripeSessionId)
}

export async function confirmTelegramOrder(
  order: OrderWithItems,
  seller: Seller,
  chatId: string
): Promise<void> {
  const botToken = seller.telegramBotToken
  if (!botToken?.trim()) throw new Error('Telegram bot token not configured')

  if (seller.telegramChatId && chatId !== seller.telegramChatId) {
    throw new Error('Unauthorized chat')
  }

  await sendTelegramMessage(botToken, chatId, '⏳ Generating your shipping label...')

  const session = await getCheckoutSession(order, seller)
  const address = session.customer_details?.address

  if (!address) {
    await sendTelegramMessage(botToken, chatId, 'Could not find shipping address. Check Stripe.')
    return
  }

  const shippo = getShippoClient(seller)
  const shipment = await shippo.shipments.create({
    addressFrom: {
      name: seller.shippoFromName!,
      street1: seller.shippoFromStreet!,
      city: seller.shippoFromCity!,
      state: seller.shippoFromState!,
      zip: seller.shippoFromZip!,
      country: 'US',
      email: seller.shippoFromEmail!,
      phone: seller.shippoFromPhone!,
    },
    addressTo: {
      name: session.customer_details?.name ?? order.buyerName ?? 'Customer',
      street1: address.line1 ?? '',
      street2: address.line2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      zip: address.postal_code ?? '',
      country: 'US',
    },
    parcels: [
      {
        length: '12',
        width: '12',
        height: '8',
        distanceUnit: 'in' as const,
        weight: '3',
        massUnit: 'lb' as const,
      },
    ],
    async: false,
  })

  const rates = (shipment.rates ?? []) as Array<{
    provider: string
    amount: string
    objectId: string
  }>
  const uspsRate = rates
    .filter((r) => r.provider === 'USPS')
    .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0]

  if (!uspsRate) {
    await sendTelegramMessage(botToken, chatId, 'No USPS rates available. Check Shippo.')
    return
  }

  const transaction = await shippo.transactions.create({
    rate: uspsRate.objectId,
    labelFileType: 'PNG' as const,
    async: false,
  })

  const tx = transaction as { qrCodeUrl?: string; labelUrl?: string }
  const qrUrl = tx.qrCodeUrl ?? tx.labelUrl ?? ''
  const productNames = order.orderItems.map((i) => i.product.name).join(', ')

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CONFIRMED' },
  })

  if (qrUrl) {
    await sendTelegramPhoto(
      botToken,
      chatId,
      qrUrl,
      `📦 Ship: ${productNames}\nShow this QR at USPS counter.`
    )
  } else {
    await sendTelegramMessage(botToken, chatId, 'Label generated. Check Shippo for the QR code.')
  }
}

export async function cancelTelegramOrder(
  order: OrderWithItems,
  seller: Seller,
  chatId: string
): Promise<void> {
  const botToken = seller.telegramBotToken
  if (!botToken?.trim()) throw new Error('Telegram bot token not configured')

  if (seller.telegramChatId && chatId !== seller.telegramChatId) {
    throw new Error('Unauthorized chat')
  }

  const stripe = getStripeClient(seller)
  const session = await getCheckoutSession(order, seller)

  if (session.payment_intent) {
    await stripe.refunds.create({
      payment_intent: session.payment_intent as string,
    })
  }

  await restoreProductQuantities(order.orderItems, seller.id)

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' },
  })

  const productNames = order.orderItems.map((i) => i.product.name).join(', ')
  await sendTelegramMessage(
    botToken,
    chatId,
    `✓ Cancelled. ${productNames} is back in the shop. Customer refunded.`
  )
}
