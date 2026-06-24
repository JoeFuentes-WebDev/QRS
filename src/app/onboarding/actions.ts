'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/seller'
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

  const fieldErrors: Record<string, string> = {}

  if (!storeName) fieldErrors.storeName = 'Store name is required.'
  if (!slug) fieldErrors.slug = 'Slug is required.'
  else if (!isValidSlug(slug)) fieldErrors.slug = 'Invalid slug format.'
  if (!notificationEmail) {
    fieldErrors.notificationEmail = 'Notification email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
    fieldErrors.notificationEmail = 'Enter a valid email address.'
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

  await prisma.seller.create({
    data: {
      clerkUserId: userId,
      storeName,
      slug,
      notificationEmail,
    },
  })

  void trackSellerEvent(userId, 'seller.signed_up')
  void trackSellerEvent(userId, 'seller.onboarding_completed')

  redirect('/dashboard')
}
