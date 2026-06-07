import type { FavoriteItem } from '@/types'

export function cartStorageKey(slug: string): string {
  return `qrs_cart_${slug}`
}

export function loadCart(slug: string): FavoriteItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(cartStorageKey(slug))
    if (!raw) return []
    const parsed = JSON.parse(raw) as FavoriteItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCart(slug: string, favorites: FavoriteItem[]): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(cartStorageKey(slug), JSON.stringify(favorites))
}

export function clearCart(slug: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(cartStorageKey(slug))
}
