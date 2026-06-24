import type { Product as PrismaProduct } from '@prisma/client'
import type { Product } from '@/types'

/** V3 products visible on the public storefront swipe UI. */
export const storefrontProductWhere = {
  published: true,
  stock: { gt: 0 },
} as const

export function mapProductForShop(product: PrismaProduct): Product {
  return {
    id: product.id,
    sellerId: product.sellerId,
    name: product.name,
    description: product.description,
    category: product.category,
    imageUrl: product.images[0] ?? null,
    imagePublicId: null,
    quantity: product.stock,
    price: product.price / 100,
    inStock: product.published && product.stock > 0,
    tags: product.tags,
    aiColor: null,
    aiTexture: null,
    aiMaterial: null,
    aiSuggestedPrice: null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }
}
