import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import { generateQrDataUri } from '@/lib/qr'

const TAGLINE = 'Scan to shop'

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
  const imageUrl = escapeHtml(params.imageUrl)
  const qrDataUri = params.qrDataUri

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
        background: #fafaf9;
        color: #1c1917;
      }
      .card {
        width: 4in;
        height: 6in;
        display: flex;
        flex-direction: column;
        padding: 0.2in;
      }
      .hero {
        width: 100%;
        height: 2.6in;
        border-radius: 12px;
        object-fit: cover;
        background: #e7e5e4;
      }
      .title {
        margin-top: 0.18in;
        font-size: 22px;
        font-weight: 800;
        text-align: center;
        line-height: 1.2;
      }
      .tagline {
        margin-top: 0.06in;
        font-size: 11px;
        text-align: center;
        color: #78716c;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .qr-wrap {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding-bottom: 0.08in;
      }
      .qr {
        width: 1.55in;
        height: 1.55in;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <img class="hero" src="${imageUrl}" alt="" />
      <div class="title">${storeName}</div>
      <div class="tagline">${TAGLINE}</div>
      <div class="qr-wrap">
        <img class="qr" src="${qrDataUri}" alt="Shop QR code" />
      </div>
    </div>
  </body>
</html>`
}

async function resolveExecutablePath(): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    const localPath = process.env.CHROMIUM_PATH
    if (localPath) {
      return localPath
    }
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
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
    headless: true,
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
