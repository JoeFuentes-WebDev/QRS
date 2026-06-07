import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getSellerByClerkUserId } from '@/lib/seller'
import { uploadHeroImage, deleteCloudinaryImage, assertCloudinaryConfigured } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await getSellerByClerkUserId(userId)
    if (!seller) {
      return NextResponse.json({ error: 'No seller account' }, { status: 403 })
    }

    assertCloudinaryConfigured()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const upload = await uploadHeroImage(
      seller.id,
      buffer,
      `hero-${Date.now()}-${file.name}`
    )

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
  } catch (error) {
    console.error('Dashboard hero upload error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await getSellerByClerkUserId(userId)
    if (!seller) {
      return NextResponse.json({ error: 'No seller account' }, { status: 403 })
    }

    const { id } = (await req.json()) as { id: string }

    const existing = await prisma.heroImage.findFirst({
      where: { id, sellerId: seller.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (existing.imagePublicId) {
      await deleteCloudinaryImage(existing.imagePublicId)
    }

    await prisma.heroImage.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Dashboard hero delete error:', error)
    const message = error instanceof Error ? error.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
