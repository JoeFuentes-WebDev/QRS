import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { answerCallbackQuery } from '@/lib/telegram'
import {
  confirmTelegramOrder,
  cancelTelegramOrder,
  type OrderWithItems,
} from '@/lib/fulfillment'

async function loadOrder(orderId: string): Promise<OrderWithItems | null> {
  return prisma.order.findFirst({
    where: { id: orderId },
    include: { orderItems: { include: { product: true } } },
  })
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()

    if (update.callback_query) {
      const callbackQuery = update.callback_query
      const chatId = String(callbackQuery.message.chat.id)
      const data = callbackQuery.data as string

      const [action, orderId] = data.split(':')
      if (!orderId || (action !== 'YES' && action !== 'NO')) {
        return NextResponse.json({ ok: true })
      }

      const order = await loadOrder(orderId)
      if (!order) {
        return NextResponse.json({ ok: true })
      }

      const seller = await prisma.seller.findUnique({
        where: { id: order.sellerId },
      })
      if (!seller?.telegramBotToken) {
        return NextResponse.json({ ok: true })
      }

      await answerCallbackQuery(seller.telegramBotToken, callbackQuery.id)

      if (order.status !== 'PENDING') {
        return NextResponse.json({ ok: true })
      }

      if (action === 'YES') {
        await confirmTelegramOrder(order, seller, chatId)
      } else {
        await cancelTelegramOrder(order, seller, chatId)
      }

      return NextResponse.json({ ok: true })
    }
  } catch (error) {
    console.error('Telegram webhook error:', error)
  }

  return NextResponse.json({ ok: true })
}
