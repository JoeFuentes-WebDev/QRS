'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/seller'
import { isValidUsPhone, normalizeUsPhone } from '@/lib/phone'
import { isValidSlug } from '@/lib/slug'
import { trackSellerEvent } from '@/services/analytics.service'

export type OnboardingFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean; error?: string }> {
  if (!isValidSlug(slug)) {
    return { available: false, error: 'Slug must be lowercase letters, numbers, and hyphens.' }
  }

  const existing = await prisma.seller.findUnique({ where: { slug } })
  return { available: !existing }
}

export async function createSeller(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const { userId } = await auth()
  if (!userId) {
    return { error: 'You must be signed in.' }
  }

  const existing = await prisma.seller.findUnique({ where: { clerkUserId: userId } })
  if (existing) {
    redirect('/dashboard')
  }

  const storeName = (formData.get('storeName') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const notificationEmail = (formData.get('notificationEmail') as string)?.trim()
  const rawPhone = (formData.get('sellerPhone') as string)?.trim() ?? ''

  const fieldErrors: Record<string, string> = {}

  if (!storeName) fieldErrors.storeName = 'Store name is required.'
  if (!slug) fieldErrors.slug = 'Slug is required.'
  else if (!isValidSlug(slug)) fieldErrors.slug = 'Invalid slug format.'
  if (!notificationEmail) {
    fieldErrors.notificationEmail = 'Notification email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
    fieldErrors.notificationEmail = 'Enter a valid email address.'
  }
  if (!isValidUsPhone(rawPhone)) {
    fieldErrors.sellerPhone = 'Enter a valid US phone number, e.g. (555) 555-5555.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors }
  }

  const slugCheck = await checkSlugAvailability(slug)
  if (!slugCheck.available) {
    return { fieldErrors: { slug: slugCheck.error ?? 'This slug is already taken.' } }
  }

  const clerkEmail = await getCurrentUserEmail()
  if (!clerkEmail) {
    return { error: 'No email found on your account. Add an email in Clerk first.' }
  }

  const seller = await prisma.seller.create({
    data: {
      clerkUserId: userId,
      storeName,
      slug,
      notificationEmail,
      sellerPhone: normalizeUsPhone(rawPhone),
    },
  })

  // console.log('[onboarding] before trackSellerEvent seller.signed_up', userId)
  void trackSellerEvent(userId, 'seller.signed_up', { sellerId: userId })
  // console.log('[onboarding] after trackSellerEvent seller.signed_up', userId)

  // console.log('[onboarding] before trackSellerEvent seller.onboarding_completed', userId)
  void trackSellerEvent(userId, 'seller.onboarding_completed', { sellerId: userId })
  // console.log('[onboarding] after trackSellerEvent seller.onboarding_completed', userId)

  redirect('/dashboard')
}
