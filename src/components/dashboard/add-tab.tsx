'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { formatPrice, suggestedPrice } from '@/lib/pricing'
import { approveProduct } from '@/app/dashboard/actions'
import type { ImageAnalysis } from '@/lib/ai-analysis'
import { Field } from '@/components/dashboard/field'

type DraftStatus =
  | 'pending'
  | 'analyzing'
  | 'ready'
  | 'saving'
  | 'saved'
  | 'skipped'
  | 'error'

type DraftItem = {
  id: string
  file: File
  preview: string
  status: DraftStatus
  analysis?: ImageAnalysis
  imageUrl?: string
  imagePublicId?: string
  price: number
  aiSuggestedPrice?: number
  name: string
  description: string
  category: string
  tags: string
  errorMessage?: string
}

const MAX_FILES = 20

function tagsToString(tags: string[]): string {
  return tags.join(', ')
}

function stringToTags(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

async function compressImage(file: File, maxPx = 1200, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        quality
      )
    }
    img.src = url
  })
}

export function AddTab() {
  const [queue, setQueue] = useState<DraftItem[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const updateItem = (id: string, patch: Partial<DraftItem>) =>
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  const reviewedCount = queue.filter(
    (q) => q.status === 'saved' || q.status === 'skipped'
  ).length

  const analyzeItem = useCallback(async (item: DraftItem) => {
    updateItem(item.id, { status: 'analyzing', errorMessage: undefined })
    const formData = new FormData()
    formData.append('file', item.file)
    try {
      const res = await fetch('/api/dashboard/upload', {
        method: 'POST',
        body: formData,
      })
      const data = (await res.json()) as {
        analysis: ImageAnalysis
        imageUrl: string
        imagePublicId: string
        error?: string
      }
      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed')
      }
      const aiPrice =
        data.analysis.suggestedPrice ?? suggestedPrice(data.analysis.pieceCount ?? 1)
      updateItem(item.id, {
        status: 'ready',
        analysis: data.analysis,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        name: data.analysis.name,
        description: data.analysis.description,
        category: data.analysis.category,
        tags: tagsToString(data.analysis.tags ?? []),
        price: aiPrice,
        aiSuggestedPrice: aiPrice,
        errorMessage: undefined,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      updateItem(item.id, {
        status: 'error',
        name: item.name || 'Product',
        category: item.category || 'other',
        price: item.price || 50,
        errorMessage: message,
      })
    }
  }, [])

  const handleFiles = async (files: FileList) => {
    const remaining = MAX_FILES - queue.length
    if (remaining <= 0) return

    const selected = Array.from(files).slice(0, remaining)
    const compressed = await Promise.all(selected.map((f) => compressImage(f)))

    const newItems: DraftItem[] = compressed.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      price: 50,
      name: '',
      description: '',
      category: '',
      tags: '',
    }))

    setQueue((prev) => [...prev, ...newItems])
    if (queue.length === 0) setCurrentIdx(0)
    newItems.forEach((item) => analyzeItem(item))
  }

  const advanceToNext = (fromIdx: number) => {
    const nextIdx = queue.findIndex(
      (q, i) =>
        i > fromIdx && q.status !== 'saved' && q.status !== 'skipped'
    )
    if (nextIdx !== -1) setCurrentIdx(nextIdx)
  }

  const handleApprove = async (item: DraftItem) => {
    if (!item.imageUrl || !item.imagePublicId) return
    updateItem(item.id, { status: 'saving' })
    try {
      await approveProduct({
        name: item.name,
        description: item.description,
        category: item.category,
        tags: stringToTags(item.tags),
        price: item.price,
        imageUrl: item.imageUrl,
        imagePublicId: item.imagePublicId,
        aiColor: item.analysis?.aiColor,
        aiTexture: item.analysis?.aiTexture,
        aiMaterial: item.analysis?.aiMaterial,
        aiSuggestedPrice: item.aiSuggestedPrice,
      })
      updateItem(item.id, { status: 'saved' })
      advanceToNext(currentIdx)
    } catch {
      updateItem(item.id, { status: 'error' })
    }
  }

  const handleSkip = (item: DraftItem) => {
    updateItem(item.id, { status: 'skipped' })
    advanceToNext(currentIdx)
  }

  const current = queue[currentIdx]
  const totalCount = queue.length

  if (queue.length === 0) {
    return (
      <div
        className="border-2 border-dashed border-stone-300 rounded-3xl p-12 text-center cursor-pointer hover:border-stone-500 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
        }}
      >
        <p className="text-4xl mb-3">📸</p>
        <p className="text-stone-600 font-medium">Drop photos or tap to select</p>
        <p className="text-stone-400 text-sm mt-1">
          Up to {MAX_FILES} photos — AI analyzes all in parallel
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>
          {reviewedCount} of {totalCount} reviewed
        </span>
        <button
          onClick={() => {
            setQueue([])
            setCurrentIdx(0)
          }}
          className="text-stone-400 underline text-xs"
        >
          Start over
        </button>
      </div>
      <div className="w-full bg-stone-200 rounded-full h-1.5">
        <div
          className="bg-stone-800 h-1.5 rounded-full transition-all"
          style={{ width: `${totalCount ? (reviewedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {queue.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setCurrentIdx(idx)}
            className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              idx === currentIdx ? 'border-stone-800' : 'border-transparent opacity-60'
            }`}
          >
            <Image src={item.preview} alt="" fill className="object-cover" />
            {item.status === 'saved' && (
              <div className="absolute inset-0 bg-green-500/60 flex items-center justify-center text-white text-lg">
                ✓
              </div>
            )}
            {item.status === 'skipped' && (
              <div className="absolute inset-0 bg-stone-500/60 flex items-center justify-center text-white text-xs">
                Skip
              </div>
            )}
            {item.status === 'analyzing' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
                AI
              </div>
            )}
          </button>
        ))}
        {queue.length < MAX_FILES && (
          <button
            onClick={() => fileRef.current?.click()}
            className="shrink-0 w-14 h-14 rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-2xl hover:border-stone-500"
          >
            +
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {current && (
        <div className="space-y-4">
          <div className="relative w-full h-56 rounded-2xl overflow-hidden">
            <Image src={current.preview} alt="" fill className="object-cover" />
            {current.status === 'analyzing' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className="text-white animate-pulse font-medium text-center px-4">
                  Uploading &amp; analyzing…
                  <span className="block text-sm font-normal mt-1 opacity-80">
                    Save button appears when ready
                  </span>
                </p>
              </div>
            )}
            {current.status === 'saved' && (
              <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                <p className="text-white font-black text-2xl">Saved ✓</p>
              </div>
            )}
            {current.status === 'skipped' && (
              <div className="absolute inset-0 bg-stone-500/40 flex items-center justify-center">
                <p className="text-white font-bold text-lg">Skipped</p>
              </div>
            )}
          </div>

          {(current.status === 'ready' ||
            current.status === 'error' ||
            current.status === 'saving') &&
            current.imageUrl && (
            <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
              <Field
                label="Name"
                value={current.name}
                onChange={(v) => updateItem(current.id, { name: v })}
              />
              <Field
                label="Category"
                value={current.category}
                onChange={(v) => updateItem(current.id, { category: v })}
              />
              <Field
                label="Description"
                value={current.description}
                onChange={(v) => updateItem(current.id, { description: v })}
                textarea
              />
              <Field
                label="Tags"
                value={current.tags}
                onChange={(v) => updateItem(current.id, { tags: v })}
                hint="Comma-separated"
              />
              <Field
                label="Price $"
                value={String(current.price)}
                onChange={(v) => updateItem(current.id, { price: Number(v) })}
                type="number"
                hint={
                  current.aiSuggestedPrice != null
                    ? `AI suggested: ${formatPrice(current.aiSuggestedPrice)}`
                    : undefined
                }
              />
            </div>
          )}

          <div className="flex gap-3">
            {currentIdx > 0 && (
              <button
                onClick={() => setCurrentIdx((i) => i - 1)}
                className="flex-1 rounded-xl border-2 border-stone-200 py-3 text-stone-600 font-medium hover:bg-stone-50"
              >
                ← Prev
              </button>
            )}
            {current.imageUrl &&
              (current.status === 'ready' ||
                current.status === 'error' ||
                current.status === 'saving') && (
              <>
                <button
                  onClick={() => handleSkip(current)}
                  disabled={current.status === 'saving'}
                  className="flex-1 rounded-xl border-2 border-stone-200 py-3 text-stone-600 font-medium hover:bg-stone-50 disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleApprove(current)}
                  disabled={current.status === 'saving' || !current.name.trim()}
                  className="flex-1 rounded-xl bg-stone-900 text-white py-3 font-bold hover:bg-stone-700 disabled:opacity-50"
                >
                  {current.status === 'saving' ? 'Saving…' : 'Save to Shop'}
                </button>
              </>
            )}
            {current.status === 'error' && !current.imageUrl && (
              <div className="flex-1 space-y-2">
                {current.errorMessage && (
                  <p className="text-red-500 text-sm text-center">{current.errorMessage}</p>
                )}
                <button
                  onClick={() => analyzeItem(current)}
                  className="w-full rounded-xl bg-stone-900 text-white py-3 font-bold hover:bg-stone-700"
                >
                  Retry upload
                </button>
              </div>
            )}
            {(current.status === 'saved' || current.status === 'skipped') &&
              currentIdx < queue.length - 1 && (
                <button
                  onClick={() => setCurrentIdx((i) => i + 1)}
                  className="flex-1 rounded-xl bg-stone-900 text-white py-3 font-bold hover:bg-stone-700"
                >
                  Next →
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  )
}
