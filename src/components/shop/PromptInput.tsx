'use client'

import { useState } from 'react'

type Props = {
  onSearch: (query: string) => void
  loading?: boolean
}

const SUGGESTIONS = [
  'mugs',
  'bowls',
  'vases',
  'blue glaze',
  'terracotta',
  'gifts under $50',
]

export function PromptInput({ onSearch, loading }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder='Try "mugs" or "blue glazed bowls"...'
          className="flex-1 rounded-2xl border-2 border-stone-200 px-5 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-800 transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          className="rounded-2xl bg-stone-900 text-white px-6 py-3 font-semibold hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Go'}
        </button>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2 mt-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => { setValue(s); onSearch(s) }}
            className="text-sm bg-stone-100 text-stone-600 px-3 py-1 rounded-full hover:bg-stone-200 transition-colors capitalize"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
