'use client'

import Link from 'next/link'
import { useEffect, type ComponentProps } from 'react'
import { dotellClient, getUtmSource } from '@/lib/dotell-client'

export function LandingPageTracker() {
  useEffect(() => {
    const props: Record<string, string> = {}
    const utmSource = getUtmSource()
    if (utmSource) {
      props.utm_source = utmSource
    }
    void dotellClient.track('landing.viewed', props)
  }, [])

  return null
}

type TrackedCtaLinkProps = ComponentProps<typeof Link> & {
  ctaLabel: string
}

export function TrackedCtaLink({ ctaLabel, onClick, ...props }: TrackedCtaLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        const trackProps: Record<string, string> = { cta_label: ctaLabel }
        const utmSource = getUtmSource()
        if (utmSource) {
          trackProps.utm_source = utmSource
        }
        void dotellClient.track('landing.cta_clicked', trackProps)
        onClick?.(event)
      }}
    />
  )
}
