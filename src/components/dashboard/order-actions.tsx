'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { OrderStatus } from '@prisma/client'

type OrderActionsProps = {
  orderId: string
  status: OrderStatus
}

export function OrderActions({ orderId, status }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | 'fulfill' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runAction = async (action: 'accept' | 'decline' | 'fulfill') => {
    setLoading(action)
    setError(null)

    try {
      const res = await fetch(`/api/orders/${orderId}/${action}`, { method: 'POST' })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Action failed')
        setLoading(null)
        return
      }

      router.refresh()
      setLoading(null)
    } catch {
      setError('Action failed')
      setLoading(null)
    }
  }

  if (status === 'PENDING') {
    return (
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => runAction('accept')}
            disabled={loading !== null}
            className="flex-1 bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading === 'accept' ? 'Accepting…' : 'Accept'}
          </button>
          <button
            type="button"
            onClick={() => runAction('decline')}
            disabled={loading !== null}
            className="flex-1 bg-white border-2 border-stone-200 text-stone-900 font-bold py-3 rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            {loading === 'decline' ? 'Declining…' : 'Decline'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    )
  }

  if (status === 'ACCEPTED') {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => runAction('fulfill')}
          disabled={loading !== null}
          className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-50"
        >
          {loading === 'fulfill' ? 'Updating…' : 'Mark fulfilled'}
        </button>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    )
  }

  return null
}
