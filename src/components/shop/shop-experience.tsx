'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SwipeCard } from '@/components/shop/SwipeCard'
import { OnboardingScreen, useOnboarding } from '@/components/shop/Onboardingscreen'
import { FavoritesSummary } from '@/components/shop/FavoritesSummary'
import { loadCart, saveCart, clearCart } from '@/lib/shop-cart'
import type { Product, FavoriteItem } from '@/types'

type Phase = 'prompt' | 'swipe' | 'summary'

type HeroImage = {
  id: string
  imageUrl: string
  alt?: string | null
}

type Props = {
  slug: string
  storeName: string
  initialPills: string[]
  initialHeroImages: HeroImage[]
}

export function ShopExperience({
  slug,
  storeName,
  initialPills,
  initialHeroImages,
}: Props) {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q')
  const hasQuery = initialQuery !== null

  const [phase, setPhase] = useState<Phase>('prompt')
  const [queue, setQueue] = useState<Product[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pills, setPills] = useState<string[]>(initialPills)
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [heroImages, setHeroImages] = useState<HeroImage[]>(initialHeroImages)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(
    initialHeroImages[0]?.imageUrl ?? null
  )
  const didAutoSearch = useRef(false)
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentProduct = reviewProduct ?? queue[currentIndex]
  const cartItems = favorites.filter((f) => !f.pinned)

  useEffect(() => {
    setFavorites(loadCart(slug))
  }, [slug])

  useEffect(() => {
    saveCart(slug, favorites)
  }, [slug, favorites])

  useEffect(() => {
    if (heroImages.length <= 1) return
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % heroImages.length
      setHeroImageUrl(heroImages[idx]?.imageUrl ?? null)
    }, 4000)
    return () => clearInterval(interval)
  }, [heroImages])

  useEffect(() => {
    fetch(`/api/hero?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setHeroImages(data)
          setHeroImageUrl(data[0].imageUrl)
        }
      })
      .catch(() => {})

    fetch(`/api/categories?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        const cats = (data.categories ?? []) as string[]
        const tags = (data.popularTags ?? []) as string[]
        const combined = [...new Set([...cats, ...tags])]
        if (combined.length > 0) setPills(combined)
      })
      .catch(() => {})
  }, [slug])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [searchOpen])

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchOpen(false)
      setActiveFilter(query)
      try {
        const res = await fetch(
          `/api/products?slug=${encodeURIComponent(slug)}&q=${encodeURIComponent(query)}`
        )
        const data: Product[] = await res.json()
        setQueue(data)
        setCurrentIndex(0)
        setReviewProduct(null)
        if (data.length > 0) setPhase('swipe')
      } catch (err) {
        console.error(err)
      }
    },
    [slug]
  )

  const advanceCard = useCallback(() => {
    if (reviewProduct) {
      setReviewProduct(null)
      setPhase('summary')
      return
    }
    setCurrentIndex((i) => {
      const next = i + 1
      if (next >= queue.length) setPhase('summary')
      return next
    })
  }, [queue.length, reviewProduct])

  const handleSwipeRight = useCallback(
    (item: FavoriteItem) => {
      setFavorites((prev) => {
        const exists = prev.find((f) => f.product.id === item.product.id)
        if (exists) {
          return prev.map((f) =>
            f.product.id === item.product.id ? { ...f, pinned: false } : f
          )
        }
        return [...prev, { ...item, pinned: false }]
      })
      advanceCard()
    },
    [advanceCard]
  )

  const handlePin = useCallback(
    (item: FavoriteItem) => {
      setFavorites((prev) => {
        const exists = prev.find((f) => f.product.id === item.product.id)
        if (exists) return prev
        return [...prev, { ...item, pinned: true }]
      })
      advanceCard()
    },
    [advanceCard]
  )

  const handleSkip = useCallback(() => {
    if (reviewProduct) {
      setReviewProduct(null)
      setPhase('summary')
      return
    }
    if (!currentProduct) return
    setQueue((q) => [...q, q[currentIndex]])
    advanceCard()
  }, [currentProduct, currentIndex, advanceCard, reviewProduct])

  const handleReviewSaved = useCallback((product: Product) => {
    setReviewProduct(product)
    setPhase('swipe')
  }, [])

  const handleReset = () => {
    setPhase('prompt')
    setQueue([])
    setCurrentIndex(0)
    setFavorites([])
    setReviewProduct(null)
    clearCart(slug)
  }

  useEffect(() => {
    if (hasQuery && !didAutoSearch.current) {
      didAutoSearch.current = true
      handleSearch(initialQuery ?? '')
    }
  }, [hasQuery, initialQuery, handleSearch])

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      {phase === 'prompt' && (
        <div className="relative flex flex-col items-center justify-center flex-1 gap-8 px-6 py-12 overflow-hidden">
          {heroImageUrl && (
            <>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${heroImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(20px) brightness(0.85) saturate(0.6)',
                  transform: 'scale(1.1)',
                }}
              />
              <div className="absolute inset-0 bg-black/30 pointer-events-none" />
            </>
          )}
          <div className="relative z-10 text-center">
            <h1 className="text-4xl font-black tracking-tight text-stone-900">
              {storeName}
            </h1>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3 justify-center w-full">
            <button
              onClick={() => handleSearch('')}
              className="bg-stone-900 text-white font-bold px-5 py-2.5 rounded-full text-sm"
            >
              Show All
            </button>
            {pills.map((pill) => (
              <button
                key={pill}
                onClick={() => handleSearch(pill)}
                className="bg-white border-2 border-stone-200 text-stone-700 font-medium px-5 py-2.5 rounded-full hover:border-stone-400 transition-all text-sm capitalize"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'swipe' && currentProduct && (
        <div className="flex flex-col flex-1">
          <div className="flex flex-col bg-stone-50 border-b border-stone-100">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              {reviewProduct ? (
                <button
                  onClick={() => {
                    setReviewProduct(null)
                    setPhase('summary')
                  }}
                  className="flex-1 text-left text-stone-500 hover:text-stone-800 text-sm"
                >
                  ← Back to saved
                </button>
              ) : (
                <>
                  <div className="flex-1 overflow-hidden">
                    {searchOpen ? (
                      <div className="flex gap-2">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleSearch(searchQuery)
                          }
                          placeholder="Search..."
                          className="flex-1 border-2 border-stone-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-stone-800"
                        />
                        <button
                          onClick={() => handleSearch(searchQuery)}
                          className="bg-stone-900 text-white px-3 py-1.5 rounded-xl text-sm font-medium"
                        >
                          Go
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <button
                          onClick={() => handleSearch('')}
                          className={
                            'shrink-0 font-medium px-3 py-1 rounded-full text-xs transition-colors ' +
                            (activeFilter === ''
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200')
                          }
                        >
                          All
                        </button>
                        {pills.map((pill) => (
                          <button
                            key={pill}
                            onClick={() => handleSearch(pill)}
                            className={
                              'shrink-0 font-medium px-3 py-1 rounded-full text-xs capitalize transition-colors ' +
                              (activeFilter === pill
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200')
                            }
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSearchOpen((o) => !o)}
                    className={`shrink-0 text-base transition-colors ${searchOpen ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                    aria-label="Toggle search"
                  >
                    🔍
                  </button>
                </>
              )}
              <button
                onClick={() => setPhase('summary')}
                className="relative shrink-0 text-stone-400 hover:text-stone-700 transition-colors ml-1"
                aria-label="View cart"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative">
            {showOnboarding && <OnboardingScreen onDismiss={dismissOnboarding} />}
            {heroImageUrl ? (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${heroImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(20px) brightness(0.85) saturate(0.6)',
                  transform: 'scale(1.1)',
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-stone-100 pointer-events-none" />
            )}
            <SwipeCard
              product={currentProduct}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSkip}
              onPin={handlePin}
              remaining={reviewProduct ? 0 : queue.length - currentIndex}
              startExpanded={!!reviewProduct}
            />
          </div>
        </div>
      )}

      {phase === 'summary' && (
        <div className="flex-1">
          <div className="px-4 pt-4">
            <button
              onClick={() => setPhase('swipe')}
              className="text-stone-500 hover:text-stone-800 text-sm"
            >
              ← Back
            </button>
          </div>
          <FavoritesSummary
            slug={slug}
            favorites={favorites}
            onReset={handleReset}
            onReviewSaved={handleReviewSaved}
          />
        </div>
      )}
    </main>
  )
}
