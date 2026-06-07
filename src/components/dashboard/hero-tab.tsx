'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

type HeroImage = {
  id: string
  imageUrl: string
  alt?: string | null
  order: number
}

export function HeroTab({ initialImages }: { initialImages: HeroImage[] }) {
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/dashboard/hero', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        setImages((prev) => [...prev, data])
      } catch (e) {
        console.error(e)
      }
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/dashboard/hero', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Delete failed')
      }
      setImages((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">These images rotate on your shop splash screen.</p>

      <div
        className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center cursor-pointer hover:border-stone-500 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files) handleUpload(e.dataTransfer.files)
        }}
      >
        <p className="text-2xl mb-2">🖼️</p>
        <p className="text-stone-600 text-sm font-medium">
          {uploading ? 'Uploading...' : 'Drop or tap to add hero images'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {images.map((img, idx) => (
          <div key={img.id} className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <Image
              src={img.imageUrl}
              alt={img.alt ?? `Hero ${idx + 1}`}
              fill
              className="object-cover"
            />
            <button
              onClick={() => handleDelete(img.id)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {images.length === 0 && !uploading && (
        <p className="text-center text-stone-400 text-sm py-4">No hero images yet.</p>
      )}
    </div>
  )
}
