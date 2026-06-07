'use client'

import { useActionState } from 'react'
import { saveStripeSettings } from '@/app/dashboard/actions'

type SettingsFormProps = {
  hasStripePublishableKey: boolean
  hasStripeSecretKey: boolean
  hasStripeWebhookSecret: boolean
}

type FormState = { error?: string; success?: boolean }

async function saveStripeAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await saveStripeSettings({
      stripePublishableKey: formData.get('stripePublishableKey') as string,
      stripeSecretKey: formData.get('stripeSecretKey') as string,
      stripeWebhookSecret: formData.get('stripeWebhookSecret') as string,
    })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Save failed' }
  }
}

const inputClass =
  'w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-stone-900 text-sm focus:outline-none focus:border-stone-800 font-mono'

export function SettingsForm({
  hasStripePublishableKey,
  hasStripeSecretKey,
  hasStripeWebhookSecret,
}: SettingsFormProps) {
  const [state, formAction, pending] = useActionState(saveStripeAction, {})

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="stripePublishableKey" className="block text-sm font-medium text-stone-700 mb-1">
          Stripe publishable key
        </label>
        <input
          id="stripePublishableKey"
          name="stripePublishableKey"
          type="password"
          autoComplete="off"
          placeholder={hasStripePublishableKey ? '••••••••••••' : 'pk_live_...'}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="stripeSecretKey" className="block text-sm font-medium text-stone-700 mb-1">
          Stripe secret key
        </label>
        <input
          id="stripeSecretKey"
          name="stripeSecretKey"
          type="password"
          autoComplete="off"
          placeholder={hasStripeSecretKey ? '••••••••••••' : 'sk_live_...'}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="stripeWebhookSecret" className="block text-sm font-medium text-stone-700 mb-1">
          Stripe webhook secret
        </label>
        <input
          id="stripeWebhookSecret"
          name="stripeWebhookSecret"
          type="password"
          autoComplete="off"
          placeholder={hasStripeWebhookSecret ? '••••••••••••' : 'whsec_...'}
          className={inputClass}
        />
      </div>

      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state.success && (
        <p className="text-green-600 text-sm">Stripe settings saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save Stripe keys'}
      </button>
    </form>
  )
}
