import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadProductImage } from '@/lib/cloudinary'
import { analyzeProductImage } from '@/lib/ai-analysis'

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

// POST /api/admin - upload image, get AI analysis back (not saved yet)
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

    // Run AI analysis and image upload in parallel
    const [analysis, imageUrl] = await Promise.all([
      analyzeProductImage(base64, mediaType),
      uploadProductImage(buffer, file.name),
    ])

    return NextResponse.json({ analysis, imageUrl })
  } catch (error) {
    console.error('Admin upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// PUT /api/admin - save confirmed product to DB
export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, category, imageUrl, pieceCount, basePrice, price2, price3, tags, aiLabel } = body

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        imageUrl,
        pieceCount: Number(pieceCount),
        basePrice: Number(basePrice),
        price2: price2 ? Number(price2) : null,
        price3: price3 ? Number(price3) : null,
        tags: tags ?? [],
        aiLabel,
        inStock: true,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product save error:', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}

// PATCH /api/admin - update existing product
export async function PATCH(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body

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
