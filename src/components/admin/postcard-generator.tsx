'use client'

import { useState } from 'react'

export function PostcardGenerator() {
  const [utmSource, setUtmSource] = useState('organic')
  const [utmMedium, setUtmMedium] = useState('sa-postcard')

  const handleDownload = () => {
    const source = utmSource.trim() || 'organic'
    window.location.assign(
      `/api/postcard/seller-acquisition?utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(utmMedium)}`
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="utm-source"
          className="block text-sm font-medium text-stone-700 mb-2"
        >
          Campaign name (utm_source)
        </label>
        <input
          id="utm-source"
          type="text"
          value={utmSource}
          onChange={(e) => setUtmSource(e.target.value)}
          placeholder="e.g. japantown-jan2027"
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-stone-900 bg-white"
        />
      </div>

      <div>
        <label
          htmlFor="utm-medium"
          className="block text-sm font-medium text-stone-700 mb-2"
        >
          Channel (utm_medium)
        </label>
        <select
          id="utm-medium"
          value={utmMedium}
          onChange={(e) => setUtmMedium(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-stone-900 bg-white"
        >
          <option value="sa-postcard">Seller Acquisition Postcard</option>
        </select>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center justify-center bg-stone-900 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-stone-700 transition-colors"
      >
        Download postcard
      </button>

      <p className="text-stone-400 text-xs">
        Leave campaign name blank to use &apos;organic&apos; as default.
      </p>
    </div>
  )
}
