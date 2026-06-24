'use server'

import { revalidatePath } from 'next/cache'
import {
  analyzeProductFromImageUrl,
  type ProductImageAnalysis,
} from '@/lib/ai-analysis'
import { getCurrentSeller } from '@/lib/seller'
import { trackSellerEvent } from '@/services/analytics.service'
import {
  MAX_PRODUCT_IMAGES,
  createProduct as createProductRecord,
  deleteProduct as deleteProductRecord,
  getProductById,
  setProductPublished,
  updateProduct as updateProductRecord,
} from '@/services/product.service'

export type ActionResult<T = undefined> = {
  error?: string
  data?: T
}

export type ProductFormPayload = {
  name: string
  description: string
  priceDollars: string
  stock: string
  images: string[]
  tags: string[]
  category: string
}

function revalidateProductPaths(productId?: string) {
  revalidatePath('/dashboard/products')
  revalidatePath('/dashboard')
  if (productId) {
    revalidatePath(`/dashboard/products/${productId}`)
  }
}

function parsePriceToCents(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number.parseFloat(trimmed)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return Math.round(parsed * 100)
}

function parseStock(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed < 0) return null

  return parsed
}

function validateProductPayload(payload: ProductFormPayload): {
  error?: string
  data?: {
    name: string
    description: string
    price: number
    stock: number
    images: string[]
    tags: string[]
    category: string
  }
} {
  const name = payload.name.trim()
  const description = payload.description.trim()
  const category = payload.category.trim()
  const images = payload.images.map((url) => url.trim()).filter(Boolean)
  const tags = payload.tags.map((tag) => tag.trim()).filter(Boolean)

  if (!name) return { error: 'Product name is required.' }
  if (!description) return { error: 'Description is required.' }
  if (!category) return { error: 'Category is required.' }
  if (images.length === 0) return { error: 'Add at least one product image.' }
  if (images.length > MAX_PRODUCT_IMAGES) {
    return { error: `Maximum ${MAX_PRODUCT_IMAGES} images allowed.` }
  }

  const price = parsePriceToCents(payload.priceDollars)
  if (price === null) return { error: 'Enter a valid price greater than zero.' }

  const stock = parseStock(payload.stock)
  if (stock === null) return { error: 'Stock must be a non-negative whole number.' }

  return {
    data: {
      name,
      description,
      price,
      stock,
      images,
      tags,
      category,
    },
  }
}

function trackPublishIfNeeded(
  clerkUserId: string,
  productId: string,
  wasPublished: boolean,
  nowPublished: boolean
) {
  if (!wasPublished && nowPublished) {
    void trackSellerEvent(clerkUserId, 'product.published', { productId })
  }
}

async function requireAuthenticatedSeller() {
  const seller = await getCurrentSeller()
  if (!seller) {
    return { error: 'You must be signed in.' as const }
  }
  return { seller }
}

export async function createProduct(
  payload: ProductFormPayload
): Promise<ActionResult<{ id: string; published: boolean }>> {
  const authResult = await requireAuthenticatedSeller()
  if ('error' in authResult) return { error: authResult.error }

  const { seller } = authResult
  const validated = validateProductPayload(payload)
  if (validated.error || !validated.data) return { error: validated.error }

  const published = seller.stripeConnectOnboarded

  const product = await createProductRecord(seller.id, {
    ...validated.data,
    published,
  })

  trackPublishIfNeeded(seller.clerkUserId, product.id, false, product.published)
  revalidateProductPaths(product.id)

  return {
    data: {
      id: product.id,
      published: product.published,
    },
  }
}

export async function updateProduct(
  productId: string,
  payload: ProductFormPayload
): Promise<ActionResult<{ published: boolean }>> {
  const authResult = await requireAuthenticatedSeller()
  if ('error' in authResult) return { error: authResult.error }

  const { seller } = authResult
  const existing = await getProductById(productId, seller.id)
  if (!existing) return { error: 'Product not found.' }

  const validated = validateProductPayload(payload)
  if (validated.error || !validated.data) return { error: validated.error }

  const published = seller.stripeConnectOnboarded

  const product = await updateProductRecord(productId, seller.id, {
    ...validated.data,
    published,
  })

  if (!product) return { error: 'Product not found.' }

  trackPublishIfNeeded(
    seller.clerkUserId,
    product.id,
    existing.published,
    product.published
  )
  revalidateProductPaths(product.id)

  return { data: { published: product.published } }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const authResult = await requireAuthenticatedSeller()
  if ('error' in authResult) return { error: authResult.error }

  const { seller } = authResult
  const deleted = await deleteProductRecord(productId, seller.id)
  if (!deleted) return { error: 'Product not found.' }

  revalidateProductPaths(productId)
  return {}
}

export async function togglePublish(productId: string): Promise<ActionResult<{ published: boolean }>> {
  const authResult = await requireAuthenticatedSeller()
  if ('error' in authResult) return { error: authResult.error }

  const { seller } = authResult
  const existing = await getProductById(productId, seller.id)
  if (!existing) return { error: 'Product not found.' }

  const nextPublished = !existing.published

  if (nextPublished && !seller.stripeConnectOnboarded) {
    return {
      error: 'Connect Stripe before publishing products.',
    }
  }

  const result = await setProductPublished(productId, seller.id, nextPublished)
  if (!result) return { error: 'Product not found.' }

  trackPublishIfNeeded(
    seller.clerkUserId,
    result.product.id,
    result.previousPublished,
    result.product.published
  )
  revalidateProductPaths(productId)

  return { data: { published: result.product.published } }
}

export async function analyzeUploadedProductImage(
  imageUrl: string
): Promise<ActionResult<ProductImageAnalysis>> {
  const authResult = await requireAuthenticatedSeller()
  if ('error' in authResult) return { error: authResult.error }

  const result = await analyzeProductFromImageUrl(imageUrl)
  if (!result) return {}
  return { data: result }
}
