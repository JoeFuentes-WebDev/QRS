import { existsSync } from 'node:fs'
import { join } from 'node:path'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'
import QRCode from 'qrcode'

chromium.setGraphicsMode = false

const ACQUISITION_URL = 'https://my-qrs.co'
const QRS_ORANGE = '#FF6B35'
const CREAM = '#FFF0E8'
const INK = '#1A1A1A'
const PAGE_WIDTH = '6in'
const PAGE_HEIGHT = '4in'

const PHONE_ILLUSTRATION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden="true">
  <rect x="44" y="6" width="32" height="58" rx="5" stroke="#ffffff" stroke-width="2.5"/>
  <circle cx="60" cy="58" r="2.5" fill="#ffffff"/>
  <rect x="51" y="16" width="18" height="18" rx="1.5" stroke="#ffffff" stroke-width="1.5"/>
  <path d="M51 22h18M51 28h18M57 16v18M63 16v18" stroke="#ffffff" stroke-width="1"/>
  <path d="M28 52c-2-8 4-16 12-14" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M24 56c-6-2-4-10 2-12" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
</svg>`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function generateAcquisitionQrDataUri(): Promise<string> {
  return QRCode.toDataURL(ACQUISITION_URL, {
    width: 512,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

function buildSellerAcquisitionPostcardHtml(qrDataUri: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: ${PAGE_WIDTH} ${PAGE_HEIGHT}; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Helvetica, Arial, sans-serif;
        background: ${QRS_ORANGE};
      }
      .page {
        width: ${PAGE_WIDTH};
        height: ${PAGE_HEIGHT};
        position: relative;
        overflow: hidden;
        page-break-after: always;
      }
      .page:last-child {
        page-break-after: auto;
      }
      .front {
        background: ${QRS_ORANGE};
        color: #ffffff;
      }
      .front-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 0.35in 1.1in 0.55in;
      }
      .illustration {
        height: 80px;
        max-height: 80px;
        margin-bottom: 0.14in;
      }
      .illustration svg {
        display: block;
        height: 80px;
        width: auto;
      }
      .headline {
        font-size: 30px;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.02em;
        max-width: 4.5in;
      }
      .subheadline {
        margin-top: 0.1in;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.35;
        opacity: 0.95;
      }
      .wordmark {
        position: absolute;
        left: 0.28in;
        bottom: 0.22in;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: #ffffff;
      }
      .qr-badge {
        position: absolute;
        right: 0.22in;
        bottom: 0.18in;
        background: #ffffff;
        padding: 8px;
        border-radius: 6px;
      }
      .qr-badge img {
        display: block;
        width: 0.82in;
        height: 0.82in;
      }
      .back {
        background: ${CREAM};
        color: ${INK};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.35in 0.45in 0.3in;
        text-align: center;
      }
      .back-heading {
        font-size: 22px;
        font-weight: 800;
        color: ${QRS_ORANGE};
        margin-bottom: 0.18in;
      }
      .steps {
        list-style: none;
        width: 100%;
        max-width: 4.2in;
        margin-bottom: 0.16in;
      }
      .steps li {
        display: flex;
        align-items: center;
        gap: 0.12in;
        font-size: 14px;
        line-height: 1.35;
        color: ${INK};
        margin-bottom: 0.08in;
        text-align: left;
      }
      .step-number {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: ${QRS_ORANGE};
        color: #ffffff;
        font-size: 12px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .back-url {
        font-size: 34px;
        font-weight: 800;
        color: ${QRS_ORANGE};
        line-height: 1.1;
        margin-top: 0.04in;
      }
      .back-tagline {
        margin-top: auto;
        padding-top: 0.12in;
        font-size: 11px;
        color: #8a8178;
      }
    </style>
  </head>
  <body>
    <div class="page front">
      <div class="front-content">
        <div class="illustration">${PHONE_ILLUSTRATION_SVG}</div>
        <h1 class="headline">Your whole store. One QR code.</h1>
        <p class="subheadline">Set up in 60 seconds. Free to start.</p>
      </div>
      <p class="wordmark">${escapeHtml('my-qrs.co')}</p>
      <div class="qr-badge">
        <img src="${qrDataUri}" alt="QR code for my-qrs.co" />
      </div>
    </div>
    <div class="page back">
      <h2 class="back-heading">Here's how it works</h2>
      <ol class="steps">
        <li><span class="step-number">1</span><span>Upload your products</span></li>
        <li><span class="step-number">2</span><span>Get your shop link and QR code</span></li>
        <li><span class="step-number">3</span><span>Start selling</span></li>
      </ol>
      <p class="back-url">${escapeHtml('my-qrs.co')}</p>
      <p class="back-tagline">Built for makers. Loved by buyers.</p>
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

export async function generateSellerAcquisitionPostcardPdf(): Promise<Buffer> {
  const qrDataUri = await generateAcquisitionQrDataUri()
  const html = buildSellerAcquisitionPostcardHtml(qrDataUri)

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 576, height: 384, deviceScaleFactor: 2 },
    executablePath: await resolveExecutablePath(),
    headless: 'shell',
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      width: PAGE_WIDTH,
      height: PAGE_HEIGHT,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
