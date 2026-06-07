import { Resend } from 'resend'
import type { Order, OrderItem, Product, Seller } from '@prisma/client'

type OrderWithItems = Order & {
  orderItems: (OrderItem & { product: Product })[]
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey?.trim()) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

function formatAddress(order: Order): string {
  const parts = [
    order.shippingName,
    order.shippingStreet,
    [order.shippingCity, order.shippingState, order.shippingZip]
      .filter(Boolean)
      .join(', '),
    order.shippingCountry,
  ].filter(Boolean)
  return parts.join('<br>')
}

export async function sendOrderEmail(
  order: OrderWithItems,
  seller: Seller
): Promise<void> {
  const to = seller.notificationEmail
  if (!to?.trim()) {
    throw new Error('Seller notification email is not configured')
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
  const resend = getResend()

  const itemRows = order.orderItems
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.product.name}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
        </tr>`
    )
    .join('')

  await resend.emails.send({
    from,
    to,
    subject: `New order #${order.id.slice(-8)} — ${seller.storeName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2>New order for ${seller.storeName}</h2>
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Buyer:</strong> ${order.buyerName ?? 'Customer'} (${order.buyerEmail ?? 'no email'})</p>
        <h3>Items</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;padding-bottom:8px;">Product</th>
              <th style="text-align:center;padding-bottom:8px;">Qty</th>
              <th style="text-align:right;padding-bottom:8px;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="margin-top:16px;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        <h3>Shipping address</h3>
        <p>${formatAddress(order)}</p>
      </div>
    `,
  })
}
