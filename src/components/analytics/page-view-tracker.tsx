'use client'

import { useEffect } from 'react'
import { dotellClient, getUtmSource } from '@/lib/dotell-client'

type PageViewTrackerProps = {
  event: string
  properties?: Record<string, string | number | boolean | null>
  includeUtm?: boolean
}

export function PageViewTracker({
  event,
  properties,
  includeUtm = false,
}: PageViewTrackerProps) {
  useEffect(() => {
    const props: Record<string, string | number | boolean | null> = {
      ...properties,
    }
    if (includeUtm) {
      const utmSource = getUtmSource()
      if (utmSource) {
        props.utm_source = utmSource
      }
    }
    void dotellClient.track(event, props)
  }, [event, includeUtm, properties])

  return null
}
