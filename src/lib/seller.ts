import { prisma } from '@/lib/prisma'

const DEFAULT_SELLER_SLUG = process.env.DEFAULT_SELLER_SLUG ?? 'test-seller'

export async function getDefaultSeller() {
  const seller = await prisma.seller.findUnique({
    where: { slug: DEFAULT_SELLER_SLUG },
  })

  if (!seller) {
    throw new Error(
      `Default seller not found (slug: ${DEFAULT_SELLER_SLUG}). Run: npx prisma db seed`
    )
  }

  return seller
}

export async function getSellerBySlug(slug: string) {
  return prisma.seller.findUnique({ where: { slug } })
}
