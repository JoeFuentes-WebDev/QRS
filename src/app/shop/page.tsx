'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SwipeCard } from '@/components/shop/SwipeCard'
import { FavoritesSummary } from '@/components/shop/FavoritesSummary'
import type { Product, FavoriteItem } from '@/types'

type Phase = 'prompt' | 'swipe' | 'summary'

export default function ShopPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q')
  const hasQuery = initialQuery !== null

  const [phase, setPhase] = useState<Phase>('prompt')
  const [queue, setQueue] = useState<Product[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pills, setPills] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('')
  const didAutoSearch = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const currentProduct = reviewProduct ?? queue[currentIndex]
  const cartItems = favorites.filter((f) => !f.pinned)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then((data) => {
      const cats = (data.categories ?? []) as string[]
      const tags = (data.popularTags ?? []) as string[]
      setPills([...new Set([...cats, ...tags])])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [searchOpen])

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true)
    setSearchOpen(false)
    setActiveFilter(query)
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`)
      const data: Product[] = await res.json()
      setQueue(data)
      setCurrentIndex(0)
      setFavorites([])
      setReviewProduct(null)
      if (data.length > 0) setPhase('swipe')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

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

  const handleSwipeRight = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.product.id === item.product.id)
      if (exists) return prev.map((f) => f.product.id === item.product.id ? { ...f, pinned: false } : f)
      return [...prev, { ...item, pinned: false }]
    })
    advanceCard()
  }, [advanceCard])

  const handlePin = useCallback((item: FavoriteItem) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.product.id === item.product.id)
      if (exists) return prev
      return [...prev, { ...item, pinned: true }]
    })
    advanceCard()
  }, [advanceCard])

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
  }

  useEffect(() => {
    if (hasQuery && !didAutoSearch.current) {
      didAutoSearch.current = true
      handleSearch(initialQuery ?? '')
    }
  }, [hasQuery, initialQuery, handleSearch])

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">

      {/* Prompt phase */}
      {phase === 'prompt' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-stone-900">Laura&apos;s Pots</h1>
            <p className="text-stone-400 mt-2">Handmade pottery, one piece at a time</p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center w-full">
            <button
              onClick={() => handleSearch('')}
              className="bg-stone-900 text-white font-bold px-5 py-2.5 rounded-full text-sm"
            >
              Show All
            </button>
            {pills.map(pill => (
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

      {/* Swipe phase */}
      {phase === 'swipe' && currentProduct && (
        <div className="flex flex-col flex-1">

          {/* Header */}
          <div className="flex flex-col bg-stone-50 border-b border-stone-100">
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">

              {reviewProduct ? (
                <button
                  onClick={() => { setReviewProduct(null); setPhase('summary') }}
                  className="flex-1 text-left text-stone-500 hover:text-stone-800 text-sm"
                >
                  ← Back to saved
                </button>
              ) : (
                <>
                  {/* Pills or search bar */}
                  <div className="flex-1 overflow-hidden">
                    {searchOpen ? (
                      /* Search bar */
                      <div className="flex gap-2">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch(searchQuery)}
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
                      /* Category pills */
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                        <button
                          onClick={() => handleSearch('')}
                          className={"shrink-0 font-medium px-3 py-1 rounded-full text-xs transition-colors " + (activeFilter === '' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
                        >
                          All
                        </button>
                        {pills.map(pill => (
                          <button
                            key={pill}
                            onClick={() => handleSearch(pill)}
                            className={"shrink-0 font-medium px-3 py-1 rounded-full text-xs capitalize transition-colors " + (activeFilter === pill ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}
                          >
                            {pill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search toggle icon */}
                  <button
                    onClick={() => setSearchOpen(o => !o)}
                    className={`shrink-0 text-base transition-colors ${searchOpen ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
                    aria-label="Toggle search"
                  >
                    🔍
                  </button>
                </>
              )}

              {/* Cart icon */}
              <button
                onClick={() => setPhase('summary')}
                className="relative shrink-0 text-stone-400 hover:text-stone-700 transition-colors ml-1"
                aria-label="View cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-stone-100">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 text-red-400 font-semibold text-sm hover:text-red-500 transition-colors"
            >
              <span className="text-base">«</span> skip
            </button>
            <button
              onClick={() => handlePin({ product: currentProduct })}
              className="relative flex items-center gap-1.5 text-stone-500 font-medium text-sm hover:text-amber-500 transition-colors"
            >
              <span className="text-lg">📌</span>
              {favorites.filter(f => f.pinned).length > 0 && (
                <span className="absolute -top-2 -right-3 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {favorites.filter(f => f.pinned).length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleSwipeRight({ product: currentProduct })}
              className="flex items-center gap-1.5 text-green-500 font-semibold text-sm hover:text-green-600 transition-colors"
            >
              buy <span className="text-base">»</span>
            </button>
          </div>

          {/* Card */}
          <div className="flex-1 flex flex-col">
            <SwipeCard
              product={currentProduct}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSkip}
              onPin={handlePin}
              remaining={reviewProduct ? 0 : queue.length - currentIndex}
              fullBleed
              startExpanded={!!reviewProduct}
            />
          </div>
        </div>
      )}

      {/* Summary phase */}
      {phase === 'summary' && (
        <div className="flex-1">
          <div className="px-4 pt-4">
            <button onClick={() => setPhase('swipe')} className="text-stone-500 hover:text-stone-800 text-sm">
              ← Back
            </button>
          </div>
          <FavoritesSummary
            favorites={favorites}
            onReset={handleReset}
            onReviewSaved={handleReviewSaved}
          />
        </div>
      )}
    </main>
  )
}