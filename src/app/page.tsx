'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type HeroImage = {
  id: string
  imageUrl: string
  alt?: string
}

export default function SplashPage() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [pills, setPills] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/hero').then(r => r.json()).then((data) => {
      if (Array.isArray(data) && data.length > 0) setImages(data)
    })

    fetch('/api/categories').then(r => r.json()).then((data) => {
      const cats = (data.categories ?? []) as string[]
      const tags = (data.popularTags ?? []) as string[]
      setPills([...new Set([...cats, ...tags])])
    })
  }, [])

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIdx(i => (i + 1) % images.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [images.length])

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [searchOpen])

  const current = images[currentIdx]

  const handlePill = (value: string) => {
    router.push(`/shop?q=${encodeURIComponent(value)}`)
  }

  const handleSearch = () => {
    router.push(`/shop?q=${encodeURIComponent(query)}`)
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-stone-900">
      {current && (
        <div className="absolute inset-0">
          <Image
            key={current.id}
            src={current.imageUrl}
            alt={current.alt ?? "Laura's Pots"}
            fill
            className="object-cover opacity-70 transition-opacity duration-1000"
            priority
          />
        </div>
      )}
      {images.length === 0 && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-950" />
      )}

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-lg text-center">
        {/* Title */}
        <div className="bg-black/30 backdrop-blur-sm rounded-3xl px-8 py-6">
          <h1 className="text-4xl font-black text-white tracking-tight">
            Laura&apos;s Pots
          </h1>
          <p className="text-white/60 mt-1 text-sm">
            Handmade pottery, one piece at a time
          </p>
        </div>

        {/* Pills + search icon */}
        <div className="flex flex-wrap gap-3 justify-center">
          {/* Show All */}
          <button
            onClick={() => handlePill('')}
            className="bg-white/30 backdrop-blur-sm border border-white/50 text-white font-bold px-5 py-2.5 rounded-full hover:bg-white/40 transition-all text-sm"
          >
            Show All
          </button>

          {/* Dynamic pills */}
          {pills.map((pill) => (
            <button
              key={pill}
              onClick={() => handlePill(pill)}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium px-5 py-2.5 rounded-full hover:bg-white/30 transition-all text-sm capitalize"
            >
              {pill}
            </button>
          ))}

          {/* Search icon pill */}
          <button
            onClick={() => setSearchOpen(o => !o)}
            className={`backdrop-blur-sm border text-white font-medium px-4 py-2.5 rounded-full transition-all text-sm ${
              searchOpen
                ? 'bg-white/40 border-white/60'
                : 'bg-white/20 border-white/30 hover:bg-white/30'
            }`}
            aria-label="Search"
          >
            🔍
          </button>
        </div>

        {/* Search bar — slides in when open */}
        <div
          className="w-full overflow-hidden transition-all duration-300"
          style={{ maxHeight: searchOpen ? '80px' : '0px', opacity: searchOpen ? 1 : 0 }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search anything..."
              className="flex-1 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/50 px-5 py-3 focus:outline-none focus:border-white/60"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="bg-white text-stone-900 font-bold px-5 py-3 rounded-2xl hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              Go
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIdx ? 'bg-white w-6' : 'bg-white/40 w-1.5'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}