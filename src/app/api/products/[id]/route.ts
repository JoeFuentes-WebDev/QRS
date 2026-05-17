import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()
  const product = await prisma.product.update({ where: { id: params.id }, data })
  return NextResponse.json(product)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.product.update({ where: { id: params.id }, data: { inStock: false } })
  return NextResponse.json({ ok: true })
}
