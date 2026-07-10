'use client'

import { useActionState } from 'react'
import {
  updateSellerPhone,
  type SettingsFormState,
} from '@/app/dashboard/settings/actions'
import { InfoTooltip } from '@/components/dashboard/info-tooltip'

const inputClass =
  'w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-800 transition-colors'
const labelClass = 'block text-sm font-medium text-stone-700 mb-1'

export function NotificationPhoneForm({
  defaultPhone,
}: {
  defaultPhone: string
}) {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateSellerPhone, {})

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="sellerPhone" className={`${labelClass} inline-flex items-center`}>
          Mobile number for order alerts
          <InfoTooltip text="Add your mobile number to receive SMS notifications when an order arrives." />
        </label>
        <input
          id="sellerPhone"
          name="sellerPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(555) 555-5555"
          defaultValue={defaultPhone}
          className={inputClass}
        />
        <p className="text-stone-400 text-xs mt-2">
          US mobile number. Leave blank to disable SMS alerts.
        </p>
      </div>

      {state.error && (
        <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-green-700 text-sm bg-green-50 rounded-xl px-4 py-3">
          Mobile number saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-stone-900 text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save number'}
      </button>
    </form>
  )
}
