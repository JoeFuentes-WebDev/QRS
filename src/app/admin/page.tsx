import Link from 'next/link'
import { AdminLogoutButton } from '@/components/admin/admin-logout-button'
import { PostcardGenerator } from '@/components/admin/postcard-generator'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function thirtyDaysAgo(): Date {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return date
}

function formatSignedUpDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function formatActivityTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatCentsAsDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function truncateUserId(userId: string | null): string {
  if (!userId) return '—'
  return userId.length > 12 ? `${userId.slice(0, 12)}…` : userId
}

function formatProperties(properties: unknown): string {
  const text = JSON.stringify(properties ?? {})
  if (text.length <= 80) return text
  return `${text.slice(0, 80)}...`
}

function getErrorMessage(properties: unknown): string {
  if (!properties || typeof properties !== 'object') return '—'
  const error = (properties as { error?: unknown }).error
  if (typeof error === 'string' && error.trim().length > 0) return error
  return '—'
}

type StatCardProps = {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="border border-stone-200 rounded-lg bg-white px-4 py-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="text-3xl font-black text-stone-900 mt-2">{value}</p>
    </div>
  )
}

export default async function AdminPage() {
  const since = thirtyDaysAgo()

  const [
    totalSellers,
    activeSellers,
    newSellers30d,
    totalOrders,
    orders30d,
    ordersWithItems,
    sellers,
    recentActivity,
    recentErrors,
  ] = await Promise.all([
    prisma.seller.count(),
    prisma.seller.count({ where: { stripeConnectOnboarded: true } }),
    prisma.seller.count({ where: { createdAt: { gte: since } } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.order.findMany({ include: { items: true } }),
    prisma.seller.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
    }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.analyticsEvent.findMany({
      where: {
        event: { in: ['stripe.connect_failed', 'checkout.failed'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const totalRevenueCents = ordersWithItems.reduce((sum, order) => {
    const orderTotal = order.items.reduce(
      (itemSum, item) => itemSum + item.priceSnapshot * item.quantity,
      0
    )
    return sum + Math.floor(orderTotal * 0.02)
  }, 0)

  return (
    <main className="min-h-screen bg-stone-50 p-5">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-stone-900">Platform Admin</h1>
          <AdminLogoutButton />
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Platform Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Total Sellers" value={String(totalSellers)} />
            <StatCard label="Active Sellers" value={String(activeSellers)} />
            <StatCard label="New Sellers (30 days)" value={String(newSellers30d)} />
            <StatCard label="Total Orders" value={String(totalOrders)} />
            <StatCard
              label="Total Revenue"
              value={formatCentsAsDollars(totalRevenueCents)}
            />
            <StatCard label="Orders (30 days)" value={String(orders30d)} />
          </div>
        </section>

        <hr className="border-stone-200" />

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Seller List</h2>
          <div className="overflow-x-auto border border-stone-200 rounded-lg bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr className="text-left text-stone-500">
                  <th className="px-4 py-3 font-medium">Store Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Stripe</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Signed Up</th>
                  <th className="px-4 py-3 font-medium">Store</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {seller.storeName}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{seller.slug}</td>
                    <td className="px-4 py-3">
                      {seller.stripeConnectOnboarded ? (
                        <span className="text-green-700 font-medium">Connected</span>
                      ) : (
                        <span className="text-amber-600 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {seller._count.products}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{seller._count.orders}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {formatSignedUpDate(seller.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`https://my-qrs.co/${seller.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-stone-600 hover:text-stone-900"
                        aria-label={`Open ${seller.storeName} store`}
                      >
                        ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <hr className="border-stone-200" />

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Recent Activity</h2>
          <ul className="space-y-3">
            {recentActivity.map((event) => (
              <li
                key={event.id}
                className="border border-stone-200 rounded-lg bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-bold text-stone-900">{event.event}</span>
                  <span className="text-stone-500 text-sm">
                    {truncateUserId(event.userId)}
                  </span>
                  <span className="text-stone-400 text-sm ml-auto">
                    {formatActivityTimestamp(event.createdAt)}
                  </span>
                </div>
                <p className="font-mono text-xs text-stone-600 mt-2 break-all">
                  {formatProperties(event.properties)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-stone-200" />

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">Recent Errors</h2>
          {recentErrors.length === 0 ? (
            <p className="text-stone-400 text-sm">No recent errors</p>
          ) : (
            <ul className="space-y-3">
              {recentErrors.map((event) => (
                <li
                  key={event.id}
                  className="border border-stone-200 rounded-lg bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-bold text-red-600">{event.event}</span>
                    <span className="text-stone-500 text-sm">
                      {truncateUserId(event.userId)}
                    </span>
                    <span className="text-stone-400 text-sm ml-auto">
                      {formatActivityTimestamp(event.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-stone-700 mt-2">
                    {getErrorMessage(event.properties)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <hr className="border-stone-200" />

        <section>
          <details className="border border-stone-200 rounded-lg bg-white">
            <summary className="cursor-pointer px-4 py-3 font-bold text-stone-900">
              SA Postcard Generator
            </summary>
            <div className="border-t border-stone-200 px-4 py-4">
              <PostcardGenerator />
            </div>
          </details>
        </section>
      </div>
    </main>
  )
}
