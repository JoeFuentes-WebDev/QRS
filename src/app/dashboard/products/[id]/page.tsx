import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentSeller } from '@/lib/seller'
import { getProductById } from '@/services/product.service'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ProductForm } from '@/components/dashboard/product-form'

type EditProductPageProps = {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const seller = await getCurrentSeller()
  if (!seller) redirect('/onboarding')

  const { id } = await params
  const product = await getProductById(id, seller.id)
  if (!product) notFound()

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
            <h2 className="text-xl font-black text-stone-900 mt-2">Edit product</h2>
          </div>

          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <ProductForm
              mode="edit"
              stripeConnectOnboarded={seller.stripeConnectOnboarded}
              initialProduct={{
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                stock: product.stock,
                images: product.images,
                tags: product.tags,
                category: product.category,
                published: product.published,
              }}
            />
          </section>
        </div>
      </div>
    </main>
  )
}
