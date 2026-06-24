'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

const MAX_PRODUCT_IMAGES = 5

type ImageUploaderProps = {
  value: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
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

async function uploadToCloudinary(file: File): Promise<string> {
  const signRes = await fetch('/api/cloudinary/sign')
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

export function ImageUploader({ value, onChange, disabled = false }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const atLimit = value.length >= MAX_PRODUCT_IMAGES

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return

    const remaining = MAX_PRODUCT_IMAGES - value.length
    if (remaining <= 0) {
      setError(`Maximum ${MAX_PRODUCT_IMAGES} images allowed.`)
      return
    }

    const selected = Array.from(files).slice(0, remaining)
    setUploading(true)
    setError(null)

    const uploaded: string[] = []

    try {
      for (const file of selected) {
        const url = await uploadToCloudinary(file)
        uploaded.push(url)
      }
      onChange([...value, ...uploaded])
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Image upload failed'
      )
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded])
      }
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const removeImage = (url: string) => {
    if (disabled) return
    onChange(value.filter((item) => item !== url))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
          Images ({value.length}/{MAX_PRODUCT_IMAGES})
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || atLimit}
          className="text-sm font-medium text-stone-700 hover:text-stone-900 disabled:opacity-50"
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

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full border-2 border-dashed border-stone-200 rounded-xl py-10 text-sm text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-colors disabled:opacity-50"
        >
          Upload product photos
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {value.map((url) => (
            <li key={url} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => removeImage(url)}
                disabled={disabled || uploading}
                className="absolute top-2 right-2 bg-stone-900/80 text-white text-xs font-medium px-2 py-1 rounded-md hover:bg-stone-900 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
