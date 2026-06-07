import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDefaultSeller } from '@/lib/seller'

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await getDefaultSeller()
  const { id } = await params
  const data = await req.json()

  const existing = await prisma.product.findFirst({
    where: { id, sellerId: seller.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const product = await prisma.product.update({ where: { id }, data })
  return NextResponse.json(product)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await getDefaultSeller()
  const { id } = await params

  const existing = await prisma.product.findFirst({
    where: { id, sellerId: seller.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.product.update({
    where: { id },
    data: { inStock: false, quantity: 0 },
  })

  return NextResponse.json({ ok: true })
}
