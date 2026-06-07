import { NextRequest, NextResponse } from 'next/server'
import { setTelegramWebhook } from '@/lib/telegram'

export async function GET(req: NextRequest) {
  const botToken =
    req.nextUrl.searchParams.get('token') ?? process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'Bot token required' }, { status: 400 })
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram`
  await setTelegramWebhook(botToken, webhookUrl)
  return NextResponse.json({ ok: true, webhookUrl })
}
