import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentSeller } from '@/lib/seller'
import { formatPrice } from '@/lib/pricing'
import { computeOrderTotalCents, getOrdersForSeller } from '@/services/order.service'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { OrderStatusBadge } from '@/components/dashboard/order-status-badge'

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default async function DashboardOrdersPage() {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  const orders = await getOrdersForSeller(seller.id)

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <DashboardHeader storeName={seller.storeName} />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-stone-500 hover:text-stone-800"
              >
                ← Dashboard
              </Link>
              <h2 className="text-xl font-black text-stone-900 mt-2">Orders</h2>
            </div>
          </div>

          {orders.length === 0 ? (
            <section className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <p className="text-stone-500">No orders yet.</p>
              <p className="text-stone-400 text-sm mt-2">
                New orders will appear here after customers checkout.
              </p>
            </section>
          ) : (
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-stone-100">
                {orders.map((order) => {
                  const totalCents = computeOrderTotalCents(order.items)
                  return (
                    <li key={order.id}>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="block px-5 py-4 hover:bg-stone-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900">
                              …{order.id.slice(-8)}
                            </p>
                            <p className="text-sm text-stone-500 truncate mt-0.5">
                              {order.buyerEmail}
                            </p>
                            <p className="text-xs text-stone-400 mt-1">
                              {formatOrderDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="text-right shrink-0 space-y-2">
                            <OrderStatusBadge status={order.status} />
                            <p className="text-sm font-bold text-stone-900">
                              {formatPrice(totalCents / 100)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
