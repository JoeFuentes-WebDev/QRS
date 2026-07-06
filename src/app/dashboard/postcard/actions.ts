'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentSeller } from '@/lib/seller'
import { updateSellerPostcardCta } from '@/services/seller.service'

const MAX_POSTCARD_CTA_LENGTH = 120

export type PostcardCtaState = {
  error?: string
  success?: boolean
}

export async function savePostcardCta(
  postcardCta: string
): Promise<PostcardCtaState> {
  const seller = await getCurrentSeller()
  if (!seller) {
    return { error: 'You must be signed in.' }
  }

  const trimmed = postcardCta.trim()
  if (trimmed.length > MAX_POSTCARD_CTA_LENGTH) {
    return {
      error: `Marketing message must be ${MAX_POSTCARD_CTA_LENGTH} characters or fewer.`,
    }
  }

  await updateSellerPostcardCta(seller.id, trimmed.length > 0 ? trimmed : null)
  revalidatePath('/dashboard')
  return { success: true }
}
