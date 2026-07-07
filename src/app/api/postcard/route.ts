import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { generatePostcardPdf, parsePostcardOrientation } from '@/lib/postcard-pdf'
import { sellerOwnsHeroImageUrl } from '@/services/hero.service'
import { getSellerByClerkId } from '@/services/seller.service'

type PostcardBody = {
  imageUrl?: string
  orientation?: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await getSellerByClerkId(userId)
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: PostcardBody
  try {
    body = (await req.json()) as PostcardBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const imageUrl = body.imageUrl?.trim()
  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }

  const ownsImage = await sellerOwnsHeroImageUrl(seller.id, imageUrl)
  if (!ownsImage) {
    return NextResponse.json({ error: 'Invalid image selection' }, { status: 400 })
  }

  const orientationInput = body.orientation ?? 'horizontal'
  const orientation = parsePostcardOrientation(orientationInput)
  if (!orientation) {
    return NextResponse.json(
      { error: "orientation must be 'horizontal' or 'vertical'" },
      { status: 400 }
    )
  }

  try {
    const pdf = await generatePostcardPdf({
      storeName: seller.storeName,
      slug: seller.slug,
      imageUrl,
      postcardCta: seller.postcardCta,
      orientation,
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="postcard-${seller.slug}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Postcard PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate postcard' }, { status: 500 })
  }
}
