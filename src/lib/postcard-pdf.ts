import 'server-only'

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { generateQrDataUri } from '@/lib/qr'
import { QRS_ORANGE, type PostcardOrientation } from '@/lib/postcard-shared'

chromium.setGraphicsMode = false

export type { PostcardOrientation } from '@/lib/postcard-shared'
export {
  POSTCARD_DEFAULT_HERO,
  QRS_ORANGE,
  parsePostcardOrientation,
  resolvePostcardHeroImageUrl,
} from '@/lib/postcard-shared'
const INK = '#1A1A1A'
const BOX_PADDING_PX = 20

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getPostcardDimensions(orientation: PostcardOrientation): {
  width: string
  height: string
  pageSize: string
  viewportWidth: number
  viewportHeight: number
} {
  if (orientation === 'vertical') {
    return {
      width: '4in',
      height: '6in',
      pageSize: '4in 6in',
      viewportWidth: 384,
      viewportHeight: 576,
    }
  }

  return {
    width: '6in',
    height: '4in',
    pageSize: '6in 4in',
    viewportWidth: 576,
    viewportHeight: 384,
  }
}

function buildPostcardHtml(params: {
  storeName: string
  imageUrl: string
  qrDataUri: string
  postcardCta: string | null
  orientation: PostcardOrientation
}): string {
  const storeName = escapeHtml(params.storeName)
  const qrDataUri = params.qrDataUri
  const hasHeroImage = params.imageUrl.trim().length > 0
  const imageUrl = escapeHtml(params.imageUrl)
  const postcardCta = params.postcardCta?.trim()
  const { width, height, pageSize } = getPostcardDimensions(params.orientation)

  const ctaMarkup =
    postcardCta && postcardCta.length > 0
      ? `<p class="cta-text">${escapeHtml(postcardCta)}</p>`
      : ''

  const backgroundMarkup = hasHeroImage
    ? `<img class="hero-bg" src="${imageUrl}" alt="" />`
    : '<div class="hero-bg hero-bg--default"></div>'

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: ${pageSize}; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: ${width};
        height: ${height};
        font-family: Helvetica, Arial, sans-serif;
        background: ${QRS_ORANGE};
      }
      .card {
        position: relative;
        width: ${width};
        height: ${height};
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .hero-bg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .hero-bg--default {
        background: ${QRS_ORANGE};
      }
      .content-box {
        position: relative;
        z-index: 1;
        width: 50%;
        padding: ${BOX_PADDING_PX}px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .store-name {
        width: 100%;
        font-size: 28px;
        font-weight: 800;
        color: ${INK};
        line-height: 1.15;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      .cta-text {
        width: 100%;
        margin-top: 12px;
        font-size: 16px;
        font-weight: 500;
        color: ${INK};
        line-height: 1.35;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      .qr {
        margin-top: 16px;
        width: 100%;
        max-width: 100%;
        aspect-ratio: 1 / 1;
        height: auto;
        display: block;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <div class="card">
      ${backgroundMarkup}
      <div class="content-box">
        <h1 class="store-name">${storeName}</h1>
        ${ctaMarkup}
        <img class="qr" src="${qrDataUri}" alt="Shop QR code" />
      </div>
    </div>
  </body>
</html>`
}

function getChromiumBinCandidates(): string[] {
  const root = /* turbopackIgnore: true */ process.cwd()
  return [
    join(root, 'node_modules/@sparticuz/chromium/bin'),
    join(root, '.next/server/node_modules/@sparticuz/chromium/bin'),
  ]
}

async function resolveExecutablePath(): Promise<string> {
  const customPath = process.env.CHROMIUM_PATH?.trim()
  if (customPath && existsSync(customPath)) {
    return customPath
  }

  if (process.env.NODE_ENV === 'development') {
    const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    if (existsSync(macPath)) {
      return macPath
    }
    throw new Error(
      'Set CHROMIUM_PATH to your local Chrome executable for development.'
    )
  }

  for (const binPath of getChromiumBinCandidates()) {
    if (existsSync(binPath)) {
      return chromium.executablePath(binPath)
    }
  }

  const remotePack = process.env.CHROMIUM_REMOTE_EXEC_PATH?.trim()
  if (remotePack) {
    return chromium.executablePath(remotePack)
  }

  return chromium.executablePath()
}

export async function generatePostcardPdf(params: {
  storeName: string
  slug: string
  imageUrl: string
  postcardCta?: string | null
  orientation?: PostcardOrientation
}): Promise<Buffer> {
  const orientation = params.orientation ?? 'horizontal'
  const dimensions = getPostcardDimensions(orientation)
  const qrDataUri = await generateQrDataUri(params.slug)
  const html = buildPostcardHtml({
    storeName: params.storeName,
    imageUrl: params.imageUrl,
    qrDataUri,
    postcardCta: params.postcardCta ?? null,
    orientation,
  })

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: {
      width: dimensions.viewportWidth,
      height: dimensions.viewportHeight,
      deviceScaleFactor: 2,
    },
    executablePath: await resolveExecutablePath(),
    headless: 'shell',
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      width: dimensions.width,
      height: dimensions.height,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

