'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Field } from '@/components/dashboard/field'
import { ImageUploader } from '@/components/dashboard/image-uploader'
import {
  analyzeUploadedProductImage,
  createProduct,
  deleteProduct,
  updateProduct,
} from '@/app/dashboard/products/actions'

export type ProductFormInitial = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  tags: string[]
  category: string
  published: boolean
}

type ProductFormProps = {
  mode: 'create' | 'edit'
  stripeConnectOnboarded: boolean
  initialProduct?: ProductFormInitial
}

function centsToDollarsInput(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function ProductForm({
  mode,
  stripeConnectOnboarded,
  initialProduct,
}: ProductFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [name, setName] = useState(initialProduct?.name ?? '')
  const [description, setDescription] = useState(initialProduct?.description ?? '')
  const [priceDollars, setPriceDollars] = useState(
    initialProduct ? centsToDollarsInput(initialProduct.price) : ''
  )
  const [stock, setStock] = useState(
    initialProduct ? String(initialProduct.stock) : '1'
  )
  const [images, setImages] = useState<string[]>(initialProduct?.images ?? [])
  const [tags, setTags] = useState<string[]>(initialProduct?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [category, setCategory] = useState(initialProduct?.category ?? '')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const addTag = () => {
    const value = tagInput.trim().toLowerCase()
    if (!value || tags.includes(value)) {
      setTagInput('')
      return
    }
    setTags((prev) => [...prev, value])
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag))
  }

  const runImageAnalysis = async (imageUrl: string) => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeUploadedProductImage(imageUrl)
      if (result.error || !result.data) return

      setName(result.data.name)
      setDescription(result.data.description)
      setCategory(result.data.category)
      setTags(result.data.tags)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleImagesChange = (urls: string[]) => {
    const previousPrimary = images[0]
    setImages(urls)

    if (urls.length === 0) return

    const primaryChanged = urls[0] !== previousPrimary
    if (primaryChanged) {
      void runImageAnalysis(urls[0])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    const payload = {
      name,
      description,
      priceDollars,
      stock,
      images,
      tags,
      category,
    }

    startTransition(async () => {
      if (mode === 'create') {
        const result = await createProduct(payload)
        if (result.error) {
          setError(result.error)
          return
        }

        if (result.data?.published) {
          router.push('/dashboard/products')
          router.refresh()
          return
        }

        setNotice(
          'Product saved as draft. Connect Stripe from your dashboard to publish.'
        )
        router.push(`/dashboard/products/${result.data!.id}`)
        router.refresh()
        return
      }

      const result = await updateProduct(initialProduct!.id, payload)
      if (result.error) {
        setError(result.error)
        return
      }

      if (!result.data?.published) {
        setNotice('Product saved as draft. Connect Stripe from your dashboard to publish.')
      } else if (!initialProduct?.published) {
        setNotice('Product saved and published.')
      } else {
        setNotice('Product saved.')
      }

      router.refresh()
    })
  }

  const handleDelete = () => {
    if (mode !== 'edit' || !initialProduct) return

    const confirmed = window.confirm(
      `Delete "${initialProduct.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await deleteProduct(initialProduct.id)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push('/dashboard/products')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ImageUploader
        value={images}
        onChange={handleImagesChange}
        disabled={isPending}
      />
      {isAnalyzing && (
        <p className="text-stone-500 text-sm -mt-3">Analyzing photo…</p>
      )}

      <Field label="Name" value={name} onChange={setName} />
      <Field
        label="Description"
        value={description}
        onChange={setDescription}
        textarea
      />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Price (USD)"
          value={priceDollars}
          onChange={setPriceDollars}
          type="number"
          hint="Stored in cents on save"
        />
        <Field
          label="Stock"
          value={stock}
          onChange={setStock}
          type="number"
          hint="Non-negative integer"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-1">
          Category
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none focus:border-stone-800"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-sm px-3 py-1 rounded-full hover:bg-stone-200"
            >
              {tag}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Add a tag"
            className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none focus:border-stone-800"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 text-sm font-medium text-stone-700 border border-stone-200 rounded-xl hover:bg-stone-50"
          >
            Add
          </button>
        </div>
      </div>

      {!stripeConnectOnboarded && (
        <p className="text-amber-700 text-sm bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Connect Stripe to publish products. Products save as drafts until Stripe is connected.
        </p>
      )}

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {notice && (
        <p className="text-stone-600 text-sm bg-stone-100 border border-stone-200 rounded-xl px-4 py-3">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {isPending
          ? 'Saving…'
          : mode === 'create'
            ? 'Create product'
            : 'Save changes'}
      </button>

      {mode === 'edit' && (
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/dashboard/products"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← Back to products
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Delete product
          </button>
        </div>
      )}
    </form>
  )
}
