import { auth, currentUser } from '@clerk/nextjs/server'
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

export async function requireSellerBySlug(slug: string) {
  const seller = await getSellerBySlug(slug)
  if (!seller) return null
  return seller
}

export async function getSellerByClerkUserId(clerkUserId: string) {
  return prisma.seller.findUnique({ where: { clerkUserId } })
}

export async function getCurrentSeller() {
  const { userId } = await auth()
  if (!userId) return null
  return getSellerByClerkUserId(userId)
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await currentUser()
  if (!user) return null
  const primary = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )
  return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
}
