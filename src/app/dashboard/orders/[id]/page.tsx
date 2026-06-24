import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentSeller } from '@/lib/seller'
import { formatPrice } from '@/lib/pricing'
import { computeOrderTotalCents, getOrderById } from '@/services/order.service'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { OrderActions } from '@/components/dashboard/order-actions'
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge'

type Props = {
  params: Promise<{ id: string }>
}

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default async function DashboardOrderDetailPage({ params }: Props) {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  const { id } = await params
  const order = await getOrderById(id, seller.id)
  if (!order) notFound()

  const totalCents = computeOrderTotalCents(order.items)

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <DashboardHeader storeName={seller.storeName} />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Link
              href="/dashboard/orders"
              className="text-sm text-stone-500 hover:text-stone-800"
            >
              ← Orders
            </Link>
            <div className="flex items-center justify-between gap-4 mt-2">
              <h2 className="text-xl font-black text-stone-900">
                Order …{order.id.slice(-8)}
              </h2>
              <OrderStatusBadge status={order.status} />
            </div>
          </div>

          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Buyer</span>
                <span className="text-stone-900 font-medium text-right break-all">
                  {order.buyerEmail}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Placed</span>
                <span className="text-stone-900">{formatOrderDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-stone-500">Stripe session</span>
                <span className="text-stone-900 font-mono text-xs break-all text-right">
                  {order.stripeSessionId}
                </span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              Line items
            </h3>
            <ul className="space-y-3">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-4 text-sm border-b border-stone-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-stone-900">{item.product.name}</p>
                    <p className="text-stone-500">Qty {item.quantity}</p>
                  </div>
                  <p className="font-bold text-stone-900 shrink-0">
                    {formatPrice((item.priceSnapshot * item.quantity) / 100)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex justify-between pt-2 border-t border-stone-100 font-bold">
              <span>Total</span>
              <span>{formatPrice(totalCents / 100)}</span>
            </div>
          </section>

          <OrderActions orderId={order.id} status={order.status} />
        </div>
      </div>
    </main>
  )
}
