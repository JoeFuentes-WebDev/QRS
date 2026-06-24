'use server'

import { revalidatePath } from 'next/cache'
import { isValidUsPhone, normalizeUsPhone } from '@/lib/phone'
import { getCurrentSeller } from '@/lib/seller'
import {
  updateSellerNotificationEmail,
  updateSellerPhone as updateSellerPhoneRecord,
} from '@/services/seller.service'

export type SettingsFormState = {
  error?: string
  success?: boolean
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function updateNotificationEmail(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const seller = await getCurrentSeller()
  if (!seller) {
    return { error: 'You must be signed in.' }
  }

  const notificationEmail = (formData.get('notificationEmail') as string)?.trim()
  if (!notificationEmail) {
    return { error: 'Notification email is required.' }
  }
  if (!EMAIL_PATTERN.test(notificationEmail)) {
    return { error: 'Enter a valid email address.' }
  }

  await updateSellerNotificationEmail(seller.id, notificationEmail)
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateSellerPhone(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const seller = await getCurrentSeller()
  if (!seller) {
    return { error: 'You must be signed in.' }
  }

  const rawPhone = (formData.get('sellerPhone') as string) ?? ''

  if (!isValidUsPhone(rawPhone)) {
    return { error: 'Enter a valid US phone number, e.g. (555) 555-5555.' }
  }

  const sellerPhone = normalizeUsPhone(rawPhone)

  await updateSellerPhoneRecord(seller.id, sellerPhone)
  revalidatePath('/dashboard/settings')
  return { success: true }
}
