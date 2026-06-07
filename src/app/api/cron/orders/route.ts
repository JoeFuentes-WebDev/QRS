import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTelegramMessageWithButtons, sendTelegramMessage } from '@/lib/telegram'

const REMINDER_HOURS = 72
const AUTO_CANCEL_HOURS = 96

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const reminderThreshold = new Date(now.getTime() - REMINDER_HOURS * 60 * 60 * 1000)
  const cancelThreshold = new Date(now.getTime() - AUTO_CANCEL_HOURS * 60 * 60 * 1000)

  const pendingOrders = await prisma.order.findMany({
    where: { status: 'PENDING' },
    include: { orderItems: { include: { product: true } } },
    orderBy: { createdAt: 'asc' },
  })

  let reminded = 0
  let cancelled = 0

  for (const order of pendingOrders) {
    const productNames = order.orderItems.map(i => i.product.name).join(', ')

    if (order.createdAt < cancelThreshold) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)

        if (session.payment_intent) {
          await stripe.paymentIntents.cancel(session.payment_intent as string)
        }

        for (const item of order.orderItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { inStock: true },
          })
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED' },
        })

        const botToken = process.env.TELEGRAM_BOT_TOKEN
        const chatId = process.env.LAURA_CHAT_ID
        if (botToken && chatId) {
          await sendTelegramMessage(
            botToken,
            chatId,
            `⚠️ Order auto-cancelled after 96 hours.\n\n<b>${productNames}</b> is back in the shop. Customer has not been charged.`
          )
        }

        cancelled++
      } catch (error) {
        console.error('Auto-cancel error:', error)
      }

    } else if (order.createdAt < reminderThreshold) {
      try {
        const hoursAgo = Math.round((now.getTime() - order.createdAt.getTime()) / (60 * 60 * 1000))

        const botToken = process.env.TELEGRAM_BOT_TOKEN
        const chatId = process.env.LAURA_CHAT_ID
        if (botToken && chatId) {
          await sendTelegramMessageWithButtons(
            botToken,
            chatId,
            `⏰ <b>Reminder — Pending Order</b>\n\n<b>Item:</b> ${productNames}\n<b>Waiting:</b> ${hoursAgo} hours\n\nAuto-cancels in ${AUTO_CANCEL_HOURS - hoursAgo} hours.`,
            [
              { text: '✓ Yes, ship it', callback_data: `YES:${order.id}` },
              { text: '✕ Cancel order', callback_data: `NO:${order.id}` },
            ]
          )
        }

        reminded++
      } catch (error) {
        console.error('Reminder error:', error)
      }
    }
  }

  return NextResponse.json({ reminded, cancelled, checked: pendingOrders.length })
}