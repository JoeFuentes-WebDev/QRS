type TrackProperties = Record<string, string | number | boolean | null>

export async function trackSellerEvent(
  clerkUserId: string,
  event: string,
  properties?: TrackProperties
): Promise<void> {
  try {
    const apiUrl = process.env.DOTELL_API_URL?.replace(/\/$/, '')
    const apiKey = process.env.DOTELL_API_KEY?.trim()

    if (!apiUrl || !apiKey) {
      console.log(
        `[dotell] seller=${clerkUserId} event=${event}`,
        properties ?? ''
      )
      return
    }

    await fetch(`${apiUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        userId: clerkUserId,
        event,
        properties: properties ?? {},
      }),
    })
  } catch (error) {
    console.error(`[dotell] Failed to track event "${event}":`, error)
  }
}
