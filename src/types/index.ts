export type Product = {
  id: string
  sellerId: string
  name: string
  description?: string | null
  category: string | null
  imageUrl: string | null
  imagePublicId?: string | null
  quantity: number | null
  price: number
  inStock: boolean
  tags: string[]
  aiColor?: string | null
  aiTexture?: string | null
  aiMaterial?: string | null
  aiSuggestedPrice?: number | null
  createdAt: string
  updatedAt: string
}

export type FavoriteItem = {
  product: Product
  pinned?: boolean
}

export type CartItem = {
  productId: string
  product: Product
  quantity: number
  price: number
}
