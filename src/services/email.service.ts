import { Resend } from 'resend'

type OrderEmailItem = {
  name: string
  quantity: number
  unitPriceCents: number
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey?.trim()) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(apiKey)
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export async function sendBuyerOrderConfirmation(params: {
  to: string
  storeName: string
  items: OrderEmailItem[]
  totalCents: number
}): Promise<void> {
  try {
    const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
    const resend = getResend()

    const itemRows = params.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.name}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatCents(item.unitPriceCents * item.quantity)}</td>
          </tr>`
      )
      .join('')

    await resend.emails.send({
      from,
      to: params.to,
      subject: `Order confirmed — ${params.storeName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
          <h2>Thank you for your order</h2>
          <p>Your order with <strong>${params.storeName}</strong> has been received.</p>
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
          <p style="margin-top:16px;"><strong>Total:</strong> ${formatCents(params.totalCents)}</p>
          <p style="color:#666;font-size:14px;margin-top:24px;">The seller will follow up with shipping details.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Buyer order confirmation email failed:', error)
  }
}
