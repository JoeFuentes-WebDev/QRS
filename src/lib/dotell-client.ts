'use client'

import { initDotell } from '@joefuentes/dotell'

const noopDb = {
  events: {
    create: async () => {},
  },
}

export const dotellClient = initDotell({
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  db: noopDb,
  model: 'anonymous',
})

export function getOrCreateAnonymousId(): string {
  try {
    const key = 'qrs_anonymous_id'
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(key, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function getUtmSource(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('utm_source')
  } catch {
    return null
  }
}

export function readVisitedSlugs(): string[] {
  try {
    return JSON.parse(localStorage.getItem('qrs_visited_slugs') || '[]') as string[]
  } catch {
    return []
  }
}

export function markSlugVisited(slug: string): void {
  try {
    const visited = readVisitedSlugs()
    if (!visited.includes(slug)) {
      localStorage.setItem('qrs_visited_slugs', JSON.stringify([...visited, slug]))
    }
  } catch {
    // localStorage unavailable
  }
}

export function hasViewedProductThisSession(productId: string): boolean {
  try {
    const viewed = JSON.parse(
      sessionStorage.getItem('qrs_viewed_products') || '[]'
    ) as string[]
    return viewed.includes(productId)
  } catch {
    return false
  }
}

export function markProductViewedThisSession(productId: string): void {
  try {
    const key = 'qrs_viewed_products'
    const viewed = JSON.parse(sessionStorage.getItem(key) || '[]') as string[]
    if (!viewed.includes(productId)) {
      sessionStorage.setItem(key, JSON.stringify([...viewed, productId]))
    }
  } catch {
    // sessionStorage unavailable
  }
}
