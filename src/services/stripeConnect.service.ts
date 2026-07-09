import { trackSellerEvent } from '@/services/analytics.service'
import { stripe } from '@/lib/stripe'
import {
  getSellerById,
  updateSellerStripeConnect,
} from '@/services/seller.service'

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
  const seller = await getSellerById(sellerId)

  if (!seller) {
    throw new Error('Seller not found')
  }

  if (seller.stripeConnectAccountId) {
    return seller.stripeConnectAccountId
  }

  const appUrl = requireAppUrl()

  const account = await stripe.accounts.create({
    country: 'US',
    controller: {
      fees: { payer: 'application' },
      losses: { payments: 'stripe' },
      stripe_dashboard: { type: 'none' },
    },
    email,
    business_profile: {
      name: seller.storeName,
      url: `${appUrl}/${seller.slug}`,
    },
    individual: {
      email,
    },
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
    collection_options: {
      fields: 'eventually_due',
    },
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
