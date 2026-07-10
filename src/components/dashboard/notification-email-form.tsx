'use client'

// EMAIL NOTIFICATIONS DISABLED — re-enable when Resend custom domain is configured
/*
import { useActionState } from 'react'
import {
  updateNotificationEmail,
  type SettingsFormState,
} from '@/app/dashboard/settings/actions'
import { InfoTooltip } from '@/components/dashboard/info-tooltip'

const inputClass =
  'w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:border-stone-800 transition-colors'
const labelClass = 'block text-sm font-medium text-stone-700 mb-1'
*/

export function NotificationEmailForm({
  defaultEmail: _defaultEmail,
}: {
  defaultEmail: string
}) {
  return null
  /*
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(updateNotificationEmail, {})

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label
          htmlFor="notificationEmail"
          className={`${labelClass} inline-flex items-center`}
        >
          Notification email
          <InfoTooltip text="You'll receive order alerts at this address." />
        </label>
        <input
          id="notificationEmail"
          name="notificationEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          className={inputClass}
        />
        <p className="text-stone-400 text-xs mt-2">
          Email notifications coming soon. Add your mobile number above to receive SMS
          alerts.
        </p>
      </div>

      {state.error && (
        <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-green-700 text-sm bg-green-50 rounded-xl px-4 py-3">
          Notification email saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-stone-900 text-white font-medium px-4 py-2 rounded-xl text-sm hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save email'}
      </button>
    </form>
  )
  */
}
