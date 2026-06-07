'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/pricing'
import {
  updateProduct,
  softDeleteProduct,
  restoreProduct,
} from '@/app/dashboard/actions'

export function EditTab({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, query])

  const handleFieldChange = (
    id: string,
    field: 'name' | 'price' | 'quantity',
    value: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        if (field === 'name') return { ...p, name: value }
        if (field === 'price') return { ...p, price: Number(value) || 0 }
        if (field === 'quantity') {
          const trimmed = value.trim()
          return { ...p, quantity: trimmed === '' ? null : Number(trimmed) }
        }
        return p
      })
    )
  }

  const saveProduct = async (product: Product) => {
    setSaving(product.id)
    try {
      await updateProduct(product.id, {
        name: product.name,
        price: product.price,
        quantity: product.quantity,
      })
    } finally {
      setSaving(null)
    }
  }

  const handleRemove = async (id: string) => {
    setSaving(id)
    try {
      await softDeleteProduct(id)
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, inStock: false, quantity: 0 } : p
        )
      )
    } finally {
      setSaving(null)
    }
  }

  const handleRestore = async (id: string) => {
    setSaving(id)
    try {
      await restoreProduct(id)
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, inStock: true, quantity: null } : p
        )
      )
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name..."
        className="w-full border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-stone-800"
      />

      <div className="space-y-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-2xl p-4 shadow-sm ${!p.inStock ? 'opacity-60' : ''}`}
          >
            <div className="flex gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                {p.imageUrl && (
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  value={p.name}
                  onChange={(e) => handleFieldChange(p.id, 'name', e.target.value)}
                  onBlur={() => saveProduct(p)}
                  disabled={!p.inStock}
                  className="w-full border border-stone-200 rounded-lg px-2 py-1 text-sm font-bold text-stone-900 focus:outline-none focus:border-stone-800 disabled:bg-stone-50"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={String(p.price)}
                    onChange={(e) => handleFieldChange(p.id, 'price', e.target.value)}
                    onBlur={() => saveProduct(p)}
                    disabled={!p.inStock}
                    placeholder="Price $"
                    className="flex-1 border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-stone-800 disabled:bg-stone-50"
                  />
                  <input
                    type="number"
                    value={p.quantity ?? ''}
                    onChange={(e) => handleFieldChange(p.id, 'quantity', e.target.value)}
                    onBlur={() => saveProduct(p)}
                    disabled={!p.inStock}
                    placeholder="Qty (∞)"
                    className="w-20 border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-stone-800 disabled:bg-stone-50"
                  />
                </div>
                <p className="text-xs text-stone-400">
                  {p.inStock ? formatPrice(p.price) : 'Removed from shop'}
                  {p.inStock && p.quantity == null && ' · Unlimited stock'}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {p.inStock ? (
                  <button
                    onClick={() => handleRemove(p.id)}
                    disabled={saving === p.id}
                    className="text-xs text-red-400 border border-red-100 rounded-lg px-2 py-1 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => handleRestore(p.id)}
                    disabled={saving === p.id}
                    className="text-xs text-green-600 border border-green-100 rounded-lg px-2 py-1 hover:bg-green-50 disabled:opacity-50"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-stone-400 py-8">No products found.</p>
        )}
      </div>
    </div>
  )
}
