import type { OrderStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { CheckoutSessionLineItem } from '@/services/checkout.service'

const orderInclude = {
  items: {
    include: { product: true },
  },
  seller: {
    select: {
      clerkUserId: true,
      storeName: true,
      notificationEmail: true,
      telegramChatId: true,
      sellerPhone: true,
    },
  },
} as const

export type OrderWithDetails = Awaited<
  ReturnType<typeof getOrdersForSeller>
>[number]

export function computeOrderTotalCents(
  items: Array<{ priceSnapshot: number; quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0)
}

export async function orderExistsByStripeSessionId(
  stripeSessionId: string
): Promise<boolean> {
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId },
    select: { id: true },
  })
  return !!existing
}

export async function createOrderFromCheckout(params: {
  sellerId: string
  stripeSessionId: string
  stripePaymentIntentId: string | null
  buyerEmail: string
  lineItems: CheckoutSessionLineItem[]
}) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        sellerId: params.sellerId,
        stripeSessionId: params.stripeSessionId,
        stripePaymentIntentId: params.stripePaymentIntentId,
        buyerEmail: params.buyerEmail,
        status: 'PENDING',
        items: {
          create: params.lineItems.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            priceSnapshot: line.unitAmountCents,
          })),
        },
      },
      include: orderInclude,
    })

    for (const line of params.lineItems) {
      const updated = await tx.product.updateMany({
        where: {
          id: line.productId,
          sellerId: params.sellerId,
          stock: { gte: line.quantity },
        },
        data: {
          stock: { decrement: line.quantity },
        },
      })

      if (updated.count !== 1) {
        throw new Error(`Stock decrement failed for product ${line.productId}`)
      }
    }

    return order
  })
}

export async function getOrdersForSeller(sellerId: string) {
  return prisma.order.findMany({
    where: { sellerId },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrderById(orderId: string, sellerId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, sellerId },
    include: {
      items: {
        include: { product: true },
      },
    },
  })
}

export type OrderAccessResult =
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | {
      kind: 'ok'
      order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>
    }

export async function resolveOrderAccess(
  orderId: string,
  sellerId: string
): Promise<OrderAccessResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  if (!order) {
    return { kind: 'not_found' }
  }

  if (order.sellerId !== sellerId) {
    return { kind: 'forbidden' }
  }

  return { kind: 'ok', order }
}

export type OrderStatusUpdateResult =
  | { kind: 'not_found' }
  | { kind: 'forbidden' }
  | { kind: 'conflict' }
  | {
      kind: 'ok'
      order: NonNullable<Awaited<ReturnType<typeof getOrderById>>>
    }

export async function updateOrderStatus(
  orderId: string,
  sellerId: string,
  newStatus: OrderStatus,
  allowedFrom: OrderStatus[]
): Promise<OrderStatusUpdateResult> {
  const access = await resolveOrderAccess(orderId, sellerId)

  if (access.kind === 'not_found') {
    return { kind: 'not_found' }
  }

  if (access.kind === 'forbidden') {
    return { kind: 'forbidden' }
  }

  if (!allowedFrom.includes(access.order.status)) {
    return { kind: 'conflict' }
  }

  const order = await prisma.order.update({
    where: { id: orderId, sellerId },
    data: { status: newStatus },
    include: {
      items: {
        include: { product: true },
      },
    },
  })

  return { kind: 'ok', order }
}
