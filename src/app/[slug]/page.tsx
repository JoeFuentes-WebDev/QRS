import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSellerBySlug } from '@/lib/seller'
import { storefrontProductWhere } from '@/lib/shop-product'
import { ShopExperience } from '@/components/shop/shop-experience'
import { listHeroImagesForSeller } from '@/services/hero.service'

type Props = {
  params: Promise<{ slug: string }>
}

const DEFAULT_OG_IMAGE = 'https://my-qrs.co/og-default.png'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const seller = await prisma.seller.findUnique({
    where: { slug },
    include: { heroImages: { orderBy: { order: 'asc' }, take: 1 } },
  })

  if (!seller) {
    return {
      title: {
        absolute: 'Store not found — my-qrs.co',
      },
    }
  }

  const heroImageUrl = seller.heroImages[0]?.url ?? DEFAULT_OG_IMAGE
  const storeUrl = `https://my-qrs.co/${seller.slug}`

  return {
    title: {
      absolute: `${seller.storeName} — Shop on my-qrs.co`,
    },
    description: `Browse and buy from ${seller.storeName}. Scan the QR code or visit ${storeUrl} to shop.`,
    openGraph: {
      title: seller.storeName,
      description: `Browse and buy from ${seller.storeName} on my-qrs.co.`,
      url: storeUrl,
      siteName: 'my-qrs.co',
      images: [
        {
          url: heroImageUrl,
          width: 1200,
          height: 630,
          alt: seller.storeName,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seller.storeName,
      description: `Browse and buy from ${seller.storeName} on my-qrs.co.`,
      images: [heroImageUrl],
    },
  }
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params
  const seller = await getSellerBySlug(slug)
  if (!seller) notFound()

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id, ...storefrontProductWhere },
    select: { category: true, tags: true },
  })

  const heroImages = await listHeroImagesForSeller(seller.id)

  if (products.length === 0) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-black text-stone-900">{seller.storeName}</h1>
          <p className="text-stone-500 mt-4">
            This shop is currently closed. Check back soon.
          </p>
        </div>
      </main>
    )
  }

  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ] as string[]

  const allTags = products.flatMap((p) => p.tags)
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1
    return acc
  }, {})
  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([tag]) => tag)

  const pills = [...new Set([...categories, ...popularTags])]

  return (
    <Suspense>
      <ShopExperience
        slug={slug}
        sellerId={seller.id}
        storeName={seller.storeName}
        paymentsEnabled={seller.stripeConnectOnboarded}
        initialCategories={categories}
        initialPills={pills}
        heroImages={heroImages.map((image) => ({
          id: image.id,
          url: image.url,
        }))}
      />
    </Suspense>
  )
}
