import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentSeller } from '@/lib/seller'
import { listProductsForSeller } from '@/services/product.service'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ProductList } from '@/components/dashboard/product-list'

export default async function DashboardProductsPage() {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  const products = await listProductsForSeller(seller.id)

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <DashboardHeader storeName={seller.storeName} />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-stone-500 hover:text-stone-800"
              >
                ← Dashboard
              </Link>
              <h2 className="text-xl font-black text-stone-900 mt-2">Products</h2>
            </div>
            <Link
              href="/dashboard/products/new"
              className="bg-stone-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-stone-700 transition-colors"
            >
              Add product
            </Link>
          </div>

          <ProductList
            products={products.map((product) => ({
              id: product.id,
              name: product.name,
              price: product.price,
              stock: product.stock,
              published: product.published,
              imageUrl: product.images[0] ?? null,
            }))}
            stripeConnectOnboarded={seller.stripeConnectOnboarded}
          />
        </div>
      </div>
    </main>
  )
}
