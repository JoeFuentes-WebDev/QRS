import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSellerByClerkUserId } from '@/lib/seller'
import { uploadProductImage, assertCloudinaryConfigured } from '@/lib/cloudinary'
import { analyzeProductImage } from '@/lib/ai-analysis'
import type { ImageAnalysis } from '@/lib/ai-analysis'

const FALLBACK_ANALYSIS: ImageAnalysis = {
  name: 'Product',
  category: 'other',
  pieceCount: 1,
  description: '',
  tags: [],
  aiColor: '',
  aiTexture: '',
  aiMaterial: '',
  suggestedPrice: 50,
}

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
    const base64 = buffer.toString('base64')
    const mediaType = file.type || 'image/jpeg'

    const upload = await uploadProductImage(seller.id, buffer, file.name)

    let analysis: ImageAnalysis
    try {
      analysis = await analyzeProductImage(base64, mediaType)
    } catch {
      analysis = FALLBACK_ANALYSIS
    }

    return NextResponse.json({
      analysis,
      imageUrl: upload.url,
      imagePublicId: upload.publicId,
    })
  } catch (error) {
    console.error('Dashboard upload error:', error)
    const message =
      error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
