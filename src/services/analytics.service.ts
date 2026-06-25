import { dotell } from '@/lib/dotell'

type TrackProperties = Record<string, string | number | boolean | null>

export async function trackSellerEvent(
  clerkUserId: string,
  event: string,
  properties?: TrackProperties
): Promise<void> {
  try {
    dotell.identify(clerkUserId)
    dotell.track(event, properties)
  } catch (error) {
    console.error(`[dotell] Failed to track event "${event}":`, error)
  }
}
