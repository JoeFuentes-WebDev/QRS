import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSellerBySlug } from '@/lib/seller'
import { CheckoutCompletedTracker } from '@/components/analytics/checkout-completed-tracker'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string }>
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { session_id: sessionId } = await searchParams

  const seller = await getSellerBySlug(slug)
  if (!seller) notFound()

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <CheckoutCompletedTracker
        slug={slug}
        sellerId={seller.id}
        sessionId={sessionId}
      />
      <div className="text-center max-w-sm w-full">
        <p className="text-6xl mb-6">✓</p>
        <h1 className="text-3xl font-black text-stone-900 mb-3">Order received</h1>
        <p className="text-stone-500 mb-8">
          Thank you. {seller.storeName} will follow up with shipping details.
        </p>

        {sessionId && (
          <p className="text-stone-400 text-xs mb-8 break-all">
            Reference: {sessionId}
          </p>
        )}

        <Link
          href={`/${slug}`}
          className="inline-block bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-stone-700 transition-colors"
        >
          Back to shop
        </Link>
      </div>
    </main>
  )
}
