import { NextResponse } from 'next/server'
import { generateSellerAcquisitionPostcardPdf } from '@/lib/seller-acquisition-postcard-pdf'

export async function GET(): Promise<NextResponse> {
  try {
    const pdf = await generateSellerAcquisitionPostcardPdf()

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
