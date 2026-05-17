export function defaultPrice(pieceCount: number): number {
  if (pieceCount <= 1) return 50
  if (pieceCount === 2) return 80
  if (pieceCount === 3) return 100
  return 150
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}