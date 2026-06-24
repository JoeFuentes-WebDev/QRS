import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultSeller, getSellerBySlug } from '@/lib/seller'
import { mapProductForShop, storefrontProductWhere } from '@/lib/shop-product'

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

async function resolveSeller(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('slug')
  if (slug) {
    const seller = await getSellerBySlug(slug)
    if (!seller) return null
    return seller
  }
  return getDefaultSeller()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const all = searchParams.get('all') === 'true'

  try {
    const seller = await resolveSeller(req)
    if (!seller) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    const products = await prisma.product.findMany({
      where: {
        sellerId: seller.id,
        ...(all ? {} : storefrontProductWhere),
        ...(category ? { category } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { tags: { has: query.toLowerCase() } },
                { category: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products.map(mapProductForShop))
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
