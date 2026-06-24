'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentSeller } from '@/lib/seller'
import { updateSellerNotificationEmail } from '@/services/seller.service'

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
