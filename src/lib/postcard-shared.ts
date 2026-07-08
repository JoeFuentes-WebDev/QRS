export type PostcardOrientation = 'horizontal' | 'vertical'

export const POSTCARD_DEFAULT_HERO = 'default'
export const QRS_ORANGE = '#FF6B35'

export function parsePostcardOrientation(
  value: unknown
): PostcardOrientation | null {
  if (value === 'horizontal' || value === 'vertical') {
    return value
  }
  return null
}

export function resolvePostcardHeroImageUrl(
  heroImageUrl: string | null | undefined
): string {
  const trimmed = heroImageUrl?.trim()
  if (!trimmed || trimmed === POSTCARD_DEFAULT_HERO) {
    return ''
  }
  return trimmed
}
