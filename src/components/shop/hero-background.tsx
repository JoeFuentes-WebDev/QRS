'use client'

import { useEffect, useState } from 'react'

export type StorefrontHeroImage = {
  id: string
  url: string
}

type HeroBackgroundProps = {
  images: StorefrontHeroImage[]
}

export function HeroBackground({ images }: HeroBackgroundProps) {
  const [index, setIndex] = useState(0)
  const currentUrl = images.length > 0 ? images[index]?.url : null

  useEffect(() => {
    setIndex(0)
  }, [images])

  useEffect(() => {
    if (images.length <= 1) return

    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % images.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [images])

  if (currentUrl) {
    return (
      <>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${currentUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.85) saturate(0.6)',
            transform: 'scale(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </>
    )
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none bg-gradient-to-br from-stone-300 via-stone-200 to-stone-400"
      aria-hidden
    />
  )
}
