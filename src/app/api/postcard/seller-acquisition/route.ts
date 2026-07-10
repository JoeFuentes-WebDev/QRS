import { NextRequest, NextResponse } from 'next/server'
import { generateSellerAcquisitionPostcardPdf } from '@/lib/seller-acquisition-postcard-pdf'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const utmSource = req.nextUrl.searchParams.get('utm_source')?.trim() || 'organic'

  try {
    const pdf = await generateSellerAcquisitionPostcardPdf({ utmSource })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="join-qrs.pdf"',
      },
    })
  } catch (error) {
    console.error('Seller acquisition postcard PDF error:', error)
    return NextResponse.json(
      { error: 'Failed to generate seller acquisition postcard' },
      { status: 500 }
    )
  }
}
