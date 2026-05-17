export type Category = 'mug' | 'bowl' | 'vase' | 'plate' | 'set' | 'other'

export type Product = {
  id: string
  name: string
  description?: string | null
  category: Category
  imageUrl: string
  pieceCount: number
  basePrice: number
  price2?: number | null
  price3?: number | null
  inStock: boolean
  tags: string[]
  aiLabel?: string | null
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