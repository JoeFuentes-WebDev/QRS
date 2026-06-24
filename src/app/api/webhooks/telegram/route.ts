import { NextRequest, NextResponse } from 'next/server'
import {
  answerCallbackQuery,
  getTelegramBotToken,
  sendTelegramMessage,
} from '@/lib/telegram'
import { trackSellerEvent } from '@/services/analytics.service'
import { updateOrderStatus } from '@/services/order.service'
import {
  getSellerById,
  getSellerByTelegramChatId,
  updateSellerTelegramChatId,
} from '@/services/seller.service'

type TelegramUpdate = {
  message?: {
    text?: string
    chat: { id: number }
  }
  callback_query?: {
    id: string
    data?: string
    message?: {
      chat: { id: number }
    }
  }
}

function parseStartSellerId(text: string): string | null {
  const match = text.match(/^\/start(?:@\w+)?(?:\s+(.+))?$/)
  return match?.[1]?.trim() || null
}

function parseOrderCallback(data: string): { action: 'accept' | 'decline'; orderId: string } | null {
  const match = data.match(/^order:(accept|decline):(.+)$/)
  if (!match) return null
  return { action: match[1] as 'accept' | 'decline', orderId: match[2] }
}

async function handleStartCommand(chatId: string, text: string): Promise<void> {
  const botToken = getTelegramBotToken()
  if (!botToken) return

  const sellerId = parseStartSellerId(text)
  if (!sellerId) {
    await sendTelegramMessage(
      botToken,
      chatId,
      'Open the Connect Telegram link from your QRS dashboard to link this chat.'
    )
    return
  }

  const seller = await getSellerById(sellerId)
  if (!seller) {
    await sendTelegramMessage(botToken, chatId, 'Invalid connect link. Generate a new one from your dashboard.')
    return
  }

  await updateSellerTelegramChatId(seller.id, chatId)
  await sendTelegramMessage(
    botToken,
    chatId,
    `<b>Connected to ${seller.storeName}</b>\n\nYou will receive new order notifications here with Accept and Decline buttons.`
  )
}

async function handleOrderCallback(
  callbackQueryId: string,
  chatId: string,
  data: string
): Promise<void> {
  const botToken = getTelegramBotToken()
  if (!botToken) return

  const parsed = parseOrderCallback(data)
  if (!parsed) {
    await answerCallbackQuery(botToken, callbackQueryId, 'Unknown action')
    return
  }

  const seller = await getSellerByTelegramChatId(chatId)
  if (!seller) {
    await answerCallbackQuery(botToken, callbackQueryId, 'Telegram not connected')
    return
  }

  const newStatus = parsed.action === 'accept' ? 'ACCEPTED' : 'DECLINED'
  const result = await updateOrderStatus(parsed.orderId, seller.id, newStatus, ['PENDING'])

  if (result.kind === 'not_found') {
    await answerCallbackQuery(botToken, callbackQueryId, 'Order not found')
    return
  }
  if (result.kind === 'forbidden') {
    await answerCallbackQuery(botToken, callbackQueryId, 'Not your order')
    return
  }
  if (result.kind === 'conflict') {
    await answerCallbackQuery(botToken, callbackQueryId, 'Order already processed')
    return
  }

  if (parsed.action === 'accept') {
    void trackSellerEvent(seller.clerkUserId, 'order.accepted')
    await answerCallbackQuery(botToken, callbackQueryId, 'Order accepted')
  } else {
    void trackSellerEvent(seller.clerkUserId, 'order.declined')
    await answerCallbackQuery(botToken, callbackQueryId, 'Order declined')
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!getTelegramBotToken()) {
    return NextResponse.json({ ok: true })
  }

  let update: TelegramUpdate
  try {
    update = (await req.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  try {
    if (update.message?.text?.startsWith('/start')) {
      await handleStartCommand(String(update.message.chat.id), update.message.text)
    }

    if (update.callback_query?.data && update.callback_query.message) {
      await handleOrderCallback(
        update.callback_query.id,
        String(update.callback_query.message.chat.id),
        update.callback_query.data
      )
    }
  } catch (error) {
    console.error('Telegram webhook error:', error)
  }

  return NextResponse.json({ ok: true })
}
