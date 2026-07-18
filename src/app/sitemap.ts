import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sellers = await prisma.seller.findMany({
    where: { stripeConnectOnboarded: true },
    select: { slug: true, updatedAt: true },
  })

  const sellerUrls = sellers.map((seller) => ({
    url: `https://my-qrs.co/${seller.slug}`,
    lastModified: seller.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://my-qrs.co',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://my-qrs.co/how-it-works',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://my-qrs.co/faq',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...sellerUrls,
  ]
}
