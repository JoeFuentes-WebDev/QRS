'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SwipeCard } from '@/components/shop/SwipeCard'
import { FavoritesSummary } from '@/components/shop/FavoritesSummary'
import { PromptInput } from '@/components/shop/PromptInput'
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
  const didAutoSearch = useRef(false)

  const currentProduct = reviewProduct ?? queue[currentIndex]
  const cartItems = favorites.filter((f) => !f.pinned)

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true)
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
    // If reviewing a saved item, go back to summary
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
      // Keep pinned, no change to pinned state when reviewing
      if (exists) return prev
      return [...prev, { ...item, pinned: true }]
    })
    advanceCard()
  }, [advanceCard])

  const handleSkip = useCallback(() => {
    if (reviewProduct) {
      // Skip during review just goes back to summary
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
      {phase === 'prompt' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-8 px-6 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight text-stone-900">Laura&apos;s Pots</h1>
            <p className="text-stone-400 mt-2">Handmade pottery, one piece at a time</p>
          </div>
          <PromptInput onSearch={handleSearch} loading={loading} />
        </div>
      )}

      {phase === 'swipe' && currentProduct && (
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 bg-stone-50">
            <div className="flex-1">
              {reviewProduct ? (
                <button
                  onClick={() => { setReviewProduct(null); setPhase('summary') }}
                  className="text-stone-500 hover:text-stone-800 text-sm"
                >
                  ← Back to saved
                </button>
              ) : (
                <PromptInput onSearch={handleSearch} loading={loading} />
              )}
            </div>
            <button
                onClick={() => setPhase('summary')}
                className="relative shrink-0 text-stone-400 hover:text-stone-700 transition-colors"
                aria-label="View cart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                {cartItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-stone-900 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
          </div>
          {/* Action bar above image */}
          <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-stone-100">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 text-red-400 font-semibold text-sm hover:text-red-500 transition-colors"
              aria-label="Skip"
            >
              <span className="text-base">«</span> skip
            </button>

            <button
              onClick={() => handlePin({ product: currentProduct })}
              className="relative flex items-center gap-1.5 text-stone-500 font-medium text-sm hover:text-amber-500 transition-colors"
              aria-label="Save for later"
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
              aria-label="Add to cart"
            >
              buy <span className="text-base">»</span>
            </button>
          </div>

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