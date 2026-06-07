import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const slug = (body as { slug?: string }).slug
  if (slug) {
    return NextResponse.json(
      { error: `Use POST /api/${slug}/checkout instead` },
      { status: 410 }
    )
  }
  return NextResponse.json({ error: 'Use POST /api/[slug]/checkout' }, { status: 410 })
}
