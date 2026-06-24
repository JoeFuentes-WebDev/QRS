import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getShopUrlDisplay } from '@/lib/qr'
import { formatUsPhoneDisplay } from '@/lib/phone'
import { getCurrentSeller } from '@/lib/seller'
import { getTelegramConnectUrl } from '@/lib/telegram'
import { NotificationEmailForm } from '@/components/dashboard/notification-email-form'
import { NotificationPhoneForm } from '@/components/dashboard/notification-phone-form'
import { TelegramConnectCard } from '@/components/dashboard/TelegramConnectCard'

export default async function SettingsPage() {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  const shopUrl = getShopUrlDisplay(seller.slug)
  const telegramConnectUrl = getTelegramConnectUrl(seller.id)

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
              {shopUrl.type === 'warning' ? (
                <p className="text-amber-700 font-medium mt-1">{shopUrl.text}</p>
              ) : (
                <p className="text-stone-900 font-medium">{shopUrl.text}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Notifications
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-6">
            <NotificationEmailForm defaultEmail={seller.notificationEmail} />
            <div className="border-t border-stone-100 pt-6">
              <NotificationPhoneForm
                defaultPhone={formatUsPhoneDisplay(seller.sellerPhone)}
              />
            </div>
            <div className="border-t border-stone-100 pt-6">
              <TelegramConnectCard
                telegramChatId={seller.telegramChatId}
                connectUrl={telegramConnectUrl}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Payments
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-sm">
            <p className="text-stone-900 font-medium">
              {seller.stripeConnectOnboarded
                ? 'Stripe Connect active'
                : 'Stripe Connect not set up'}
            </p>
            <p className="text-stone-500 text-xs mt-2">
              {seller.stripeConnectOnboarded
                ? 'Payments are enabled on your shop.'
                : 'Connect Stripe to accept payments.'}{' '}
              <Link href="/dashboard" className="text-stone-900 underline">
                Go to dashboard
              </Link>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Shipping
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-sm space-y-2">
            <p className="text-stone-900">
              Shipping is included in your product price. When setting prices, make
              sure to account for your shipping costs.
            </p>
            <p className="text-stone-400 text-xs">
              Automatic shipping rate calculation is coming soon.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
