import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createUploadSignature } from '@/lib/cloudinary'
import { getSellerByClerkId } from '@/services/seller.service'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await getSellerByClerkId(userId)
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const purpose = req.nextUrl.searchParams.get('purpose')
  const folder =
    purpose === 'hero'
      ? `qrs/${seller.id}/hero`
      : `qrs/${seller.id}/products`

  try {
    const payload = createUploadSignature(folder)
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Cloudinary sign error:', error)
    const message =
      error instanceof Error ? error.message : 'Cloudinary is not configured'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
