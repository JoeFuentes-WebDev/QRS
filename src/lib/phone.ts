/** Normalize US phone input to E.164 (+1XXXXXXXXXX). Returns null if invalid. */
export function normalizeUsPhone(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }

  return null
}

export function isValidUsPhone(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return true
  return normalizeUsPhone(trimmed) !== null
}

/** Format E.164 US number for display: (555) 123-4567 */
export function formatUsPhoneDisplay(e164: string | null | undefined): string {
  if (!e164) return ''

  const digits = e164.replace(/\D/g, '')
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
  if (national.length !== 10) return e164

  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`
}
