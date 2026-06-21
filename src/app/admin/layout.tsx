'use client'

import { useState, useEffect } from 'react'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'qrs-admin-2024'
const STORAGE_KEY = 'qrs-admin-auth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === ADMIN_PASSWORD) setAuthed(true)
    setChecking(false)
  }, [])

  const handleSubmit = () => {
    if (input === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, input)
      setAuthed(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (checking) return null

  if (!authed) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <p className="text-4xl mb-3">🏺</p>
            <h1 className="text-2xl font-black text-stone-900">Admin</h1>
            <p className="text-stone-400 text-sm mt-1">QRS</p>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Password"
              autoFocus
              className={`w-full border-2 rounded-xl px-4 py-3 text-stone-900 focus:outline-none transition-colors ${
                error ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-stone-800'
              }`}
            />
            {error && <p className="text-red-400 text-sm text-center">Incorrect password</p>}
            <button
              onClick={handleSubmit}
              className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors"
            >
              Enter
            </button>
          </div>
        </div>
      </main>
    )
  }

  return <>{children}</>
}