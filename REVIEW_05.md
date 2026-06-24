# REVIEW_05.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 5: FAQ page, QR code generation, postcard PDF generation, and dotell analytics instrumentation. These are the final V3 features before the build is considered shippable. The postcard route carries real infrastructure risk — Chromium cold starts on Vercel serverless are the single most likely silent failure point. Check the vercel.json overrides are present and scoped correctly. Confirm the FAQ is a hardcoded array with no DB dependency. Verify QR codes use `NEXT_PUBLIC_APP_URL`, not a hardcoded domain. A passing review means: postcard downloads work end-to-end in production, FAQ renders at `/faq`, analytics events fire without blocking user flows, and no new env vars are accidentally client-exposed.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed

- **Title:** QR Code, Postcard PDF, FAQ Page, and Seller Analytics Events
- **Number:** 5

---

### 2. Files Created

| File | Description |
|------|-------------|
| `src/lib/qr.ts` | Shop URL builder + deterministic QR PNG buffer and data URI via `qrcode`; uses `NEXT_PUBLIC_APP_URL`. |
| `src/lib/postcard-pdf.ts` | 4×6 HTML template → PDF via `@sparticuz/chromium` + `puppeteer-core`; dev fallback via `CHROMIUM_PATH` or macOS Chrome. |
| `src/lib/faq-data.ts` | Hardcoded `{ question, answer }[]` — no DB. |
| `src/services/analytics.service.ts` | `trackSellerEvent()` — POST to dotell when `DOTELL_API_URL` + `DOTELL_API_KEY` set; else console log. Never throws. |
| `src/app/api/qr/route.ts` | Public GET `?slug=` → PNG; slug validated via `isValidSlug`. |
| `src/app/api/postcard/route.ts` | Clerk POST `{ imageUrl }` → PDF download; validates image belongs to seller's published products. |
| `src/app/faq/page.tsx` | Public FAQ at `/faq`; imports `faqItems` from `faq-data.ts`. |
| `src/components/dashboard/postcard-download.tsx` | Client hero-image picker + POST to `/api/postcard` + browser download. |
| `vercel.json` | First project entry — `memory: 3008`, `maxDuration: 30` scoped to postcard route only. |

**Dependencies added:** `qrcode`, `@types/qrcode`, `@sparticuz/chromium`, `puppeteer-core`.

---

### 3. Files Modified

| File | What changed | Why |
|------|-------------|-----|
| `src/lib/dotell.ts` | Re-exports `trackSellerEvent` from `analytics.service.ts`. | Centralize analytics in service layer; preserve existing import path. |
| `src/app/onboarding/actions.ts` | `void trackSellerEvent` for `seller.signed_up` + `seller.onboarding_completed` after Seller create. | M5 analytics — both at Seller row creation per user decision (not at Stripe Connect). |
| `src/app/dashboard/page.tsx` | Loads published product images; renders `PostcardDownload`. | M5 dashboard postcard surface. |
| `src/app/api/webhooks/stripe/route.ts` | Import migrated to `analytics.service` (existing `order.placed` call unchanged). | Service-layer analytics. |
| `src/app/api/orders/[id]/accept/route.ts` | Import migrated (existing `order.accepted` call unchanged). | Same. |
| `src/app/api/orders/[id]/decline/route.ts` | Import migrated (existing `order.declined` call unchanged). | Same. |
| `src/services/stripeConnect.service.ts` | Import migrated (existing `stripe.connected` on first `charges_enabled` sync unchanged). | Same. |
| `next.config.ts` | Added `serverExternalPackages` for chromium + puppeteer-core. | Next.js bundling compatibility for PDF route. |
| `.env.example` | Added `DOTELL_API_URL`, `DOTELL_API_KEY`, `CHROMIUM_PATH`. | Document M5 env vars. |
| `MILESTONE_05.md` | Filled §11 Assumptions Made and §12 Open Questions. | Milestone documentation per directive. |

**Explicitly not modified (per user + M5 §6):** landing page (`src/app/page.tsx`), storefront (`src/app/[slug]/`), middleware (FAQ already public via default Clerk behavior), schema/migrations, order/notification/email services, fulfill route.

**Deferred per user:** `product.published` analytics — no V3 publish path exists.

---

### 4. Assumptions Made

- **Assumption 1:** V3 has **no `HeroImage` model or Seller hero field**. Postcard hero comes from **seller-selected published product image** via `PostcardDownload` picker (user-approved).
- **Assumption 2:** `seller.signed_up` and `seller.onboarding_completed` both fire **at Seller row creation** in onboarding — not when Stripe Connect completes (user-approved).
- **Assumption 3:** `product.published` dotell event **deferred** — no working V3 product publish UI/route; event will wire when publish path ships (user-approved).
- **Assumption 4:** Dotell HTTP API is `POST ${DOTELL_API_URL}/events` with `Authorization: Bearer ${DOTELL_API_KEY}` and body `{ userId, event, properties }`. When env vars unset, **console log stub** only.
- **Assumption 5:** Local PDF dev uses macOS Chrome at default path unless `CHROMIUM_PATH` is set; production uses `@sparticuz/chromium` executable.
- **Assumption 6:** FAQ is **platform-wide hardcoded content** only — no dashboard link, no landing page changes (user-approved).
- **Assumption 7:** `vercel.json` function path uses `src/app/api/postcard/route.ts` to match this repo's `src/` directory layout.

---

### 5. Open Questions

- **Question 1 (resolved):** Hero image source — product image picker from published products (user-approved).
- **Question 2 (resolved):** When to fire `seller.onboarding_completed` — at Seller create, not Stripe Connect (user-approved).
- **Question 3 (resolved):** `product.published` — deferred until V3 product publish path exists (user-approved).
- **Question 4:** Dotell API contract (`/events` path, payload shape) is inferred from env var names — confirm with dotell provider before production.
- **Question 5:** Full `npm run build` still fails on legacy V2 routes; M5-specific files typecheck clean.
- **Question 6:** Postcard PDF local testing on non-macOS dev machines requires explicit `CHROMIUM_PATH`.
- **Question 7:** V3 product CRUD still broken — postcard testing requires manual DB rows with `published: true` and `images[]`.

---

### 6. Risks

| Risk | Severity | Mitigation | Needs developer action? |
|------|----------|------------|-------------------------|
| Chromium cold start / timeout on Vercel | **High** | `vercel.json`: 3008 MB, 30s max on postcard route only | Yes — verify PDF download in production deploy |
| Local PDF fails without Chrome/Chromium | Medium | `CHROMIUM_PATH` env + documented macOS default | Yes on Linux/Windows dev |
| Hero image external URL load in PDF | Medium | `waitUntil: 'load'` in puppeteer; hero must be reachable from server | Yes — use public Cloudinary URLs |
| Dotell misconfiguration silent | Low | Console log fallback when keys unset | No until production analytics needed |
| QR URL wrong in staging | Medium | Requires `NEXT_PUBLIC_APP_URL` per environment | Yes — set per deploy |
| Analytics blocking user flow | Low | Fire-and-forget `void` + try/catch in service | No |
| Postcard route Prisma inline query | Low | Scoped `where: { sellerId, published: true }` | No — acceptable for image ownership check |

---

### 7. Layer Violations

**Minor — acceptable for M5:**

- `src/app/api/postcard/route.ts` contains inline Prisma query (`sellerOwnsImageUrl`) for image ownership validation rather than a product service helper.
- `src/app/dashboard/page.tsx` queries published product images via Prisma directly (same pattern as pre-M5 dashboard data loading).

No Chromium/QR imports in client components. Analytics HTTP calls only in `analytics.service.ts`.

---

### 8. Engineering Rule Violations

| Rule | Status | Notes |
|------|--------|-------|
| QR uses `NEXT_PUBLIC_APP_URL`, not hardcoded domain | **Pass** | `lib/qr.ts` |
| FAQ hardcoded array, no DB | **Pass** | `faq-data.ts` |
| `trackSellerEvent` fire-and-forget, never throws | **Pass** | try/catch + console log fallback |
| No secrets in client bundle | **Pass** | Dotell keys server-only |
| Postcard PDF not stored/emailed | **Pass** | Streamed response only |
| Clerk auth on postcard POST | **Pass** | 401 without session/seller |
| QR route public | **Pass** | |
| vercel.json scoped to postcard only | **Pass** | No global overrides |
| Landing page untouched | **Pass** | User directive |
| Tenant-scoped product query on postcard | **Pass** | `where: { sellerId, published: true }` |
| No `product.published` on create flow | **Pass** | Event deferred entirely |

**MILESTONE_05-specific notes:**

| Item | Status | Notes |
|------|--------|-------|
| `product.published` analytics | **Deferred** | User-approved — no V3 publish path |
| `seller.onboarding_completed` at Stripe Connect | **Bent — user-approved** | Fires at Seller create instead |
| Dashboard FAQ link | **Skipped** | FAQ page only; landing untouched |

---

### 9. Ready to Proceed

- **Decision:** yes
- **Reasoning:** M5 deliverables complete: public `/faq`, public `/api/qr`, authenticated `/api/postcard` with product image picker, dashboard `PostcardDownload`, `analytics.service.ts` with dotell wiring at all available call sites, `vercel.json` for postcard memory/timeout. `product.published` intentionally deferred. Landing page unchanged. M5 files typecheck clean.

V3 feature milestones (M1–M5) are complete. Remaining work is outside M5 scope: legacy V2 route cleanup/build fixes, V3 product CRUD/publish UI, per-seller Telegram, and production verification of postcard PDF on Vercel.
