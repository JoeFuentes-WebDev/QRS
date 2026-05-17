import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadProductImage } from '@/lib/cloudinary'

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

export async function GET() {
  const images = await prisma.heroImage.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(images)
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const imageUrl = await uploadProductImage(buffer, `hero-${Date.now()}-${file.name}`)

  const count = await prisma.heroImage.count()
  const image = await prisma.heroImage.create({
    data: { imageUrl, order: count },
  })

  return NextResponse.json(image)
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  await prisma.heroImage.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
