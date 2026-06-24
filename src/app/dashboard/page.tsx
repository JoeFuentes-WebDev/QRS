import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentSeller } from '@/lib/seller'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { HeroManager } from '@/components/dashboard/hero-manager'
import { StripeConnectCard } from '@/components/dashboard/StripeConnectCard'
import {
  PostcardDownload,
  type PostcardImageOption,
} from '@/components/dashboard/postcard-download'
import { listHeroImagesForSeller } from '@/services/hero.service'

export default async function DashboardPage() {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  const [products, heroImages] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: seller.id, published: true },
      select: { name: true, images: true },
      orderBy: { createdAt: 'asc' },
    }),
    listHeroImagesForSeller(seller.id),
  ])

  const imageOptions: PostcardImageOption[] = products.flatMap((product) =>
    product.images.map((url, index) => ({
      url,
      label:
        product.images.length > 1
          ? `${product.name} (image ${index + 1})`
          : product.name,
    }))
  )

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
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              Orders
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

          <PostcardDownload slug={seller.slug} imageOptions={imageOptions} />
        </div>
      </div>
    </main>
  )
}
