'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { FulfillmentType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUserEmail } from '@/lib/seller'
import { isValidSlug } from '@/lib/slug'

export type OnboardingFormState = {
  error?: string
  fieldErrors?: Record<string, string>
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10
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

  const email = await getCurrentUserEmail()
  if (!email) {
    return { error: 'No email found on your account. Add an email in Clerk first.' }
  }

  const storeName = (formData.get('storeName') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const fulfillmentType = formData.get('fulfillmentType') as FulfillmentType

  const fieldErrors: Record<string, string> = {}

  if (!storeName) fieldErrors.storeName = 'Store name is required.'
  if (!slug) fieldErrors.slug = 'Slug is required.'
  else if (!isValidSlug(slug)) fieldErrors.slug = 'Invalid slug format.'
  if (!phone) fieldErrors.phone = 'Phone number is required.'
  else if (!isValidPhone(phone)) fieldErrors.phone = 'Enter a valid phone number (at least 10 digits).'
  if (fulfillmentType !== 'EMAIL' && fulfillmentType !== 'TELEGRAM') {
    fieldErrors.fulfillmentType = 'Select a notification preference.'
  }

  let notificationEmail: string | null = null
  let telegramBotToken: string | null = null
  let shippoApiKey: string | null = null
  let shippoFromName: string | null = null
  let shippoFromStreet: string | null = null
  let shippoFromCity: string | null = null
  let shippoFromState: string | null = null
  let shippoFromZip: string | null = null
  let shippoFromEmail: string | null = null
  let shippoFromPhone: string | null = null

  if (fulfillmentType === 'EMAIL') {
    notificationEmail = (formData.get('notificationEmail') as string)?.trim()
    if (!notificationEmail) {
      fieldErrors.notificationEmail = 'Notification email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
      fieldErrors.notificationEmail = 'Enter a valid email address.'
    }
  }

  if (fulfillmentType === 'TELEGRAM') {
    telegramBotToken = (formData.get('telegramBotToken') as string)?.trim()
    shippoApiKey = (formData.get('shippoApiKey') as string)?.trim()
    shippoFromName = (formData.get('shippoFromName') as string)?.trim()
    shippoFromStreet = (formData.get('shippoFromStreet') as string)?.trim()
    shippoFromCity = (formData.get('shippoFromCity') as string)?.trim()
    shippoFromState = (formData.get('shippoFromState') as string)?.trim()
    shippoFromZip = (formData.get('shippoFromZip') as string)?.trim()
    shippoFromEmail = (formData.get('shippoFromEmail') as string)?.trim()
    shippoFromPhone = (formData.get('shippoFromPhone') as string)?.trim()

    if (!telegramBotToken) fieldErrors.telegramBotToken = 'Bot token is required.'
    if (!shippoApiKey) fieldErrors.shippoApiKey = 'Shippo API key is required.'
    if (!shippoFromName) fieldErrors.shippoFromName = 'Origin name is required.'
    if (!shippoFromStreet) fieldErrors.shippoFromStreet = 'Street is required.'
    if (!shippoFromCity) fieldErrors.shippoFromCity = 'City is required.'
    if (!shippoFromState) fieldErrors.shippoFromState = 'State is required.'
    if (!shippoFromZip) fieldErrors.shippoFromZip = 'ZIP is required.'
    if (!shippoFromEmail) fieldErrors.shippoFromEmail = 'Origin email is required.'
    if (!shippoFromPhone) fieldErrors.shippoFromPhone = 'Origin phone is required.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors }
  }

  const slugCheck = await checkSlugAvailability(slug)
  if (!slugCheck.available) {
    return { fieldErrors: { slug: slugCheck.error ?? 'This slug is already taken.' } }
  }

  await prisma.seller.create({
    data: {
      clerkUserId: userId,
      email,
      storeName,
      slug,
      phone,
      fulfillmentType,
      notificationEmail,
      telegramBotToken,
      shippoApiKey,
      shippoFromName,
      shippoFromStreet,
      shippoFromCity,
      shippoFromState,
      shippoFromZip,
      shippoFromEmail,
      shippoFromPhone,
    },
  })

  redirect('/dashboard')
}
