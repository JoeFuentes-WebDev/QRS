export function getTelegramBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null
}

export function getTelegramConnectUrl(sellerId: string): string | null {
  const botName = process.env.TELEGRAM_BOT_NAME?.trim()
  if (!botName) return null
  return `https://t.me/${botName}?start=${encodeURIComponent(sellerId)}`
}

function telegramApi(botToken: string): string {
  return `https://api.telegram.org/bot${botToken}`
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  await fetch(`${telegramApi(botToken)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export async function sendTelegramMessageWithButtons(
  botToken: string,
  chatId: string,
  text: string,
  buttons: { text: string; callback_data: string }[]
): Promise<void> {
  await fetch(`${telegramApi(botToken)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [buttons.map((b) => ({ text: b.text, callback_data: b.callback_data }))],
      },
    }),
  })
}

export async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await fetch(`${telegramApi(botToken)}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

export async function sendTelegramPhoto(
  botToken: string,
  chatId: string,
  photoUrl: string,
  caption: string
): Promise<void> {
  await fetch(`${telegramApi(botToken)}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }),
  })
}

export async function setTelegramWebhook(
  botToken: string,
  webhookUrl: string
): Promise<void> {
  const res = await fetch(`${telegramApi(botToken)}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  })
  const data = await res.json()
  // console.log('Webhook set:', data)
}
