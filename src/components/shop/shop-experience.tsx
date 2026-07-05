'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SwipeCard } from '@/components/shop/SwipeCard'
import { OnboardingScreen, useOnboarding } from '@/components/shop/Onboardingscreen'
import { FavoritesSummary } from '@/components/shop/FavoritesSummary'
import { HeroBackground, type StorefrontHeroImage } from '@/components/shop/hero-background'
import { loadCart, saveCart, clearCart } from '@/lib/shop-cart'
import type { Product, FavoriteItem } from '@/types'

type Phase = 'prompt' | 'swipe' | 'summary'

function SearchNavButton({
  active,
  onClick,
}: {
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'shrink-0 flex items-center justify-center transition-colors max-md:min-w-11 max-md:min-h-11 ' +
        (active ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600')
      }
      aria-label="Toggle search"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 max-md:w-8 max-md:h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
        />
      </svg>
    </button>
  )
}

function CartNavButton({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative shrink-0 text-stone-400 hover:text-stone-700 transition-colors max-md:min-w-11 max-md:min-h-11 max-md:flex max-md:items-center max-md:justify-center"
      aria-label="View cart"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8 max-md:w-8 max-md:h-8"
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
      {count > 0 && (
        <span className="absolute top-0 right-0 max-md:top-1 max-md:right-1 bg-stone-900 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  )
}

type Props = {
  slug: string
  sellerId: string
  storeName: string
  paymentsEnabled: boolean
  initialPills: string[]
  heroImages: StorefrontHeroImage[]
}

export function ShopExperience({
  slug,
  sellerId,
  storeName,
  paymentsEnabled,
  initialPills,
  heroImages,
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
  const didAutoSearch = useRef(false)
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding()
  const desktopSearchInputRef = useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  const currentProduct = reviewProduct ?? queue[currentIndex]
  const cartItems = favorites.filter((f) => !f.pinned)
  const openCart = () => setPhase('summary')

  useEffect(() => {
    setFavorites(loadCart(slug))
  }, [slug])

  useEffect(() => {
    saveCart(slug, favorites)
  }, [slug, favorites])

  useEffect(() => {
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
    if (!searchOpen) return
    setTimeout(() => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches
      const input = isMobile
        ? mobileSearchInputRef.current
        : desktopSearchInputRef.current
      input?.focus()
    }, 100)
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
        <>
          <div className="md:hidden flex items-center justify-between gap-3 px-4 py-3 border-b border-stone-100 bg-stone-50 shrink-0">
            <span className="text-sm font-bold text-stone-900 truncate">
              {storeName}
            </span>
            <CartNavButton count={cartItems.length} onClick={openCart} />
          </div>
          <div className="relative flex flex-col items-center justify-center flex-1 gap-8 px-6 py-12 overflow-hidden">
          <HeroBackground images={heroImages} />
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
        </>
      )}

      {phase === 'swipe' && currentProduct && (
        <div className="flex flex-col flex-1">
          <div className="flex flex-col bg-stone-50 border-b border-stone-100 shrink-0 max-md:sticky max-md:top-0 max-md:z-30">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 min-w-0">
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
                  <div className="hidden md:block flex-1 min-w-0 overflow-hidden">
                    {searchOpen ? (
                      <div className="flex gap-2">
                        <input
                          ref={desktopSearchInputRef}
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
                          type="button"
                          onClick={() => handleSearch(searchQuery)}
                          className="bg-stone-900 text-white px-3 py-1.5 rounded-xl text-sm font-medium"
                        >
                          Go
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <button
                          type="button"
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
                            type="button"
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
                  <div className="md:hidden flex-1 min-w-0 min-h-11 flex items-center">
                    {searchOpen ? (
                      <div className="flex gap-2 w-full min-w-0">
                        <input
                          ref={mobileSearchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === 'Enter' && handleSearch(searchQuery)
                          }
                          placeholder="Search..."
                          className="flex-1 min-w-0 border-2 border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-stone-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleSearch(searchQuery)}
                          className="shrink-0 bg-stone-900 text-white px-3 py-2 rounded-xl text-sm font-medium"
                        >
                          Go
                        </button>
                      </div>
                    ) : (
                      <select
                        value={activeFilter}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-xl px-3 py-2 text-sm font-medium capitalize bg-white text-stone-800 focus:outline-none focus:border-stone-800"
                        aria-label="Filter by category"
                      >
                        <option value="">All</option>
                        {pills.map((pill) => (
                          <option key={pill} value={pill}>
                            {pill}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <SearchNavButton
                    active={searchOpen}
                    onClick={() => setSearchOpen((o) => !o)}
                  />
                </>
              )}
              <CartNavButton count={cartItems.length} onClick={openCart} />
            </div>
          </div>

          <div className="flex-1 flex flex-col relative">
            {showOnboarding && <OnboardingScreen onDismiss={dismissOnboarding} />}
            <HeroBackground images={heroImages} />
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
            sellerId={sellerId}
            paymentsEnabled={paymentsEnabled}
            favorites={favorites}
            onReset={handleReset}
            onReviewSaved={handleReviewSaved}
          />
        </div>
      )}
    </main>
  )
}
