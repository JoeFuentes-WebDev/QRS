'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'

export type PostcardImageOption = {
  url: string
  label: string
}

type PostcardDownloadProps = {
  slug: string
  imageOptions: PostcardImageOption[]
}

export function PostcardDownload({ slug, imageOptions }: PostcardDownloadProps) {
  const [selectedUrl, setSelectedUrl] = useState(imageOptions[0]?.url ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasImages = imageOptions.length > 0

  const selectedLabel = useMemo(
    () => imageOptions.find((option) => option.url === selectedUrl)?.label ?? '',
    [imageOptions, selectedUrl]
  )

  const handleDownload = async () => {
    if (!selectedUrl) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/postcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: selectedUrl }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Download failed')
        setLoading(false)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `postcard-${slug}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
      setLoading(false)
    } catch {
      setError('Download failed')
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
          Postcard
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          Download a 4×6 print-ready PDF with your shop QR code.
        </p>
      </div>

      {!hasImages ? (
        <p className="text-stone-400 text-sm">
          Add a published product with a photo to generate your postcard.
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="postcard-image" className="block text-sm font-medium text-stone-700 mb-2">
              Hero image
            </label>
            <select
              id="postcard-image"
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 bg-white"
            >
              {imageOptions.map((option) => (
                <option key={option.url} value={option.url}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {selectedUrl && (
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-100">
              <Image
                src={selectedUrl}
                alt={selectedLabel || 'Selected product image'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || !selectedUrl}
            className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating PDF…' : 'Download postcard'}
          </button>
        </>
      )}
    </section>
  )
}
