import Stripe from 'stripe'
import type { Seller } from '@prisma/client'

export function sellerHasStripeConfigured(seller: Seller): boolean {
  return !!(
    seller.stripeSecretKey?.trim() &&
    seller.stripePublishableKey?.trim() &&
    seller.stripeWebhookSecret?.trim()
  )
}

export function getStripeClient(seller: Seller): Stripe {
  if (!seller.stripeSecretKey?.trim()) {
    throw new Error('This shop is not accepting payments yet.')
  }
  return new Stripe(seller.stripeSecretKey)
}
