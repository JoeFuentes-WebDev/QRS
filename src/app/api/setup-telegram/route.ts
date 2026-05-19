import { NextResponse } from 'next/server'
import { setTelegramWebhook } from '@/lib/telegram'

export async function GET() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/telegram`
  await setTelegramWebhook(webhookUrl)
  return NextResponse.json({ ok: true, webhookUrl })
}