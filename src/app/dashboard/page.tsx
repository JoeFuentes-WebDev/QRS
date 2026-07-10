import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentSeller } from '@/lib/seller'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { HeroManager } from '@/components/dashboard/hero-manager'
import { StripeConnectCard } from '@/components/dashboard/StripeConnectCard'
import { InfoTooltip } from '@/components/dashboard/info-tooltip'
import {
  PostcardDownload,
  type PostcardImageOption,
} from '@/components/dashboard/postcard-download'
import { listHeroImagesForSeller } from '@/services/hero.service'

export default async function DashboardPage() {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  const heroImages = await listHeroImagesForSeller(seller.id)

  const imageOptions: PostcardImageOption[] = heroImages.map((image, index) => ({
    url: image.url,
    label: `Hero image ${index + 1}`,
  }))

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <DashboardHeader storeName={seller.storeName} />

      <div className="flex-1 p-6">
        <div className="max-w-lg mx-auto space-y-6">
          <StripeConnectCard
            stripeConnectOnboarded={seller.stripeConnectOnboarded}
            stripeConnectAccountId={seller.stripeConnectAccountId}
          />

          <Link
            href="/dashboard/orders"
            className="block bg-white rounded-2xl p-6 shadow-sm hover:bg-stone-50 transition-colors"
          >
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide inline-flex items-center">
              Orders
              <InfoTooltip text="View and manage orders from your buyers." />
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              View and manage customer orders
            </p>
          </Link>

          <HeroManager
            initialImages={heroImages.map((image) => ({
              id: image.id,
              url: image.url,
              order: image.order,
            }))}
          />

          <PostcardDownload
            slug={seller.slug}
            imageOptions={imageOptions}
            initialPostcardCta={seller.postcardCta}
          />
        </div>
      </div>
    </main>
  )
}
