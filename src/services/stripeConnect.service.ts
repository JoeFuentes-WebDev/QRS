import { trackSellerEvent } from '@/services/analytics.service'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { updateSellerStripeConnect } from '@/services/seller.service'

export type StripeConnectSyncResult = {
  stripeConnectOnboarded: boolean
  stripeConnectAccountId: string | null
  chargesEnabled: boolean
}

function requireAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set')
  }
  return appUrl.replace(/\/$/, '')
}

export async function getOrCreateConnectAccount(
  sellerId: string,
  email: string
): Promise<string> {
  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
  })

  if (!seller) {
    throw new Error('Seller not found')
  }

  if (seller.stripeConnectAccountId) {
    return seller.stripeConnectAccountId
  }

  const account = await stripe.accounts.create({
    controller: {
      fees: { payer: 'application' },
      losses: { payments: 'stripe' },
      stripe_dashboard: { type: 'none' },
    },
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  await updateSellerStripeConnect(sellerId, {
    stripeConnectAccountId: account.id,
  })

  return account.id
}

export async function createAccountLink(stripeAccountId: string): Promise<string> {
  const appUrl = requireAppUrl()

  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${appUrl}/dashboard/stripe/refresh`,
    return_url: `${appUrl}/dashboard/stripe/return`,
    type: 'account_onboarding',
  })

  return link.url
}

export async function syncStripeConnectStatus(seller: {
  id: string
  clerkUserId: string
  stripeConnectAccountId: string | null
  stripeConnectOnboarded: boolean
}): Promise<StripeConnectSyncResult> {
  if (!seller.stripeConnectAccountId) {
    return {
      stripeConnectOnboarded: false,
      stripeConnectAccountId: null,
      chargesEnabled: false,
    }
  }

  const account = await stripe.accounts.retrieve(seller.stripeConnectAccountId)
  const chargesEnabled = account.charges_enabled === true
  let onboarded = seller.stripeConnectOnboarded

  if (chargesEnabled && !seller.stripeConnectOnboarded) {
    await updateSellerStripeConnect(seller.id, {
      stripeConnectOnboarded: true,
    })
    await trackSellerEvent(seller.clerkUserId, 'stripe.connected', {
      sellerId: seller.clerkUserId,
    })
    onboarded = true
  }

  return {
    stripeConnectOnboarded: onboarded,
    stripeConnectAccountId: seller.stripeConnectAccountId,
    chargesEnabled,
  }
}
