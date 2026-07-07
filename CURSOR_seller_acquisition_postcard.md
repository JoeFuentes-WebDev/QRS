# Cursor Prompt — Seller Acquisition Postcard

## What to build

Add a seller acquisition postcard PDF to the existing postcard pipeline. This is a **static marketing postcard** — not personalized per seller. It is designed to be handed to vendors at farmers markets and craft fairs to recruit them as QRS sellers.

## API Route

Create a new route at `src/app/api/postcard/seller-acquisition/route.ts`.

- GET request, no authentication required (public route)
- Returns a PDF file with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="join-qrs.pdf"`
- Uses the same `@sparticuz/chromium` + puppeteer-core pipeline as the existing postcard route
- Same memory/timeout config as existing postcard route in `vercel.json`

## PDF Dimensions

4×6 inches horizontal, print-ready at 300 DPI equivalent. Use the same dimensions as the existing postcard.

## Design — Front Side

Full bleed warm orange background (`#FF6B35`).

Layout top to bottom, centered:

- **Illustration area** — clean SVG line art of a hand holding a phone with a QR code on screen, or a simple minimal market stall icon. White lines on orange background. Keep it simple and charming — 80px tall max.
- **Headline** — large bold white text: "Your whole store. One QR code."
- **Subheadline** — smaller white text: "Set up in 5 minutes. Free to start."
- **QR code** — bottom right corner, white square background with padding, QR code pointing to `https://my-qrs.co`. Generate using the `qrcode` npm package already installed.
- **Wordmark** — bottom left, white text: "my-qrs.co", small

## Design — Back Side

Render as a second page in the same PDF.

Background: warm cream (`#FFF0E8`)

Layout:

- **Heading** — orange bold: "Here's how it works"
- **3 steps** — each on its own line with a simple number or icon + one line of text:
  1. Upload your products
  2. Get your shop link and QR code
  3. Start selling
- **URL** — large prominent orange text: `my-qrs.co`
- **Tagline** — small muted text at bottom center: "Built for makers. Loved by buyers."

## Dashboard

Add a "Download seller postcard" link or button somewhere in the `/admin` area or a new `/api/postcard/seller-acquisition` direct URL. This does not need to be in the seller dashboard — it is for Joe (platform owner) to download and print.

## Do not touch

- Existing buyer postcard route (`/api/postcard`)
- Existing postcard PDF generation logic
- Any seller dashboard components
- Schema or migrations
- Any other routes or services

## Notes

- Use inline HTML/CSS for the PDF template — same pattern as existing postcard
- QR code should always point to `https://my-qrs.co` — hardcoded, not dynamic
- No seller data, no Clerk auth, no Prisma queries needed — this is fully static
- If the SVG illustration is complex, use a simple geometric placeholder (orange circle with a phone icon) rather than a detailed illustration — keep it clean
