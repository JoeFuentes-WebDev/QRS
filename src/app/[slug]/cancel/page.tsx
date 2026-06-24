import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSellerBySlug } from '@/lib/seller'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CancelPage({ params }: Props) {
  const { slug } = await params
  const seller = await getSellerBySlug(slug)
  if (!seller) notFound()

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <h1 className="text-3xl font-black text-stone-900 mb-3">Checkout cancelled</h1>
        <p className="text-stone-500 mb-8">
          No charge was made. You can keep browsing {seller.storeName}.
        </p>

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
