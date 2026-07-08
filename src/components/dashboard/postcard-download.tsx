'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { savePostcardCta } from '@/app/dashboard/postcard/actions'
import {
  POSTCARD_DEFAULT_HERO,
  type PostcardOrientation,
} from '@/lib/postcard-shared'

export type PostcardImageOption = {
  url: string
  label: string
}

type PostcardDownloadProps = {
  slug: string
  imageOptions: PostcardImageOption[]
  initialPostcardCta: string | null
}

export function PostcardDownload({
  slug,
  imageOptions,
  initialPostcardCta,
}: PostcardDownloadProps) {
  const [selectedHero, setSelectedHero] = useState(POSTCARD_DEFAULT_HERO)
  const [postcardCta, setPostcardCta] = useState(initialPostcardCta ?? '')
  const [orientation, setOrientation] = useState<PostcardOrientation>('horizontal')
  const [loading, setLoading] = useState(false)
  const [savingCta, setSavingCta] = useState(false)
  const [ctaMessage, setCtaMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasImages = imageOptions.length > 0

  useEffect(() => {
    if (!hasImages) {
      setSelectedHero(POSTCARD_DEFAULT_HERO)
      return
    }

    setSelectedHero((current) => {
      if (current === POSTCARD_DEFAULT_HERO) {
        return current
      }
      const stillValid = imageOptions.some((option) => option.url === current)
      return stillValid ? current : POSTCARD_DEFAULT_HERO
    })
  }, [hasImages, imageOptions])

  const isDefaultSelected = selectedHero === POSTCARD_DEFAULT_HERO

  const selectedLabel = useMemo(() => {
    if (isDefaultSelected) {
      return 'Default (QRS branded)'
    }
    return imageOptions.find((option) => option.url === selectedHero)?.label ?? ''
  }, [imageOptions, isDefaultSelected, selectedHero])

  const handleSaveCta = async () => {
    setSavingCta(true)
    setCtaMessage(null)

    const result = await savePostcardCta(postcardCta)
    if (result.error) {
      setCtaMessage(result.error)
    } else {
      setCtaMessage('Saved')
    }

    setSavingCta(false)
  }

  const handleDownload = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/postcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroImageUrl: isDefaultSelected ? POSTCARD_DEFAULT_HERO : selectedHero,
          orientation,
        }),
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
          Download a print-ready PDF with your shop QR code.
        </p>
      </div>

      <div>
        <p className="block text-sm font-medium text-stone-700 mb-2">Orientation</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOrientation('horizontal')}
            className={
              'py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ' +
              (orientation === 'horizontal'
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 text-stone-600 hover:border-stone-400')
            }
          >
            Horizontal (6×4)
          </button>
          <button
            type="button"
            onClick={() => setOrientation('vertical')}
            className={
              'py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ' +
              (orientation === 'vertical'
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-200 text-stone-600 hover:border-stone-400')
            }
          >
            Vertical (4×6)
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="postcard-cta" className="block text-sm font-medium text-stone-700 mb-2">
          Marketing message
        </label>
        <div className="flex gap-2 items-start">
          <textarea
            id="postcard-cta"
            value={postcardCta}
            onChange={(e) => {
              setPostcardCta(e.target.value)
              setCtaMessage(null)
            }}
            placeholder="e.g. Handmade with love. Scan to shop."
            rows={2}
            className="flex-1 min-w-0 border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 bg-white resize-none"
          />
          <button
            type="button"
            onClick={handleSaveCta}
            disabled={savingCta}
            className="shrink-0 bg-stone-900 text-white font-bold px-4 py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {savingCta ? 'Saving…' : 'Save'}
          </button>
        </div>
        {ctaMessage && (
          <p
            className={`text-sm mt-2 ${
              ctaMessage === 'Saved' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {ctaMessage}
          </p>
        )}
      </div>

      {hasImages && (
        <div>
          <label htmlFor="postcard-image" className="block text-sm font-medium text-stone-700 mb-2">
            Background
          </label>
          <select
            id="postcard-image"
            value={selectedHero}
            onChange={(e) => setSelectedHero(e.target.value)}
            className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 bg-white"
          >
            <option value={POSTCARD_DEFAULT_HERO}>Default (QRS branded)</option>
            {imageOptions.map((option) => (
              <option key={option.url} value={option.url}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-100">
        {isDefaultSelected ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FF6B35]">
            <span className="text-white text-sm font-semibold tracking-wide">
              QRS branded background
            </span>
          </div>
        ) : (
          <Image
            src={selectedHero}
            alt={selectedLabel || 'Selected hero image'}
            fill
            className="object-cover"
            unoptimized
          />
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating PDF…' : 'Download postcard'}
      </button>
    </section>
  )
}
