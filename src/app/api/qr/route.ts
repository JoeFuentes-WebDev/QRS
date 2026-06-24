import { NextRequest, NextResponse } from 'next/server'
import { generateQrPngBuffer } from '@/lib/qr'
import { isValidSlug } from '@/lib/slug'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const slug = new URL(req.url).searchParams.get('slug')?.trim()

  if (!slug || !isValidSlug(slug)) {
    return NextResponse.json({ error: 'Valid slug query param is required' }, { status: 400 })
  }

  try {
    const png = await generateQrPngBuffer(slug)
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
