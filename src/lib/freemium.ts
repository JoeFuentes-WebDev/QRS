export const FREE_TIER_LIMIT = 20

export function freemiumUsageMessage(count: number): string {
  if (count > FREE_TIER_LIMIT) {
    return "You've exceeded the free tier. Paid tier coming soon."
  }
  return `${count} of ${FREE_TIER_LIMIT} free orders used this month`
}

export function logThresholdCrossed(sellerId: string, storeName: string): void {
  console.log(
    `[FREEMIUM] Seller ${sellerId} (${storeName}) crossed threshold — Connect fee activation pending (V3)`
  )
}
