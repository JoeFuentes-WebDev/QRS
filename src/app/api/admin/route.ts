import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadProductImage } from '@/lib/cloudinary'
import { analyzeProductImage } from '@/lib/ai-analysis'
import { getDefaultSeller } from '@/lib/seller'

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mediaType = file.type || 'image/jpeg'

    const [analysis, upload] = await Promise.all([
      analyzeProductImage(base64, mediaType),
      uploadProductImage(buffer, file.name),
    ])

    return NextResponse.json({ analysis, imageUrl: upload.url, imagePublicId: upload.publicId })
  } catch (error) {
    console.error('Admin upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const seller = await getDefaultSeller()
    const body = await req.json()
    const {
      name,
      description,
      category,
      imageUrl,
      imagePublicId,
      quantity,
      price,
      tags,
      aiColor,
      aiTexture,
      aiMaterial,
      aiSuggestedPrice,
    } = body

    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        name,
        description,
        category,
        imageUrl,
        imagePublicId,
        quantity: quantity != null ? Number(quantity) : null,
        price: Number(price),
        tags: tags ?? [],
        aiColor,
        aiTexture,
        aiMaterial,
        aiSuggestedPrice: aiSuggestedPrice != null ? Number(aiSuggestedPrice) : null,
        inStock: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product save error:', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const seller = await getDefaultSeller()
    const body = await req.json()
    const { id, ...data } = body

    const existing = await prisma.product.findFirst({
      where: { id, sellerId: seller.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
