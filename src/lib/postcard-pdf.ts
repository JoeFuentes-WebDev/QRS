import { existsSync } from 'node:fs'
import { join } from 'node:path'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { generateQrDataUri } from '@/lib/qr'

chromium.setGraphicsMode = false

const QRS_ORANGE = '#FF6B35'
const INK = '#1A1A1A'
const BADGE_PADDING_PX = 12
const QR_SIZE_IN = '1.1in'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildPostcardHtml(params: {
  storeName: string
  imageUrl: string
  qrDataUri: string
}): string {
  const storeName = escapeHtml(params.storeName)
  const qrDataUri = params.qrDataUri
  const hasHeroImage = params.imageUrl.trim().length > 0
  const imageUrl = escapeHtml(params.imageUrl)

  const backgroundMarkup = hasHeroImage
    ? `<img class="hero-bg" src="${imageUrl}" alt="" />`
    : '<div class="hero-bg hero-bg--default"></div>'

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: 4in 6in; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 4in;
        height: 6in;
        font-family: Helvetica, Arial, sans-serif;
        background: ${QRS_ORANGE};
      }
      .card {
        position: relative;
        width: 4in;
        height: 6in;
        overflow: hidden;
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
      .badge {
        position: absolute;
        right: 0;
        bottom: 0;
        background: #ffffff;
        padding: ${BADGE_PADDING_PX}px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: calc(${QR_SIZE_IN} + ${BADGE_PADDING_PX * 2}px);
        width: max-content;
        max-width: 3in;
      }
      .qr {
        width: ${QR_SIZE_IN};
        height: ${QR_SIZE_IN};
        display: block;
      }
      .store-name {
        margin-top: 8px;
        font-size: 14px;
        font-weight: 500;
        color: ${INK};
        text-align: center;
        line-height: 1.25;
        max-width: 2.75in;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    </style>
  </head>
  <body>
    <div class="card">
      ${backgroundMarkup}
      <div class="badge">
        <img class="qr" src="${qrDataUri}" alt="Shop QR code" />
        <p class="store-name">${storeName}</p>
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
}): Promise<Buffer> {
  const qrDataUri = await generateQrDataUri(params.slug)
  const html = buildPostcardHtml({
    storeName: params.storeName,
    imageUrl: params.imageUrl,
    qrDataUri,
  })

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 384, height: 576, deviceScaleFactor: 2 },
    executablePath: await resolveExecutablePath(),
    headless: 'shell',
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      width: '4in',
      height: '6in',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
