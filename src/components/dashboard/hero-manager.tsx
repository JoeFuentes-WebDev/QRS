'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import {
  addHeroImage,
  moveHeroImage,
  removeHeroImage,
} from '@/app/dashboard/hero/actions'
import { InfoTooltip } from '@/components/dashboard/info-tooltip'

export type HeroImageItem = {
  id: string
  url: string
  order: number
}

type SignResponse = {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
  error?: string
}

type CloudinaryUploadResponse = {
  secure_url?: string
  error?: { message?: string }
}

async function uploadHeroToCloudinary(file: File): Promise<string> {
  const signRes = await fetch('/api/cloudinary/sign?purpose=hero')
  const signData = (await signRes.json()) as SignResponse

  if (!signRes.ok) {
    throw new Error(signData.error ?? 'Failed to get upload signature')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signData.apiKey)
  formData.append('timestamp', String(signData.timestamp))
  formData.append('signature', signData.signature)
  formData.append('folder', signData.folder)

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  )

  const uploadData = (await uploadRes.json()) as CloudinaryUploadResponse
  if (!uploadRes.ok || !uploadData.secure_url) {
    throw new Error(uploadData.error?.message ?? 'Upload failed')
  }

  return uploadData.secure_url
}

export function HeroManager({ initialImages }: { initialImages: HeroImageItem[] }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const busy = uploading || isPending

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || busy) return

    setUploading(true)
    setError(null)

    try {
      const added: HeroImageItem[] = []

      for (const file of Array.from(files)) {
        const url = await uploadHeroToCloudinary(file)
        const result = await addHeroImage(url)
        if (result.error) {
          throw new Error(result.error)
        }
        if (result.data) {
          added.push(result.data)
        }
      }

      if (added.length > 0) {
        setImages((prev) => [...prev, ...added])
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Upload failed'
      )
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = (id: string) => {
    setError(null)
    startTransition(async () => {
      const result = await removeHeroImage(id)
      if (result.error) {
        setError(result.error)
        return
      }
      setImages((prev) => prev.filter((image) => image.id !== id))
    })
  }

  const handleMove = (id: string, direction: 'up' | 'down') => {
    setError(null)
    startTransition(async () => {
      const result = await moveHeroImage(id, direction)
      if (result.error) {
        setError(result.error)
        return
      }

      setImages((prev) => {
        const index = prev.findIndex((image) => image.id === id)
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (index === -1 || targetIndex < 0 || targetIndex >= prev.length) {
          return prev
        }
        const next = [...prev]
        ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
        return next.map((image, order) => ({ ...image, order }))
      })
    })
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide inline-flex items-center">
            Shop hero images
            <InfoTooltip text="These images rotate as the background of your storefront. Add at least one to make your shop visually compelling." />
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            These rotate as the background on your storefront landing screen.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="shrink-0 text-sm font-medium text-stone-700 hover:text-stone-900 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Add images'}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full border-2 border-dashed border-stone-200 rounded-xl py-8 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors disabled:opacity-50"
        >
          Upload hero photos for your shop background
        </button>
      ) : (
        <ul className="space-y-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="flex items-center gap-3 rounded-xl border border-stone-200 p-2"
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <p className="flex-1 text-xs text-stone-500 truncate">
                Image {index + 1}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(image.id, 'up')}
                  disabled={busy || index === 0}
                  className="px-2 py-1 text-xs font-medium text-stone-600 border border-stone-200 rounded-md hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(image.id, 'down')}
                  disabled={busy || index === images.length - 1}
                  className="px-2 py-1 text-xs font-medium text-stone-600 border border-stone-200 rounded-md hover:bg-stone-50 disabled:opacity-40"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(image.id)}
                  disabled={busy}
                  className="px-2 py-1 text-xs font-medium text-red-600 border border-red-100 rounded-md hover:bg-red-50 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </section>
  )
}
