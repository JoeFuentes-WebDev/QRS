import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSellerBySlug } from '@/lib/seller'
import { ShopExperience } from '@/components/shop/shop-experience'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function ShopPage({ params }: Props) {
  const { slug } = await params
  const seller = await getSellerBySlug(slug)
  if (!seller) notFound()

  const [inStockCount, products, heroImages] = await Promise.all([
    prisma.product.count({
      where: { sellerId: seller.id, inStock: true },
    }),
    prisma.product.findMany({
      where: { sellerId: seller.id, inStock: true },
      select: { category: true, tags: true },
    }),
    prisma.heroImage.findMany({
      where: { sellerId: seller.id, active: true },
      orderBy: { order: 'asc' },
    }),
  ])

  if (inStockCount === 0) {
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
        storeName={seller.storeName}
        initialPills={pills}
        initialHeroImages={heroImages}
      />
    </Suspense>
  )
}
