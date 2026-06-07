import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSellerBySlug } from '@/lib/seller'
import { getStripeClient } from '@/lib/stripe'
import { formatPrice } from '@/lib/pricing'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string }>
}

type OrderLine = {
  name: string
  amount: number
}

async function getOrderLines(
  sessionId: string,
  seller: Awaited<ReturnType<typeof getSellerBySlug>>
): Promise<OrderLine[]> {
  if (!seller?.stripeSecretKey) return []
  try {
    const stripe = getStripeClient(seller)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    })
    const items = session.line_items?.data ?? []
    return items.map((item) => ({
      name: item.description ?? 'Item',
      amount: (item.amount_total ?? 0) / 100,
    }))
  } catch {
    return []
  }
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { session_id: sessionId } = await searchParams

  const seller = await getSellerBySlug(slug)
  if (!seller) notFound()

  const orderLines = sessionId ? await getOrderLines(sessionId, seller) : []
  const total = orderLines.reduce((sum, line) => sum + line.amount, 0)

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <p className="text-6xl mb-6">✓</p>
        <h1 className="text-3xl font-black text-stone-900 mb-3">Order placed!</h1>
        <p className="text-stone-500 mb-8">
          Thank you. {seller.storeName} will be in touch with shipping details.
        </p>

        {orderLines.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm text-left mb-8 space-y-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              Order summary
            </h2>
            {orderLines.map((line) => (
              <div key={line.name} className="flex justify-between text-sm">
                <span className="text-stone-600 truncate pr-4">{line.name}</span>
                <span className="text-stone-900 font-medium shrink-0">
                  {formatPrice(line.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-stone-100 font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        )}

        <Link
          href={`/${slug}`}
          className="inline-block bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-stone-700 transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  )
}
