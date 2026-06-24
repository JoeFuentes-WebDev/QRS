type TelegramConnectCardProps = {
  telegramChatId: string | null
  connectUrl: string | null
}

const labelClass = 'block text-sm font-medium text-stone-700'

export function TelegramConnectCard({
  telegramChatId,
  connectUrl,
}: TelegramConnectCardProps) {
  const connected = !!telegramChatId

  return (
    <div className="space-y-3">
      <div>
        <p className={labelClass}>Telegram (optional)</p>
        <p className="text-stone-400 text-xs mt-1">
          Secondary channel — Accept and Decline buttons in Telegram.
        </p>
      </div>

      {connected ? (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          Telegram connected. New orders will notify this chat.
        </p>
      ) : connectUrl ? (
        <a
          href={connectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors"
        >
          Connect Telegram
        </a>
      ) : (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          Telegram is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_NAME in your
          environment.
        </p>
      )}

      {connectUrl && (
        <p className="text-stone-400 text-xs">
          Opens Telegram, then tap <span className="font-medium text-stone-600">Start</span> to
          finish connecting.
        </p>
      )}
    </div>
  )
}
