import { getCurrentSeller } from '@/lib/seller'
import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import type { Product } from '@/types'

export default async function DashboardPage() {
  const seller = await getCurrentSeller()
  if (!seller) return null

  const [products, heroImages] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.heroImage.findMany({
      where: { sellerId: seller.id, active: true },
      orderBy: { order: 'asc' },
    }),
  ])

  const serializedProducts: Product[] = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return (
    <DashboardShell
      storeName={seller.storeName}
      slug={seller.slug}
      products={serializedProducts}
      heroImages={heroImages}
    />
  )
}
