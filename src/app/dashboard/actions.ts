'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentSeller } from '@/lib/seller'
import {
  uploadProductImage,
  uploadHeroImage,
  deleteCloudinaryImage,
} from '@/lib/cloudinary'
import { analyzeProductImage } from '@/lib/ai-analysis'
import type { ImageAnalysis } from '@/lib/ai-analysis'

async function requireSeller() {
  const seller = await getCurrentSeller()
  if (!seller) throw new Error('Unauthorized')
  return seller
}

export type UploadAnalyzeResult = {
  analysis: ImageAnalysis
  imageUrl: string
  imagePublicId: string
}

export async function uploadAndAnalyze(
  formData: FormData
): Promise<UploadAnalyzeResult> {
  const seller = await requireSeller()
  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file provided')

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString('base64')
  const mediaType = file.type || 'image/jpeg'

  const upload = await uploadProductImage(seller.id, buffer, file.name)

  let analysis: ImageAnalysis
  try {
    analysis = await analyzeProductImage(base64, mediaType)
  } catch {
    analysis = {
      name: 'Product',
      category: 'other',
      pieceCount: 1,
      description: '',
      tags: [],
      aiColor: '',
      aiTexture: '',
      aiMaterial: '',
      suggestedPrice: 50,
    }
  }

  return { analysis, imageUrl: upload.url, imagePublicId: upload.publicId }
}

export type ApproveProductInput = {
  name: string
  description: string
  category: string
  tags: string[]
  price: number
  imageUrl: string
  imagePublicId: string
  aiColor?: string
  aiTexture?: string
  aiMaterial?: string
  aiSuggestedPrice?: number
}

export async function approveProduct(input: ApproveProductInput) {
  const seller = await requireSeller()

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      name: input.name,
      description: input.description,
      category: input.category,
      tags: input.tags,
      price: input.price,
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
      quantity: null,
      inStock: true,
      aiColor: input.aiColor,
      aiTexture: input.aiTexture,
      aiMaterial: input.aiMaterial,
      aiSuggestedPrice: input.aiSuggestedPrice ?? null,
    },
  })

  revalidatePath('/dashboard')
  return product
}

export async function updateProduct(
  productId: string,
  data: { name?: string; price?: number; quantity?: number | null }
) {
  const seller = await requireSeller()

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id },
  })
  if (!existing) throw new Error('Product not found')

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
    },
  })

  revalidatePath('/dashboard')
  return product
}

export async function softDeleteProduct(productId: string) {
  const seller = await requireSeller()

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id },
  })
  if (!existing) throw new Error('Product not found')

  await prisma.product.update({
    where: { id: productId },
    data: { inStock: false, quantity: 0 },
  })

  revalidatePath('/dashboard')
}

export async function restoreProduct(productId: string) {
  const seller = await requireSeller()

  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id },
  })
  if (!existing) throw new Error('Product not found')

  await prisma.product.update({
    where: { id: productId },
    data: { inStock: true, quantity: null },
  })

  revalidatePath('/dashboard')
}

export async function uploadHero(formData: FormData) {
  const seller = await requireSeller()
  const file = formData.get('file') as File | null
  if (!file) throw new Error('No file provided')

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const upload = await uploadHeroImage(
    seller.id,
    buffer,
    `hero-${Date.now()}-${file.name}`
  )

  const count = await prisma.heroImage.count({ where: { sellerId: seller.id } })
  const image = await prisma.heroImage.create({
    data: {
      sellerId: seller.id,
      imageUrl: upload.url,
      imagePublicId: upload.publicId,
      order: count,
    },
  })

  revalidatePath('/dashboard')
  return image
}

export async function deleteHero(heroId: string) {
  const seller = await requireSeller()

  const existing = await prisma.heroImage.findFirst({
    where: { id: heroId, sellerId: seller.id },
  })
  if (!existing) throw new Error('Hero image not found')

  if (existing.imagePublicId) {
    await deleteCloudinaryImage(existing.imagePublicId)
  }

  await prisma.heroImage.delete({ where: { id: heroId } })

  revalidatePath('/dashboard')
}

export type StripeSettingsInput = {
  stripePublishableKey?: string
  stripeSecretKey?: string
  stripeWebhookSecret?: string
}

export async function saveStripeSettings(input: StripeSettingsInput) {
  const seller = await requireSeller()

  const data: StripeSettingsInput = {}
  if (input.stripePublishableKey?.trim()) {
    data.stripePublishableKey = input.stripePublishableKey.trim()
  }
  if (input.stripeSecretKey?.trim()) {
    data.stripeSecretKey = input.stripeSecretKey.trim()
  }
  if (input.stripeWebhookSecret?.trim()) {
    data.stripeWebhookSecret = input.stripeWebhookSecret.trim()
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No keys provided')
  }

  await prisma.seller.update({
    where: { id: seller.id },
    data,
  })

  revalidatePath('/dashboard/settings')
}
