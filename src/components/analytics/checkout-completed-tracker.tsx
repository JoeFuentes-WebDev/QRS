'use client'

import { useEffect } from 'react'
import { dotellClient } from '@/lib/dotell-client'

type CheckoutCompletedTrackerProps = {
  slug: string
  sellerId: string
  sessionId?: string
}

export function CheckoutCompletedTracker({
  slug,
  sellerId,
  sessionId,
}: CheckoutCompletedTrackerProps) {
  useEffect(() => {
    void dotellClient.track('checkout.completed', {
      slug,
      sellerId,
      sessionId: sessionId ?? null,
    })
  }, [slug, sellerId, sessionId])

  return null
}
