'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentSeller } from '@/lib/seller'
import {
  createHeroImage,
  deleteHeroImage,
  listHeroImagesForSeller,
  reorderHeroImages,
} from '@/services/hero.service'

export type HeroActionResult<T = undefined> = {
  error?: string
  data?: T
}

async function requireSeller() {
  const seller = await getCurrentSeller()
  if (!seller) {
    return { error: 'You must be signed in.' as const }
  }
  return { seller }
}

export async function addHeroImage(
  url: string
): Promise<
  HeroActionResult<{ id: string; url: string; order: number }>
> {
  const auth = await requireSeller()
  if ('error' in auth) return { error: auth.error }

  const trimmed = url.trim()
  if (!trimmed) return { error: 'Image URL is required.' }

  const image = await createHeroImage(auth.seller.id, trimmed)
  revalidatePath('/dashboard')
  revalidatePath(`/${auth.seller.slug}`)

  return {
    data: {
      id: image.id,
      url: image.url,
      order: image.order,
    },
  }
}

export async function removeHeroImage(id: string): Promise<HeroActionResult> {
  const auth = await requireSeller()
  if ('error' in auth) return { error: auth.error }

  const deleted = await deleteHeroImage(id, auth.seller.id)
  if (!deleted) return { error: 'Hero image not found.' }

  revalidatePath('/dashboard')
  revalidatePath(`/${auth.seller.slug}`)
  return {}
}

export async function moveHeroImage(
  id: string,
  direction: 'up' | 'down'
): Promise<HeroActionResult> {
  const auth = await requireSeller()
  if ('error' in auth) return { error: auth.error }

  const images = await listHeroImagesForSeller(auth.seller.id)
  const index = images.findIndex((image) => image.id === id)
  if (index === -1) return { error: 'Hero image not found.' }

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= images.length) return {}

  const orderedIds = images.map((image) => image.id)
  ;[orderedIds[index], orderedIds[targetIndex]] = [
    orderedIds[targetIndex],
    orderedIds[index],
  ]

  try {
    await reorderHeroImages(auth.seller.id, orderedIds)
  } catch {
    return { error: 'Could not reorder hero images.' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/${auth.seller.slug}`)
  return {}
}
