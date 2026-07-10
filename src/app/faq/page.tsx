import Link from 'next/link'
import { faqItems } from '@/lib/faq-data'
import { PageViewTracker } from '@/components/analytics/page-view-tracker'

export const metadata = {
  title: 'FAQ — QRS',
  description: 'Frequently asked questions about QRS storefronts for market sellers.',
}

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12">
      <PageViewTracker event="faq.viewed" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
            ← Home
          </Link>
          <h1 className="text-3xl font-black text-stone-900 mt-4">
            Frequently asked questions
          </h1>
          <p className="text-stone-500 mt-2">
            Everything you need to know about selling with QRS.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <section
              key={item.question}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-stone-900">{item.question}</h2>
              <p className="text-stone-600 mt-2 leading-relaxed">{item.answer}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
