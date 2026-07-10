'use client'

import { useState } from 'react'

export default function SellerAcquisitionPostcardPage() {
  const [utmSource, setUtmSource] = useState('')

  const handleDownload = () => {
    const value = utmSource.trim() || 'organic'
    window.location.assign(
      `/api/postcard/seller-acquisition?utm_source=${encodeURIComponent(value)}`
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 p-5">
      <div className="max-w-lg mx-auto">
        <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">
              Seller acquisition postcard
            </h1>
            <p className="text-stone-500 text-sm mt-2">
              Static 4×6 marketing PDF for recruiting vendors at markets and fairs.
            </p>
          </div>

          <div>
            <label
              htmlFor="utm-source"
              className="block text-sm font-medium text-stone-700 mb-2"
            >
              UTM source
            </label>
            <input
              id="utm-source"
              type="text"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              placeholder="organic"
              className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 bg-white"
            />
            <p className="text-stone-400 text-xs mt-2">
              Used in the postcard QR code. Defaults to organic if left empty.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors"
          >
            Download seller postcard
          </button>
        </section>
      </div>
    </main>
  )
}
