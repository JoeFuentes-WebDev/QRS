import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultSeller, getSellerBySlug } from '@/lib/seller'
import { storefrontProductWhere } from '@/lib/shop-product'

export async function GET(req: NextRequest) {
  try {
    const slug = new URL(req.url).searchParams.get('slug')
    const seller = slug
      ? await getSellerBySlug(slug)
      : await getDefaultSeller()
    if (!seller) {
      return NextResponse.json({ categories: [], popularTags: [] })
    }

    const products = await prisma.product.findMany({
      where: { sellerId: seller.id, ...storefrontProductWhere },
      select: { category: true, tags: true },
    })

    const categories = [...new Set(products.map(p => p.category))].filter(Boolean) as string[]

    const allTags = products.flatMap(p => p.tags)
    const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1
      return acc
    }, {})
    const popularTags = Object.entries(tagCounts)
      .filter(([, count]) => count >= 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([tag]) => tag)

    return NextResponse.json({ categories, popularTags })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ categories: [], popularTags: [] })
  }
}
