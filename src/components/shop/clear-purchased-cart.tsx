'use client'

import { useEffect } from 'react'
import { clearCart } from '@/lib/shop-cart'

type ClearPurchasedCartProps = {
  slug: string
  sessionId?: string
}

export function ClearPurchasedCart({ slug, sessionId }: ClearPurchasedCartProps) {
  useEffect(() => {
    if (!sessionId) return
    clearCart(slug)
  }, [slug, sessionId])

  return null
}
