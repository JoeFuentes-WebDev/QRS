import Link from 'next/link'

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl mb-6">🏺</p>
        <h1 className="text-3xl font-black text-stone-900 mb-3">Order placed!</h1>
        <p className="text-stone-500 mb-8">
          Thank you. Laura will be in touch with shipping details.
        </p>
        <Link
          href="/shop"
          className="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-stone-700 transition-colors"
        >
          Shop more
        </Link>
      </div>
    </main>
  )
}
