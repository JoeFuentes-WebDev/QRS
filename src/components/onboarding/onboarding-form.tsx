'use client'

import { useActionState, useState } from 'react'
import {
  createSeller,
  checkSlugAvailability,
  type OnboardingFormState,
} from '@/app/onboarding/actions'
import { slugifyStoreName } from '@/lib/slug'

const inputClass =
  'w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-800 transition-colors'
const labelClass = 'block text-sm font-medium text-stone-700 mb-1'

type FulfillmentChoice = 'EMAIL' | 'TELEGRAM'

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
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentChoice>('EMAIL')

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
            placeholder="Laura's Pots"
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
            placeholder="lauras-pots"
          />
          <p className="text-stone-400 text-sm mt-1">
            qrs.app/{slug || 'your-slug'}
            {slugChecking && ' — checking…'}
          </p>
          {(slugError || fieldError('slug')) && (
            <p className="text-red-400 text-sm mt-1">{slugError ?? fieldError('slug')}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className={inputClass}
            placeholder="(555) 123-4567"
          />
          {fieldError('phone') && (
            <p className="text-red-400 text-sm mt-1">{fieldError('phone')}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-stone-900">Order notifications</h2>

        <div className="flex gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="fulfillmentType"
              value="EMAIL"
              checked={fulfillmentType === 'EMAIL'}
              onChange={() => setFulfillmentType('EMAIL')}
              className="sr-only"
            />
            <span
              className={`block text-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                fulfillmentType === 'EMAIL'
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-stone-400'
              }`}
            >
              Email
            </span>
          </label>
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="fulfillmentType"
              value="TELEGRAM"
              checked={fulfillmentType === 'TELEGRAM'}
              onChange={() => setFulfillmentType('TELEGRAM')}
              className="sr-only"
            />
            <span
              className={`block text-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                fulfillmentType === 'TELEGRAM'
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 text-stone-600 hover:border-stone-400'
              }`}
            >
              Telegram + Shippo
            </span>
          </label>
        </div>
        {fieldError('fulfillmentType') && (
          <p className="text-red-400 text-sm">{fieldError('fulfillmentType')}</p>
        )}

        {fulfillmentType === 'EMAIL' && (
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
            {fieldError('notificationEmail') && (
              <p className="text-red-400 text-sm mt-1">{fieldError('notificationEmail')}</p>
            )}
          </div>
        )}

        {fulfillmentType === 'TELEGRAM' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="telegramBotToken" className={labelClass}>
                Telegram bot token
              </label>
              <input
                id="telegramBotToken"
                name="telegramBotToken"
                type="password"
                className={inputClass}
                autoComplete="off"
              />
              {fieldError('telegramBotToken') && (
                <p className="text-red-400 text-sm mt-1">{fieldError('telegramBotToken')}</p>
              )}
            </div>

            <div>
              <label htmlFor="shippoApiKey" className={labelClass}>
                Shippo API key
              </label>
              <input
                id="shippoApiKey"
                name="shippoApiKey"
                type="password"
                className={inputClass}
                autoComplete="off"
              />
              {fieldError('shippoApiKey') && (
                <p className="text-red-400 text-sm mt-1">{fieldError('shippoApiKey')}</p>
              )}
            </div>

            <p className="text-sm font-medium text-stone-700">Origin address</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  name="shippoFromName"
                  placeholder="Name"
                  className={inputClass}
                />
                {fieldError('shippoFromName') && (
                  <p className="text-red-400 text-sm mt-1">{fieldError('shippoFromName')}</p>
                )}
              </div>
              <div className="col-span-2">
                <input
                  name="shippoFromStreet"
                  placeholder="Street"
                  className={inputClass}
                />
                {fieldError('shippoFromStreet') && (
                  <p className="text-red-400 text-sm mt-1">{fieldError('shippoFromStreet')}</p>
                )}
              </div>
              <div>
                <input name="shippoFromCity" placeholder="City" className={inputClass} />
                {fieldError('shippoFromCity') && (
                  <p className="text-red-400 text-sm mt-1">{fieldError('shippoFromCity')}</p>
                )}
              </div>
              <div>
                <input name="shippoFromState" placeholder="State" className={inputClass} />
                {fieldError('shippoFromState') && (
                  <p className="text-red-400 text-sm mt-1">{fieldError('shippoFromState')}</p>
                )}
              </div>
              <div>
                <input name="shippoFromZip" placeholder="ZIP" className={inputClass} />
                {fieldError('shippoFromZip') && (
                  <p className="text-red-400 text-sm mt-1">{fieldError('shippoFromZip')}</p>
                )}
              </div>
              <div>
                <input
                  name="shippoFromEmail"
                  type="email"
                  placeholder="Email"
                  className={inputClass}
                />
                {fieldError('shippoFromEmail') && (
                  <p className="text-red-400 text-sm mt-1">{fieldError('shippoFromEmail')}</p>
                )}
              </div>
              <div className="col-span-2">
                <input
                  name="shippoFromPhone"
                  type="tel"
                  placeholder="Phone"
                  className={inputClass}
                />
                {fieldError('shippoFromPhone') && (
                  <p className="text-red-400 text-sm mt-1">{fieldError('shippoFromPhone')}</p>
                )}
              </div>
            </div>
          </div>
        )}
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
