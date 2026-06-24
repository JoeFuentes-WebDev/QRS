import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentSeller } from '@/lib/seller'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ProductForm } from '@/components/dashboard/product-form'

export default async function NewProductPage() {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <DashboardHeader storeName={seller.storeName} />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <Link
              href="/dashboard/products"
              className="text-sm text-stone-500 hover:text-stone-800"
            >
              ← Products
            </Link>
            <h2 className="text-xl font-black text-stone-900 mt-2">New product</h2>
          </div>

          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <ProductForm
              mode="create"
              stripeConnectOnboarded={seller.stripeConnectOnboarded}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
