import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getSellerByClerkId } from '@/services/seller.service'
import { syncStripeConnectStatus } from '@/services/stripeConnect.service'

export default async function StripeReturnPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const seller = await getSellerByClerkId(userId)
  if (!seller?.stripeConnectAccountId) {
    redirect('/dashboard')
  }

  await syncStripeConnectStatus(seller)

  redirect('/dashboard')
}
