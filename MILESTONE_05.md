# MILESTONE_05.md

## SECTION 1 — HUMAN SUMMARY

This milestone builds the QR code generation endpoint, the postcard PDF generator, the `/faq` page, and the seller-facing dotell analytics events. M5 is the final feature-complete milestone of V3 — it ships the downloadable postcard from the dashboard, the platform FAQ, and wires seller-side analytics events (dotell). Complexity is medium-high: the Chromium PDF step carries the most risk (cold start, memory). A `vercel.json` is created here for the first time.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Milestone 5 — QR Code, Postcard PDF, FAQ Page, and Seller Analytics Events**

---

### 2. What This Milestone Builds

**A. QR Code generation API route**
- `GET /api/qr?slug=[slug]` — generates a deterministic base64 PNG QR code pointing to `${NEXT_PUBLIC_APP_URL}/[slug]`. No auth required. No storage. Returns PNG bytes directly (or base64 string, to be consumed by the postcard route).

**B. Postcard PDF generation API route**
- `POST /api/postcard` — Clerk-authenticated. Pulls seller's hero image from Cloudinary, generates QR code, composites hero image + store name + QR + tagline into a 4×6 print-ready PDF using `@sparticuz/chromium`. Returns PDF as a direct download (`Content-Disposition: attachment`). No storage. No email delivery.

**C. Dashboard postcard download button**
- New UI element in the seller dashboard that triggers the postcard download. Seller selects (or confirms) their hero image, clicks Download Postcard, and the browser downloads the PDF.

**D. FAQ page**
- `GET /faq` — public, no auth. Hardcoded array of Q&A pairs rendered as a static page. Platform-wide, same content for all visitors. No DB model. No admin CRUD.

**E. Seller-side dotell analytics events**
- Wire the following seller events at the correct call sites (already enumerated in the project model):
  - `seller.signed_up` — fired on first Seller record creation (onboarding start)
  - `seller.onboarding_completed` — fired when all onboarding gates are satisfied
  - `product.published` — fired when a product's `published` flag is set to `true`
  - `order.placed` — fired in the Stripe webhook on `checkout.session.completed`
  - `order.accepted` — fired in the accept route handler
  - `order.declined` — fired in the decline route handler
  - `stripe.connected` — fired in the Stripe Connect return handler

---

### 3. Why This Comes Next

M4 is complete and reviewed. M5 is the last V3 feature milestone. Its dependencies are satisfied:
- Seller record exists (M1 schema, M2 onboarding) — needed for postcard seller data and analytics identity.
- Orders exist and status transitions are wired (M3–M4) — `order.placed`, `order.accepted`, `order.declined` fire at already-built call sites.
- Stripe Connect return handler exists (M3) — `stripe.connected` event fires there.
- Product publish path exists (prior dashboard work) — `product.published` event fires there.
- `vercel.json` does not yet exist — M5 creates it for the first time (postcard route memory/timeout overrides).

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/app/api/qr/route.ts` | GET handler — generates QR PNG for a given `?slug=` param. No auth. Returns `image/png` response. Uses `qrcode` npm package. |
| `src/app/api/postcard/route.ts` | POST handler — Clerk-authenticated. Composites hero image + store name + QR + tagline into a 4×6 PDF via `@sparticuz/chromium`. Returns PDF download. |
| `src/app/faq/page.tsx` | Public static FAQ page. Hardcoded Q&A array. No DB. No auth. Renders at `/faq`. |
| `src/services/analytics.service.ts` | Thin wrapper around dotell HTTP API. Exports `trackSellerEvent(clerkUserId, event, properties?)`. Fire-and-forget. Never throws. |
| `src/components/dashboard/postcard-download.tsx` | Client component — hero image selector/confirmer + Download Postcard button that POSTs to `/api/postcard` and triggers browser download. |
| `src/lib/faq-data.ts` | Hardcoded export of FAQ Q&A pairs (`{ question: string; answer: string }[]`). |
| `vercel.json` | First entry — scopes `memory: 3008` and `maxDuration: 30` to `app/api/postcard/route.ts` only. |

---

### 5. Files to Modify

| Path | What Changes | Why |
|------|-------------|-----|
| `src/app/api/orders/[id]/accept/route.ts` | Add `void trackSellerEvent(...)` call for `order.accepted` after status update. | M5 analytics wiring — already-built call site. |
| `src/app/api/orders/[id]/decline/route.ts` | Add `void trackSellerEvent(...)` call for `order.declined` after status update. | M5 analytics wiring — already-built call site. |
| `src/app/api/webhooks/stripe/route.ts` | Add `void trackSellerEvent(...)` call for `order.placed` after order creation on `checkout.session.completed`. | M5 analytics wiring — already-built call site. |
| `src/app/dashboard/stripe/return/page.tsx` (or route handler if it exists) | Add `void trackSellerEvent(...)` call for `stripe.connected` on successful return. | M5 analytics wiring — Connect return handler already exists from M3. |
| `src/app/dashboard/page.tsx` | Add Postcard Download card/link pointing to `/dashboard/postcard` or render `PostcardDownload` component inline. Add FAQ link in nav/footer if appropriate. | M5 dashboard surface for postcard feature. |
| `src/app/onboarding/page.tsx` (or the server action / API route that creates the Seller record) | Add `void trackSellerEvent(...)` for `seller.signed_up` on Seller record creation; `seller.onboarding_completed` when all gates pass. | M5 analytics wiring — onboarding call sites. |
| `src/app/api/products/[id]/publish/route.ts` or equivalent product publish path | Add `void trackSellerEvent(...)` for `product.published` when `published` is set to `true`. | M5 analytics wiring — product publish call site. |

> **Note on "modify" targets:** If the product publish path or Stripe Connect return handler file paths differ from the above, Cursor must locate the correct existing file and modify it. Do not create duplicate route files.

---

### 6. Files to Leave Untouched

- `src/app/api/webhooks/stripe/route.ts` — **only** add the `order.placed` analytics call; do not alter signature verification, idempotency logic, order creation, stock decrement, or notification call.
- `src/services/order.service.ts` — no changes.
- `src/services/notification.service.ts` — no changes.
- `src/app/api/orders/[id]/fulfill/route.ts` — no analytics event on fulfill (per M4 spec); do not modify.
- `src/app/dashboard/orders/page.tsx` — no changes.
- `src/app/dashboard/orders/[id]/page.tsx` — no changes.
- `src/app/api/orders/[id]/accept/route.ts` — **only** add the analytics call; do not alter auth, status logic, or error handling.
- `src/app/api/orders/[id]/decline/route.ts` — **only** add the analytics call; do not alter auth, status logic, or error handling.
- All schema files (`prisma/schema.prisma`) — no changes.
- All migration files — no changes.
- `src/services/email.service.ts` — no changes.
- `src/middleware.ts` — no changes (FAQ is already public per Clerk config; if `/faq` is not in the public routes list, add it — this is the only permitted touch).
- `src/lib/telegram.ts` — no changes.
- All storefront pages (`src/app/[slug]/`) — no changes.
- `src/components/dashboard/order-actions.tsx` — no changes.
- `src/components/dashboard/order-status-badge.tsx` — no changes.

---

### 7. Layer Rules Reminder

1. **Service layer owns all external calls.** `analytics.service.ts` owns all dotell HTTP calls. Route handlers and page server actions call `trackSellerEvent(...)` — they never construct dotell HTTP requests inline.
2. **Postcard route is server-only.** `@sparticuz/chromium` and `qrcode` run only in the API route handler. No Chromium or QR imports in client components. `PostcardDownload` is a client component that fetches from the API — it never imports or calls generation logic directly.
3. **No secrets in client bundle.** `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, Cloudinary API secret, and any dotell API key are server-only. `NEXT_PUBLIC_APP_URL` is the only env var the QR route and postcard route may reference on the client side (for URL construction only).

---

### 8. Engineering Rules

**DO:**
- Use `qrcode` npm package for QR generation. Output: base64 PNG. Deterministic — same slug always produces same QR.
- Configure `vercel.json` with `functions` key scoped to `app/api/postcard/route.ts` only — `memory: 3008`, `maxDuration: 30`. No global overrides.
- Make `trackSellerEvent` fire-and-forget (`void` call, wrapped in try/catch inside the service). It must never throw or block the primary response.
- Use `NEXT_PUBLIC_APP_URL` as the base URL for QR code target (`${NEXT_PUBLIC_APP_URL}/[slug]`). Never hardcode `my-qrs.co`.
- FAQ Q&A pairs live in `src/lib/faq-data.ts` as a plain exported array. The page imports and renders this array — no DB query, no fetch, no API route.
- Return postcard PDF with headers: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="postcard-[slug].pdf"`.
- Clerk-authenticate the postcard POST route via `auth()` from `@clerk/nextjs/server`. Return 401 if no session.
- The QR route (`/api/qr`) is public — no auth required. It only accepts a `slug` query param and returns a PNG.

**DO NOT:**
- Do not store the generated postcard PDF in Cloudinary or any file system.
- Do not email the postcard PDF to the seller.
- Do not implement per-product or per-event QR codes — one QR per shop slug only.
- Do not add font/color customization to the postcard template — fixed template only.
- Do not add seller-facing analytics dashboards or any UI surface for analytics data.
- Do not add a `telegramChatId` field to the Seller schema — that is a future milestone.
- Do not add pagination anywhere in M5.
- Do not modify the FAQ to be DB-driven — hardcoded array only.
- Do not add a dotell event for `order.fulfilled` — it is not in the V3 event list.
- Do not throw errors from `trackSellerEvent` — swallow and log only.
- Do not add `product.published` analytics to the create-product flow — only on explicit publish action (setting `published: true`).

---

### 9. Ambiguity Protocol

If any of the following are unclear, **stop and record the question in §12 before writing code**:

- The exact file path for the existing Stripe Connect return handler (M3 artifact) — locate it before modifying.
- The exact file path for the product publish action — locate it before modifying.
- The dotell API endpoint URL and authentication mechanism — if no `DOTELL_API_KEY` or dotell base URL env var is documented in the codebase, record this as an open question and implement `analytics.service.ts` with a no-op stub that logs to console until the key is configured.
- Whether `@sparticuz/chromium` is already in `package.json` — if not, add it. Check before assuming.
- Whether `qrcode` is already in `package.json` — if not, add it. Check before assuming.
- The hero image field on the Seller or Product model — the postcard uses "seller's hero image." If there is no `heroImage` field on the Seller model, record this as an open question and use the first image from the seller's first published product as a fallback, or allow the seller to pick from their product images in `PostcardDownload`.

---

### 10. What Is NOT in This Milestone

- Per-seller Telegram chat ID on schema (`telegramChatId`) — deferred to a later milestone.
- Seller-facing analytics dashboard or any UI that displays event data.
- Per-product or per-event QR codes.
- Postcard design customization (colors, fonts).
- PDF email delivery via Resend.
- Cloudinary storage of generated postcard composite.
- Buyer-side PostHog events (already wired in V2/storefront — do not re-wire or alter).
- Refund UI or REFUNDED status transition.
- Pagination on any list page.
- Admin CRUD for FAQ.
- `order.fulfilled` analytics event.
- Shippo shipping rate integration (separate milestone or already complete).
- Any schema migrations.
- Product CRUD fixes for legacy V2 routes.

---

### 11. Assumptions Made

- **Hero image:** No Seller `heroImage` or HeroImage model in V3. Postcard uses seller-selected image from **published product `images[]`** via dashboard picker (user-approved).
- **Onboarding analytics:** `seller.signed_up` and `seller.onboarding_completed` both fire when the **Seller row is created** in `onboarding/actions.ts` — not when Stripe Connect completes (user-approved).
- **`product.published`:** Deferred — no V3 product publish route/UI; event will wire when publish path exists (user-approved).
- **Dotell:** `POST ${DOTELL_API_URL}/events` with Bearer token; console log when env vars unset.
- **Local PDF:** Dev uses `CHROMIUM_PATH` or default macOS Chrome; production uses `@sparticuz/chromium`.
- **FAQ / landing:** FAQ page at `/faq` only; **landing page not modified** (user-approved).
- **vercel.json path:** `src/app/api/postcard/route.ts` (repo uses `src/` directory).

---

### 12. Open Questions

- **Dotell API contract:** Payload shape and `/events` path inferred — confirm with dotell provider before production.
- **Product publish:** When V3 product CRUD ships, wire `product.published` at explicit publish action.
- **Build:** Full `npm run build` still blocked by legacy V2 routes; M5 files typecheck in isolation.
- **Postcard prod test:** Requires Vercel deploy with 3008 MB function — cold start behavior unverified locally.
- **Non-macOS dev:** Set `CHROMIUM_PATH` for local PDF generation.