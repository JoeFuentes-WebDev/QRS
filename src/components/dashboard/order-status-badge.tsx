import type { OrderStatus } from '@prisma/client'

const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  DECLINED: 'bg-red-100 text-red-800',
  FULFILLED: 'bg-green-100 text-green-800',
  REFUNDED: 'bg-stone-100 text-stone-600',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${statusStyles[status]}`}
    >
      {status}
    </span>
  )
}
