'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { FavoriteItem, Product } from '@/types'
import { formatPrice } from '@/lib/pricing'
import { dotellClient } from '@/lib/dotell-client'

type Props = {
  slug: string
  sellerId: string
  paymentsEnabled: boolean
  favorites: FavoriteItem[]
  onReset: () => void
  onReviewSaved: (product: Product) => void
}

export function FavoritesSummary({
  slug,
  sellerId,
  paymentsEnabled,
  favorites,
  onReset,
  onReviewSaved,
}: Props) {
  const [tab, setTab] = useState<'cart' | 'saved'>('cart')
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const cartItems = favorites.filter((f) => !f.pinned)
  const savedItems = favorites.filter((f) => f.pinned)
  const displayItems = tab === 'cart' ? cartItems : savedItems
  const cartTotal = cartItems.reduce((sum, f) => sum + f.product.price, 0)

  const handleCheckout = async () => {
    if (!paymentsEnabled) return

    void dotellClient.track('checkout.started', {
      slug,
      sellerId,
      itemCount: cartItems.length,
      total: cartTotal,
    })

    setLoading(true)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          items: cartItems.map((f) => ({
            productId: f.product.id,
            quantity: 1,
          })),
        }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok) {
        setCheckoutError(data.error ?? 'Checkout failed')
        return
      }
      if (data.url) window.location.assign(data.url)
    } catch (err) {
      console.error(err)
      setCheckoutError('Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-400 text-lg mb-4">Nothing saved yet.</p>
        <button onClick={onReset} className="text-stone-600 underline">Start over</button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-stone-900">Your Picks</h2>
        <button onClick={onReset} className="text-sm text-stone-400 hover:text-stone-600 underline">Start over</button>
      </div>

      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('cart')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'cart' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
        >
          Cart {cartItems.length > 0 && `(${cartItems.length})`}
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'saved' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
        >
          Saved 📌 {savedItems.length > 0 && `(${savedItems.length})`}
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {displayItems.length === 0 && (
          <p className="text-center text-stone-400 py-8">
            {tab === 'cart' ? 'No items in cart yet.' : 'Nothing pinned yet.'}
          </p>
        )}
        {displayItems.map((fav) => (
          <div
            key={fav.product.id}
            className={"flex gap-4 bg-white rounded-2xl p-4 shadow-sm" + (fav.pinned ? " cursor-pointer active:scale-95 transition-transform" : "")}
            onClick={fav.pinned ? () => onReviewSaved(fav.product) : undefined}
          >
            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <Image src={fav.product.imageUrl ?? ''} alt={fav.product.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-stone-900 truncate">{fav.product.name}</p>
              <p className="text-sm text-stone-500 capitalize">{fav.product.category}</p>
              <p className="text-lg font-black text-stone-900 mt-1">{formatPrice(fav.product.price)}</p>
            </div>
          </div>
        ))}
      </div>

      {tab === 'cart' && cartItems.length > 0 && (
        <div className="bg-stone-900 rounded-2xl p-5 text-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-stone-400">Total</span>
            <span className="text-2xl font-black">{formatPrice(cartTotal)}</span>
          </div>
          {checkoutError && (
            <p className="text-red-400 text-sm text-center mb-3">{checkoutError}</p>
          )}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || !paymentsEnabled}
            className="w-full bg-white text-stone-900 font-bold py-3 rounded-xl hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Redirecting...'
              : paymentsEnabled
                ? 'Checkout'
                : 'Not accepting payments yet'}
          </button>
          <p className="text-center text-stone-500 text-xs mt-3">Secure checkout via Stripe</p>
        </div>
      )}
    </div>
  )
}