import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getSellerByClerkId } from '@/services/seller.service'
import { createAccountLink } from '@/services/stripeConnect.service'

export default async function StripeRefreshPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const seller = await getSellerByClerkId(userId)
  if (!seller?.stripeConnectAccountId) {
    redirect('/dashboard')
  }

  const url = await createAccountLink(seller.stripeConnectAccountId)
  redirect(url)
}
