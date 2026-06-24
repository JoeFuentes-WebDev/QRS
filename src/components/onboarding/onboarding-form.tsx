'use client'

import { useActionState, useState } from 'react'
import {
  createSeller,
  checkSlugAvailability,
  type OnboardingFormState,
} from '@/app/onboarding/actions'
import { slugifyStoreName } from '@/lib/slug'
import { getShopUrlDisplay } from '@/lib/qr'

const inputClass =
  'w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-800 transition-colors'
const labelClass = 'block text-sm font-medium text-stone-700 mb-1'

export function OnboardingForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState<OnboardingFormState, FormData>(
    createSeller,
    {}
  )
  const [storeName, setStoreName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)

  const handleStoreNameChange = (value: string) => {
    setStoreName(value)
    if (!slugTouched) {
      setSlug(slugifyStoreName(value))
    }
  }

  const handleSlugBlur = async () => {
    if (!slug) return
    setSlugChecking(true)
    const result = await checkSlugAvailability(slug)
    setSlugError(result.available ? null : (result.error ?? 'This slug is already taken.'))
    setSlugChecking(false)
  }

  const fieldError = (name: string) => state.fieldErrors?.[name]

  const shopUrlPreview = getShopUrlDisplay(slug)

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-stone-900">Your shop</h2>

        <div>
          <label htmlFor="storeName" className={labelClass}>
            Store name
          </label>
          <input
            id="storeName"
            name="storeName"
            type="text"
            required
            value={storeName}
            onChange={(e) => handleStoreNameChange(e.target.value)}
            className={inputClass}
            placeholder="My Shop"
          />
          {fieldError('storeName') && (
            <p className="text-red-400 text-sm mt-1">{fieldError('storeName')}</p>
          )}
        </div>

        <div>
          <label htmlFor="slug" className={labelClass}>
            Shop URL slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value.toLowerCase())
              setSlugError(null)
            }}
            onBlur={handleSlugBlur}
            className={inputClass}
            placeholder="my-shop"
          />
          <p className="text-stone-400 text-sm mt-1">
            {shopUrlPreview.type === 'warning' ? (
              <span className="text-amber-700">{shopUrlPreview.text}</span>
            ) : (
              shopUrlPreview.text
            )}
            {slugChecking && ' — checking…'}
          </p>
          {(slugError || fieldError('slug')) && (
            <p className="text-red-400 text-sm mt-1">{slugError ?? fieldError('slug')}</p>
          )}
        </div>

        <div>
          <label htmlFor="notificationEmail" className={labelClass}>
            Notification email
          </label>
          <input
            id="notificationEmail"
            name="notificationEmail"
            type="email"
            required
            defaultValue={defaultEmail}
            className={inputClass}
          />
          <p className="text-stone-400 text-sm mt-1">
            Order notifications will be sent here.
          </p>
          {fieldError('notificationEmail') && (
            <p className="text-red-400 text-sm mt-1">{fieldError('notificationEmail')}</p>
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={pending || !!slugError}
        className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {pending ? 'Creating your shop…' : 'Create shop'}
      </button>
    </form>
  )
}
