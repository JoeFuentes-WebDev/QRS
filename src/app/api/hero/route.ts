import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadProductImage } from '@/lib/cloudinary'
import { getDefaultSeller } from '@/lib/seller'

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

export async function GET() {
  try {
    const seller = await getDefaultSeller()
    const images = await prisma.heroImage.findMany({
      where: { sellerId: seller.id, active: true },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(images)
  } catch (error) {
    console.error('Hero fetch error:', error)
    return NextResponse.json([])
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await getDefaultSeller()
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const upload = await uploadProductImage(seller.id, buffer, `hero-${Date.now()}-${file.name}`)

  const count = await prisma.heroImage.count({ where: { sellerId: seller.id } })
  const image = await prisma.heroImage.create({
    data: {
      sellerId: seller.id,
      imageUrl: upload.url,
      imagePublicId: upload.publicId,
      order: count,
    },
  })

  return NextResponse.json(image)
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const seller = await getDefaultSeller()
  const { id } = await req.json()

  const existing = await prisma.heroImage.findFirst({
    where: { id, sellerId: seller.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.heroImage.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
