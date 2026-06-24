import QRCode from 'qrcode'
import { isValidSlug } from '@/lib/slug'

function requireAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set')
  }
  return appUrl.replace(/\/$/, '')
}

export const APP_URL_MISSING_MESSAGE =
  'Set NEXT_PUBLIC_APP_URL in your environment variables.'

export type ShopUrlDisplay =
  | { type: 'url'; text: string }
  | { type: 'warning'; text: string }

export function getShopUrlDisplay(
  slug: string,
  placeholder = 'your-slug'
): ShopUrlDisplay {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!appUrl) {
    return { type: 'warning', text: APP_URL_MISSING_MESSAGE }
  }
  const host = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const path = slug || placeholder
  return { type: 'url', text: `${host}/${path}` }
}

export function buildShopUrl(slug: string): string {
  if (!isValidSlug(slug)) {
    throw new Error('Invalid slug')
  }
  return `${requireAppUrl()}/${slug}`
}

export async function generateQrPngBuffer(slug: string): Promise<Buffer> {
  const url = buildShopUrl(slug)
  return QRCode.toBuffer(url, {
    type: 'png',
    width: 512,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

export async function generateQrDataUri(slug: string): Promise<string> {
  const url = buildShopUrl(slug)
  return QRCode.toDataURL(url, {
    width: 512,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}
