'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { ImageAnalysis } from '@/lib/ai-analysis'
import type { Product } from '@/types'
import { formatPrice, suggestedPrice } from '@/lib/pricing'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? 'lauras-pots-admin'

type Tab = 'add' | 'edit' | 'hero'

// ─── Types ───────────────────────────────────────────────────────────────────

type DraftItem = {
  id: string
  file: File
  preview: string
  status: 'pending' | 'analyzing' | 'ready' | 'saving' | 'saved' | 'error'
  analysis?: ImageAnalysis
  imageUrl?: string
  imagePublicId?: string
  price: number
  aiSuggestedPrice?: number
  name: string
  description: string
  category: string
}

type HeroImage = {
  id: string
  imageUrl: string
  alt?: string
  order: number
}

// ─── Field component ─────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', textarea = false }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; textarea?: boolean
}) {
  const base = 'w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none focus:border-stone-800'
  return (
    <div>
      <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} className={base} rows={2} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} className={base} />}
    </div>
  )
}

// ─── Add Tab ─────────────────────────────────────────────────────────────────

function AddTab() {
  const [queue, setQueue] = useState<DraftItem[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const updateItem = (id: string, patch: Partial<DraftItem>) =>
    setQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item))

  const analyzeItem = useCallback(async (item: DraftItem) => {
    updateItem(item.id, { status: 'analyzing' })
    const formData = new FormData()
    formData.append('file', item.file)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'x-admin-secret': ADMIN_SECRET },
        body: formData,
      })
      const data = await res.json()
      const suggested = data.analysis.suggestedPrice ?? suggestedPrice(data.analysis.pieceCount ?? 1)
      updateItem(item.id, {
        status: 'ready',
        analysis: data.analysis,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
        name: data.analysis.name,
        description: data.analysis.description,
        category: data.analysis.category,
        price: suggested,
        aiSuggestedPrice: suggested,
      })
    } catch {
      updateItem(item.id, { status: 'error' })
    }
  }, [])

  const handleFiles = async (files: FileList) => {
    const newItems: DraftItem[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      price: 50,
      name: '', description: '', category: '',
    }))
    setQueue(prev => [...prev, ...newItems])
    setCurrentIdx(0)
    // Analyze all in parallel
    newItems.forEach(item => analyzeItem(item))
  }

  const handleSave = async (item: DraftItem) => {
    updateItem(item.id, { status: 'saving' })
    try {
      await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          category: item.category,
          imageUrl: item.imageUrl,
          imagePublicId: item.imagePublicId,
          quantity: item.analysis?.pieceCount ?? 1,
          price: item.price,
          tags: item.analysis?.tags ?? [],
          aiColor: item.analysis?.aiColor,
          aiTexture: item.analysis?.aiTexture,
          aiMaterial: item.analysis?.aiMaterial,
          aiSuggestedPrice: item.aiSuggestedPrice,
        }),
      })
      updateItem(item.id, { status: 'saved' })
      // Auto-advance to next unsaved
      const nextIdx = queue.findIndex((q, i) => i > currentIdx && q.status !== 'saved')
      if (nextIdx !== -1) setCurrentIdx(nextIdx)
    } catch {
      updateItem(item.id, { status: 'error' })
    }
  }

  const current = queue[currentIdx]
  const savedCount = queue.filter(q => q.status === 'saved').length
  const totalCount = queue.length

  if (queue.length === 0) {
    return (
      <div
        className="border-2 border-dashed border-stone-300 rounded-3xl p-12 text-center cursor-pointer hover:border-stone-500 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <p className="text-4xl mb-3">📸</p>
        <p className="text-stone-600 font-medium">Drop photos or tap to select</p>
        <p className="text-stone-400 text-sm mt-1">Select multiple — AI analyzes all at once</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm text-stone-500">
        <span>{savedCount} of {totalCount} saved</span>
        <button onClick={() => { setQueue([]); setCurrentIdx(0) }} className="text-stone-400 underline text-xs">
          Start over
        </button>
      </div>
      <div className="w-full bg-stone-200 rounded-full h-1.5">
        <div className="bg-stone-800 h-1.5 rounded-full transition-all" style={{ width: `${(savedCount / totalCount) * 100}%` }} />
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {queue.map((item, idx) => (
          <button key={item.id} onClick={() => setCurrentIdx(idx)}
            className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              idx === currentIdx ? 'border-stone-800' : 'border-transparent opacity-60'
            }`}
          >
            <Image src={item.preview} alt="" fill className="object-cover" />
            {item.status === 'saved' && (
              <div className="absolute inset-0 bg-green-500/60 flex items-center justify-center text-white text-lg">✓</div>
            )}
            {item.status === 'analyzing' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">AI</div>
            )}
          </button>
        ))}
        <button
          onClick={() => fileRef.current?.click()}
          className="shrink-0 w-14 h-14 rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-2xl hover:border-stone-500"
        >+</button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* Current item editor */}
      {current && (
        <div className="space-y-4">
          <div className="relative w-full h-56 rounded-2xl overflow-hidden">
            <Image src={current.preview} alt="" fill className="object-cover" />
            {current.status === 'analyzing' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className="text-white animate-pulse font-medium">Analyzing with AI...</p>
              </div>
            )}
            {current.status === 'saved' && (
              <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
                <p className="text-white font-black text-2xl">Saved ✓</p>
              </div>
            )}
          </div>

          {(current.status === 'ready' || current.status === 'error') && (
            <div className="bg-white rounded-2xl p-4 space-y-3 shadow-sm">
              <Field label="Name" value={current.name} onChange={v => updateItem(current.id, { name: v })} />
              <Field label="Category" value={current.category} onChange={v => updateItem(current.id, { category: v })} />
              <Field label="Description" value={current.description} onChange={v => updateItem(current.id, { description: v })} textarea />
              <div>
                <Field label="Price $" value={String(current.price)} onChange={v => updateItem(current.id, { price: Number(v) })} type="number" />
                {current.aiSuggestedPrice != null && (
                  <p className="text-xs text-stone-400 mt-1">AI suggested: {formatPrice(current.aiSuggestedPrice)}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {currentIdx > 0 && (
              <button onClick={() => setCurrentIdx(i => i - 1)}
                className="flex-1 rounded-xl border-2 border-stone-200 py-3 text-stone-600 font-medium hover:bg-stone-50">
                ← Prev
              </button>
            )}
            {current.status === 'ready' && (
              <button onClick={() => handleSave(current)}
                className="flex-1 rounded-xl bg-stone-900 text-white py-3 font-bold hover:bg-stone-700">
                Save to Shop
              </button>
            )}
            {current.status === 'saved' && currentIdx < queue.length - 1 && (
              <button onClick={() => setCurrentIdx(i => i + 1)}
                className="flex-1 rounded-xl bg-stone-900 text-white py-3 font-bold hover:bg-stone-700">
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Edit Tab ─────────────────────────────────────────────────────────────────

function EditTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [edits, setEdits] = useState<Partial<Product>>({})

  const search = async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&all=true`)
      setProducts(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  fetch('/api/products?q=&all=true')
    .then(r => r.json())
    .then(data => { if (Array.isArray(data)) setProducts(data) })
  }, [])

  const startEdit = (p: Product) => { setEditing(p.id); setEdits({ name: p.name, price: p.price }) }

  const saveEdit = async (id: string) => {
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify(edits),
    })
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...edits } as Product : p))
    setEditing(null)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Remove from shop?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'x-admin-secret': ADMIN_SECRET } })
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search(query)}
          placeholder="Search products..."
          className="flex-1 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-stone-800"
        />
        <button onClick={() => search(query)} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-medium">
          {loading ? '...' : 'Search'}
        </button>
      </div>

      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image src={p.imageUrl ?? ''} alt={p.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                {editing === p.id ? (
                  <div className="space-y-2">
                    <input
                      value={edits.name ?? p.name}
                      onChange={e => setEdits(ed => ({ ...ed, name: e.target.value }))}
                      className="w-full border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-stone-800"
                    />
                    <input type="number"
                      value={String(edits.price ?? p.price ?? '')}
                      onChange={e => setEdits(ed => ({ ...ed, price: Number(e.target.value) }))}
                      placeholder="Price $"
                      className="border border-stone-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-stone-800 w-full"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(p.id)} className="flex-1 bg-stone-900 text-white rounded-lg py-1.5 text-sm font-medium">Save</button>
                      <button onClick={() => setEditing(null)} className="flex-1 border border-stone-200 rounded-lg py-1.5 text-sm text-stone-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-stone-900 truncate">{p.name}</p>
                    <p className="text-sm text-stone-400 capitalize">{p.category}</p>
                    <p className="text-sm text-stone-600 font-medium">{formatPrice(p.price)}</p>
                  </>
                )}
              </div>
              {editing !== p.id && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} className="text-xs text-stone-500 border border-stone-200 rounded-lg px-2 py-1 hover:bg-stone-50">Edit</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-400 border border-red-100 rounded-lg px-2 py-1 hover:bg-red-50">Remove</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {products.length === 0 && !loading && (
          <p className="text-center text-stone-400 py-8">No products found.</p>
        )}
      </div>
    </div>
  )
}

// ─── Hero Tab ─────────────────────────────────────────────────────────────────

function HeroTab() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/hero').then(r => r.json()).then(setImages)
  }, [])

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/hero', {
          method: 'POST',
          headers: { 'x-admin-secret': ADMIN_SECRET },
          body: formData,
        })
        const image = await res.json()
        setImages(prev => [...prev, image])
      } catch (e) {
        console.error(e)
      }
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    await fetch('/api/hero', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
      body: JSON.stringify({ id }),
    })
    setImages(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">These images rotate on the splash screen.</p>

      <div
        className="border-2 border-dashed border-stone-300 rounded-2xl p-8 text-center cursor-pointer hover:border-stone-500 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
      >
        <p className="text-2xl mb-2">🖼️</p>
        <p className="text-stone-600 text-sm font-medium">{uploading ? 'Uploading...' : 'Drop or tap to add hero images'}</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files && handleUpload(e.target.files)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {images.map((img, idx) => (
          <div key={img.id} className="relative rounded-2xl overflow-hidden aspect-[4/3]">
            <Image src={img.imageUrl} alt={img.alt ?? `Hero ${idx + 1}`} fill className="object-cover" />
            <button
              onClick={() => handleDelete(img.id)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500 transition-colors"
            >✕</button>
          </div>
        ))}
      </div>

      {images.length === 0 && !uploading && (
        <p className="text-center text-stone-400 text-sm py-4">No hero images yet.</p>
      )}
    </div>
  )
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('add')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'add', label: 'Add' },
    { id: 'edit', label: 'Edit' },
    { id: 'hero', label: 'Hero' },
  ]

  return (
    <main className="min-h-screen bg-stone-50 p-5">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-black text-stone-900 mb-5">Admin</h1>

        {/* Tab bar */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'add' && <AddTab />}
        {tab === 'edit' && <EditTab />}
        {tab === 'hero' && <HeroTab />}
      </div>
    </main>
  )
}