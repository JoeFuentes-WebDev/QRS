import type { Product } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const MAX_PRODUCT_IMAGES = 5

export type ProductWriteInput = {
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  tags: string[]
  category: string
  published: boolean
}

export async function listProductsForSeller(sellerId: string): Promise<Product[]> {
  return prisma.product.findMany({
    where: { sellerId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProductById(
  id: string,
  sellerId: string
): Promise<Product | null> {
  return prisma.product.findFirst({
    where: { id, sellerId },
  })
}

export async function createProduct(
  sellerId: string,
  data: ProductWriteInput
): Promise<Product> {
  return prisma.product.create({
    data: {
      sellerId,
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      images: data.images,
      tags: data.tags,
      category: data.category,
      published: data.published,
    },
  })
}

export async function updateProduct(
  id: string,
  sellerId: string,
  data: ProductWriteInput
): Promise<Product | null> {
  const existing = await getProductById(id, sellerId)
  if (!existing) return null

  return prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      images: data.images,
      tags: data.tags,
      category: data.category,
      published: data.published,
    },
  })
}

export async function deleteProduct(id: string, sellerId: string): Promise<boolean> {
  const existing = await getProductById(id, sellerId)
  if (!existing) return false

  await prisma.product.delete({ where: { id } })
  return true
}

export async function setProductPublished(
  id: string,
  sellerId: string,
  published: boolean
): Promise<{ product: Product; previousPublished: boolean } | null> {
  const existing = await getProductById(id, sellerId)
  if (!existing) return null

  const product = await prisma.product.update({
    where: { id },
    data: { published },
  })

  return { product, previousPublished: existing.published }
}
