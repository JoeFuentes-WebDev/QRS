'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { formatPrice } from '@/lib/pricing'
import {
  deleteProduct,
  togglePublish,
} from '@/app/dashboard/products/actions'

export type ProductListItem = {
  id: string
  name: string
  price: number
  stock: number
  published: boolean
  imageUrl: string | null
}

type ProductListProps = {
  products: ProductListItem[]
  stripeConnectOnboarded: boolean
}

export function ProductList({
  products,
  stripeConnectOnboarded,
}: ProductListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticPublished, setOptimisticPublished] = useState<
    Record<string, boolean>
  >({})

  const getPublished = (product: ProductListItem) =>
    optimisticPublished[product.id] ?? product.published

  const handleTogglePublish = (product: ProductListItem) => {
    const current = getPublished(product)
    const next = !current

    if (next && !stripeConnectOnboarded) {
      setError('Connect Stripe before publishing products.')
      return
    }

    setError(null)
    setOptimisticPublished((prev) => ({ ...prev, [product.id]: next }))

    startTransition(async () => {
      const result = await togglePublish(product.id)
      if (result.error) {
        setOptimisticPublished((prev) => {
          const updated = { ...prev }
          delete updated[product.id]
          return updated
        })
        setError(result.error)
        return
      }

      setOptimisticPublished((prev) => ({
        ...prev,
        [product.id]: result.data!.published,
      }))
      router.refresh()
    })
  }

  const handleDelete = (product: ProductListItem) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await deleteProduct(product.id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  if (products.length === 0) {
    return (
      <section className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-4">
        <p className="text-stone-500">No products yet.</p>
        <Link
          href="/dashboard/products/new"
          className="inline-block bg-stone-900 text-white font-bold px-5 py-3 rounded-xl hover:bg-stone-700 transition-colors"
        >
          Add your first product
        </Link>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <ul className="divide-y divide-stone-100">
          {products.map((product) => {
            const published = getPublished(product)
            return (
              <li key={product.id} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-stone-100 shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-stone-500 mt-0.5">
                          {formatPrice(product.price / 100)} · Stock {product.stock}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {published ? 'Published' : 'Draft'}
                        </p>
                      </div>

                      <label className="flex items-center gap-2 shrink-0 text-sm text-stone-600">
                        <input
                          type="checkbox"
                          checked={published}
                          disabled={isPending}
                          onChange={() => handleTogglePublish(product)}
                          className="rounded border-stone-300"
                        />
                        Publish
                      </label>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="text-sm font-medium text-stone-700 hover:text-stone-900"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        disabled={isPending}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
