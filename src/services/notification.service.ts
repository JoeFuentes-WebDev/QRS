import { Resend } from 'resend'
import {
  getTelegramBotToken,
  sendTelegramMessageWithButtons,
} from '@/lib/telegram'
import { sendSms } from '@/lib/twilio'
import { computeOrderTotalCents } from '@/services/order.service'

type NotifyOrderItem = {
  quantity: number
  priceSnapshot: number
  product: { name: string }
}

type NotifySellerNewOrderParams = {
  order: {
    id: string
    buyerEmail: string
    items: NotifyOrderItem[]
  }
  seller: {
    notificationEmail: string
    storeName: string
    telegramChatId: string | null
    sellerPhone: string | null
  }
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

function buildItemLines(items: NotifyOrderItem[]): string {
  return items
    .map((item) => `• ${item.product.name} × ${item.quantity}`)
    .join('\n')
}

function buildSmsItemSummary(items: NotifyOrderItem[]): {
  quantity: number
  productName: string
} {
  if (items.length === 0) {
    return { quantity: 0, productName: 'items' }
  }

  const first = items[0]
  if (items.length === 1) {
    return { quantity: first.quantity, productName: first.product.name }
  }

  const extraCount = items.length - 1
  return {
    quantity: first.quantity,
    productName: `${first.product.name} +${extraCount} more`,
  }
}

function getAppUrl(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '')
  return appUrl || null
}

async function sendSellerOrderEmail(
  params: NotifySellerNewOrderParams,
  totalCents: number
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey?.trim()) {
    return
  }

  const to = params.seller.notificationEmail.trim()
  if (!to) {
    return
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const resend = new Resend(apiKey)
  const orderRef = params.order.id.slice(-8)
  const itemRows = params.order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.product.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatCents(item.priceSnapshot * item.quantity)}</td>
        </tr>`
    )
    .join('')

  await resend.emails.send({
    from,
    to,
    subject: `New order #${orderRef} — ${params.seller.storeName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2>New order for ${params.seller.storeName}</h2>
        <p><strong>Order ID:</strong> …${orderRef}</p>
        <p><strong>Buyer:</strong> ${params.order.buyerEmail}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:8px;">Item</th>
              <th style="text-align:center;padding-bottom:8px;">Qty</th>
              <th style="text-align:right;padding-bottom:8px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="margin-top:16px;"><strong>Total:</strong> ${formatCents(totalCents)}</p>
      </div>
    `,
  })
}

async function sendSellerOrderSms(
  params: NotifySellerNewOrderParams,
  totalCents: number
): Promise<void> {
  const phone = params.seller.sellerPhone?.trim()
  if (!phone) {
    return
  }

  const appUrl = getAppUrl()
  if (!appUrl) {
    return
  }

  const { quantity, productName } = buildSmsItemSummary(params.order.items)
  const body = [
    `New order on QRS! ${params.seller.storeName} — ${quantity}x ${productName}, $${formatDollars(totalCents)}.`,
    `View: ${appUrl}/dashboard/orders/${params.order.id}`,
  ].join(' ')

  await sendSms(phone, body)
}

async function sendSellerOrderTelegram(
  params: NotifySellerNewOrderParams,
  totalCents: number
): Promise<void> {
  const botToken = getTelegramBotToken()
  const chatId = params.seller.telegramChatId?.trim()

  if (!botToken || !chatId) {
    return
  }

  const orderRef = params.order.id.slice(-8)
  const text = [
    `<b>New order — ${params.seller.storeName}</b>`,
    `Order #${orderRef}`,
    '',
    buildItemLines(params.order.items),
    '',
    `<b>Total:</b> ${formatCents(totalCents)}`,
  ].join('\n')

  await sendTelegramMessageWithButtons(botToken, chatId, text, [
    { text: 'Accept', callback_data: `order:accept:${params.order.id}` },
    { text: 'Decline', callback_data: `order:decline:${params.order.id}` },
  ])
}

export async function notifySellerNewOrder(
  params: NotifySellerNewOrderParams
): Promise<void> {
  const totalCents = computeOrderTotalCents(params.order.items)

  // Email notifications disabled for now — Resend seller order emails coming soon.
  // try {
  //   await sendSellerOrderEmail(params, totalCents)
  // } catch (error) {
  //   console.error('Seller order notification email failed:', error)
  // }

  try {
    await sendSellerOrderSms(params, totalCents)
  } catch (error) {
    console.error('Seller order notification SMS failed:', error)
  }

  try {
    await sendSellerOrderTelegram(params, totalCents)
  } catch (error) {
    console.error('Seller order notification Telegram failed:', error)
  }
}
