'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { Product, FavoriteItem } from '@/types'
import { formatPrice } from '@/lib/pricing'

const SKIP_HINT_KEY = 'qrs_skip_hint_shown'

type Props = {
  product: Product
  onSwipeRight: (item: FavoriteItem) => void
  onSwipeLeft: () => void
  onPin: (item: FavoriteItem) => void
  remaining: number
  fullBleed?: boolean
  startExpanded?: boolean
}

function stopPointer(e: React.MouseEvent | React.TouchEvent) {
  e.stopPropagation()
}

export function SwipeCard({
  product,
  onSwipeRight,
  onSwipeLeft,
  onPin,
  remaining,
  startExpanded,
}: Props) {
  const [expanded, setExpanded] = useState(startExpanded ?? false)
  const [showSkipHint, setShowSkipHint] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const pointerTarget = useRef<EventTarget | null>(null)

  useEffect(() => {
    if (expanded && detailRef.current) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 320)
    }
  }, [expanded])

  const dismissSkipHint = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SKIP_HINT_KEY, 'true')
    }
    setShowSkipHint(false)
  }, [])

  const triggerSkip = useCallback(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(SKIP_HINT_KEY)) {
      setShowSkipHint(true)
    }
    setExpanded(false)
    onSwipeLeft()
  }, [onSwipeLeft])

  useEffect(() => {
    if (!showSkipHint) return
    const dismiss = () => dismissSkipHint()
    window.addEventListener('click', dismiss)
    window.addEventListener('touchstart', dismiss)
    return () => {
      window.removeEventListener('click', dismiss)
      window.removeEventListener('touchstart', dismiss)
    }
  }, [showSkipHint, dismissSkipHint])

  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const didDrag = useRef(false)
  const threshold = 100
  const thresholdY = 80

  const handleDragStart = (clientX: number, clientY: number, target: EventTarget) => {
    pointerTarget.current = target
    startX.current = clientX
    startY.current = clientY
    setIsDragging(true)
    didDrag.current = false
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return
    const deltaX = clientX - startX.current
    const deltaY = clientY - startY.current
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) didDrag.current = true
    setDragX(deltaX)
    setDragY(deltaY)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    const absX = Math.abs(dragX)
    const absY = Math.abs(dragY)

    if (absY > absX && dragY < -thresholdY) {
      setExpanded(false)
      onPin({ product })
    } else if (dragX > threshold) {
      setExpanded(false)
      onSwipeRight({ product })
    } else if (dragX < -threshold) {
      triggerSkip()
    } else if (
      !didDrag.current &&
      imageRef.current?.contains(pointerTarget.current as Node)
    ) {
      setExpanded((e) => !e)
    }
    setDragX(0)
    setDragY(0)
  }

  const rotation = dragX / 15
  const likeOpacity = Math.min(dragX / threshold, 1)
  const nopeOpacity = Math.min(-dragX / threshold, 1)
  const saveOpacity = Math.min(-dragY / thresholdY, 1)

  const actionButtonClass = (color: string) =>
    `w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm border-2 ${color} text-xl flex items-center justify-center hover:scale-110 transition-all shadow-md relative`

  return (
    <div
      className="relative select-none touch-none w-full"
      style={{
        transform: `translateX(${dragX}px) translateY(${Math.min(0, dragY)}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY, e.target)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        if (isDragging) handleDragEnd()
      }}
      onTouchStart={(e) =>
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target)
      }
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleDragEnd}
    >
      <div className="overflow-hidden">
        <div
          ref={imageRef}
          key={product.id}
          className="relative w-full h-[420px] animate-unblur cursor-pointer"
        >
          <Image
            src={product.imageUrl ?? ''}
            alt={product.name}
            fill
            className="object-cover"
            draggable={false}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          <div
            className="absolute top-8 left-6 border-4 border-green-400 text-green-400 font-black text-3xl px-3 py-1 rounded-lg rotate-[-15deg]"
            style={{ opacity: likeOpacity }}
          >
            BUY
          </div>
          <div
            className="absolute top-8 right-6 border-4 border-red-400 text-red-400 font-black text-3xl px-3 py-1 rounded-lg rotate-[15deg]"
            style={{ opacity: nopeOpacity }}
          >
            SKIP
          </div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-amber-400 text-amber-400 font-black text-2xl px-3 py-1 rounded-lg"
            style={{ opacity: saveOpacity }}
          >
            SAVE 📌
          </div>

          {remaining > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded-full">
              {remaining} pieces
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 px-5 pb-3">
            <h2 className="text-white text-xl font-bold drop-shadow-lg">{product.name}</h2>
          </div>
        </div>

        {!expanded && (
          <div className="flex items-center gap-3 justify-center py-4">
            <div className="relative">
              {showSkipHint && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap">
                  <div className="bg-stone-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
                    Skipped items come back around
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
                  </div>
                </div>
              )}
              <button
                onMouseDown={stopPointer}
                onTouchStart={stopPointer}
                onClick={(e) => {
                  e.stopPropagation()
                  triggerSkip()
                }}
                className={actionButtonClass('border-red-200 text-red-400 hover:border-red-400')}
                aria-label="Skip"
              >
                ✕
              </button>
            </div>
            <button
              onMouseDown={stopPointer}
              onTouchStart={stopPointer}
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(false)
                onSwipeRight({ product })
              }}
              className="w-20 h-20 rounded-full bg-white/80 backdrop-blur-sm border-2 border-green-200 text-green-500 text-3xl flex items-center justify-center hover:scale-110 hover:border-green-400 transition-all shadow-md"
              aria-label="Add to cart"
            >
              ♥
            </button>
            <button
              onMouseDown={stopPointer}
              onTouchStart={stopPointer}
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(false)
                onPin({ product })
              }}
              className={actionButtonClass('border-amber-200 text-amber-500 hover:border-amber-400')}
              aria-label="Save for later"
            >
              📌
            </button>
          </div>
        )}

        <div
          ref={detailRef}
          className="overflow-y-auto transition-all duration-300 ease-in-out"
          style={{ maxHeight: expanded ? '60vh' : '0px' }}
        >
          <div className="px-5 pt-2 pb-5 space-y-4 bg-white/90 backdrop-blur-sm">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(false)
              }}
              className="w-full flex justify-center pb-1"
              aria-label="Collapse"
            >
              <div className="w-10 h-1 bg-stone-300 rounded-full" />
            </button>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-stone-100 text-stone-500 px-3 py-1 rounded-full capitalize"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {product.description && (
              <p className="text-sm text-stone-500 leading-relaxed">{product.description}</p>
            )}

            <div className="text-center">
              <span className="text-3xl font-black text-stone-900">
                {formatPrice(product.price)}
              </span>
              {product.quantity != null && product.quantity > 1 && (
                <span className="text-sm text-stone-400 ml-2">
                  {product.quantity} pieces
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 justify-center pt-2 pb-2">
              <button
                onMouseDown={stopPointer}
                onTouchStart={stopPointer}
                onClick={(e) => {
                  e.stopPropagation()
                  triggerSkip()
                }}
                className={actionButtonClass('border-red-200 text-red-400 hover:border-red-400')}
                aria-label="Skip"
              >
                ✕
              </button>
              <button
                onMouseDown={stopPointer}
                onTouchStart={stopPointer}
                onClick={(e) => {
                  e.stopPropagation()
                  onSwipeRight({ product })
                }}
                className="w-20 h-20 rounded-full bg-white border-2 border-green-200 text-green-500 text-3xl flex items-center justify-center hover:scale-110 hover:border-green-400 transition-all shadow-md"
                aria-label="Add to cart"
              >
                ♥
              </button>
              <button
                onMouseDown={stopPointer}
                onTouchStart={stopPointer}
                onClick={(e) => {
                  e.stopPropagation()
                  onPin({ product })
                }}
                className={actionButtonClass('border-amber-200 text-amber-500 hover:border-amber-400')}
                aria-label="Save for later"
              >
                📌
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
