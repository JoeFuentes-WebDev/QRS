'use client'

import { useState } from 'react'
import { InfoTooltip } from '@/components/dashboard/info-tooltip'

type StripeConnectCardProps = {
  stripeConnectOnboarded: boolean
  stripeConnectAccountId: string | null
}

type SyncResponse = {
  stripeConnectOnboarded: boolean
  stripeConnectAccountId: string | null
  chargesEnabled: boolean
  error?: string
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

export function StripeConnectCard({
  stripeConnectOnboarded: initialOnboarded,
  stripeConnectAccountId: initialAccountId,
}: StripeConnectCardProps) {
  const [onboarded, setOnboarded] = useState(initialOnboarded)
  const [accountId, setAccountId] = useState(initialAccountId)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setLoading(true)
    setError(null)

    const stripeWindow = window.open('about:blank', '_blank')
    if (!stripeWindow) {
      setError('Could not open Stripe. Allow popups for this site and try again.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        stripeWindow.close()
        setError(data.error ?? 'Failed to start Stripe onboarding')
        setLoading(false)
        return
      }

      stripeWindow.location.href = data.url

      const syncRes = await fetch('/api/stripe/connect/sync', { method: 'POST' })
      if (syncRes.ok) {
        const syncData = (await syncRes.json()) as SyncResponse
        setOnboarded(syncData.stripeConnectOnboarded)
        setAccountId(syncData.stripeConnectAccountId)
      }

      setLoading(false)
    } catch {
      stripeWindow.close()
      setError('Failed to start Stripe onboarding')
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)

    try {
      const res = await fetch('/api/stripe/connect/sync', { method: 'POST' })
      const data = (await res.json()) as SyncResponse

      if (!res.ok) {
        setError(data.error ?? 'Failed to refresh Stripe status')
        setSyncing(false)
        return
      }

      setOnboarded(data.stripeConnectOnboarded)
      setAccountId(data.stripeConnectAccountId)
      setSyncing(false)
    } catch {
      setError('Failed to refresh Stripe status')
      setSyncing(false)
    }
  }

  const connected = onboarded
  const started = !!accountId

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide inline-flex items-center">
          Stripe payments
          <InfoTooltip text="Connect your Stripe account to accept payments. Required before you can publish products." />
        </h2>
        <p className="text-stone-500 text-sm mt-1">
          Connect Stripe to accept payments on your shop.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            connected ? 'bg-green-500' : started ? 'bg-amber-400' : 'bg-stone-300'
          }`}
        />
        <p className="text-stone-800 text-sm font-medium flex-1">
          {connected
            ? 'Connected — ready to accept payments'
            : started
              ? 'Onboarding incomplete'
              : 'Not connected'}
        </p>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing || loading}
          aria-label="Refresh Stripe status"
          title="Refresh Stripe status"
          className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors disabled:opacity-50"
        >
          <RefreshIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!connected && (
        <>
          <p className="text-stone-500 text-sm">
            Connect your bank account to receive payments. Takes about 5 minutes.
            Stripe handles everything securely — we never see your banking details.
          </p>
          <button
          type="button"
          onClick={handleConnect}
          disabled={loading || syncing}
          className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {loading
            ? 'Opening Stripe…'
            : started
              ? 'Onboarding incomplete — continue'
              : 'Connect Stripe'}
          </button>
        </>
      )}

      {!connected && !loading && (
        <p className="text-stone-400 text-xs text-center">
          Stripe opens in a new tab. When you&apos;re done, use the refresh icon to
          update status.
        </p>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </section>
  )
}
