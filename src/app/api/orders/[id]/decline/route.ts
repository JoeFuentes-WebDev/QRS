import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { trackSellerEvent } from '@/services/analytics.service'
import { getSellerByClerkId } from '@/services/seller.service'
import { updateOrderStatus } from '@/services/order.service'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(
  _req: Request,
  context: RouteContext
): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seller = await getSellerByClerkId(userId)
  if (!seller) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const result = await updateOrderStatus(id, seller.id, 'DECLINED', ['PENDING'])

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  if (result.kind === 'forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (result.kind === 'conflict') {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 409 })
  }

  void trackSellerEvent(seller.clerkUserId, 'order.declined')

  return NextResponse.json({ order: { id: result.order.id, status: result.order.status } })
}
