import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentSeller } from '@/lib/seller'
import { SettingsForm } from '@/components/dashboard/settings-form'

function fulfillmentLabel(type: string): string {
  return type === 'TELEGRAM' ? 'Telegram + Shippo' : 'Email'
}

export default async function SettingsPage() {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
        <h1 className="text-lg font-bold text-stone-900">Settings</h1>
        <Link
          href="/dashboard"
          className="text-sm text-stone-600 font-medium hover:text-stone-900"
        >
          ← Dashboard
        </Link>
      </header>

      <div className="max-w-md mx-auto px-6 py-8 space-y-10">
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Store info
          </h2>
          <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm text-sm">
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wide">Store name</p>
              <p className="text-stone-900 font-medium">{seller.storeName}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wide">Slug</p>
              <p className="text-stone-900 font-medium">{seller.slug}</p>
            </div>
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wide">Shop URL</p>
              <p className="text-stone-900 font-medium">qrs.app/{seller.slug}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Stripe configuration
          </h2>
          <SettingsForm
            hasStripePublishableKey={!!seller.stripePublishableKey}
            hasStripeSecretKey={!!seller.stripeSecretKey}
            hasStripeWebhookSecret={!!seller.stripeWebhookSecret}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Notification preference
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-sm">
            <p className="text-stone-900 font-medium">
              {fulfillmentLabel(seller.fulfillmentType)}
            </p>
            <p className="text-stone-400 text-xs mt-2">
              Edit notification settings —{' '}
              <span className="italic">Coming soon</span>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Custom domain
          </h2>
          <div>
            <input
              type="text"
              disabled
              placeholder="yourdomain.com"
              className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-400 text-sm bg-stone-100 cursor-not-allowed"
            />
            <p className="text-stone-400 text-xs mt-1">Custom domain — coming soon</p>
          </div>
        </section>
      </div>
    </main>
  )
}
