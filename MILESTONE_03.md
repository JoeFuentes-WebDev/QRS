# MILESTONE_03.md

## SECTION 1 — HUMAN SUMMARY

Milestone 3 rebuilds the Stripe-powered checkout flow for V3. The core change is replacing all V2 per-seller Stripe key paths with destination charges using the platform Stripe account and a 2% `application_fee_amount`. The storefront checkout gate enforces `stripeConnectOnboarded` before rendering the pay button. The Stripe webhook handler is rewritten for V3 schema (OrderItem, stock decrement, Resend confirmation email) with hard signature verification and idempotency guard. This milestone is the dependency for order management (M4) and must land before any real transactions can occur. Medium-high session complexity — multiple files touch Stripe, Prisma, and email in a coordinated sequence.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Milestone 3 — V3 Checkout, Destination Charges, and Stripe Webhook**

---

### 2. What This Milestone Builds

**Scope is exactly the following — nothing more:**

**A. Storefront checkout gate (`/[slug]` and `/[slug]/product/[id]`)**
- Before rendering a pay/checkout button, read `seller.stripeConnectOnboarded` from the DB.
- If `false`: render a disabled button with the label `"Not accepting payments yet"`. Shop remains fully browsable.
- If `true`: render an active checkout button that initiates Stripe Checkout.

**B. Checkout API route (`/api/checkout/session`)**
- Clerk is NOT required — this is a guest buyer flow.
- Accepts `{ items: [{ productId, quantity }], sellerId }` in the request body.
- Validates that the seller exists and `stripeConnectOnboarded === true`. Returns `400` if not.
- Validates that each product exists, belongs to `sellerId`, and is `published === true`. Returns `400` on any mismatch.
- Creates a Stripe Checkout Session using **destination charge** model:
  - `payment_method_types: ['card']`
  - `mode: 'payment'`
  - `line_items` built from product name, price, quantity
  - `payment_intent_data.application_fee_amount` = 2% of session total (integer cents, rounded down)
  - `payment_intent_data.transfer_data.destination` = `seller.stripeConnectAccountId`
  - `customer_email` collection enabled (Stripe built-in field)
  - `success_url` and `cancel_url` constructed from `NEXT_PUBLIC_APP_URL`
  - `metadata` must include `sellerId` and stringified `items` array for webhook use
- Returns `{ url: checkoutSession.url }` to the client.

**C. Stripe webhook handler (`/api/webhooks/stripe`)**
- Rewrite the existing V2 handler for V3 schema.
- Hard signature verification via `stripe.webhooks.constructEvent` using `STRIPE_WEBHOOK_SECRET`. Return `400` on any failure — no processing.
- Handle `checkout.session.completed` only:
  - Idempotency guard: check if `Order` with `stripePaymentIntentId` already exists. If yes, return `200` and exit.
  - Extract `sellerId`, `items`, `buyerEmail` from session metadata and `customer_details.email`.
  - Create `Order` (status `PENDING`) with nested `OrderItems` (quantity + priceSnapshot from Stripe line items).
  - Decrement stock for each product atomically inside a Prisma `$transaction`.
  - Send buyer confirmation email via Resend (plain order summary — product names, quantities, total). Fire-and-forget: log error on failure, do not throw.
  - Fire dotell `order.placed` event for the seller (console log, same as M2 pattern).
- Return `200` on success.

**D. Storefront UI wiring**
- The buy/checkout button on `/[slug]` and `/[slug]/product/[id]` calls `/api/checkout/session` with the product(s) and `sellerId`, then redirects the buyer to `session.url`.
- A `success` page at `/[slug]/success` reads query params from Stripe return and shows a plain "Order received" confirmation message (no DB query needed — Stripe already has buyer email).
- A `cancel` page at `/[slug]/cancel` shows a plain "Checkout cancelled" message with a link back to the shop.

---

### 3. Why This Milestone Comes Next

M2 completed Stripe Connect Express onboarding — sellers now have `stripeConnectAccountId` and `stripeConnectOnboarded` in the DB. M3 is the first milestone that uses those values to actually move money. Without M3, no transaction can occur and M4 (order management dashboard) has no data to display. The dependency chain is: **schema (M1) → Connect onboarding (M2) → checkout + webhook (M3) → order management (M4)**.

The full `npm run build` currently fails because V2 checkout and webhook routes reference removed `getStripeClient`. M3 fixes that directly.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/services/checkout.service.ts` | Builds Stripe Checkout Session for destination charge; validates seller and products; returns session URL. All Stripe + Prisma logic lives here — not in the route handler. |
| `src/services/order.service.ts` | Creates `Order` with nested `OrderItems` inside a Prisma `$transaction`; decrements stock atomically. Used by webhook handler only. |
| `src/services/email.service.ts` | Sends buyer order confirmation email via Resend. Fire-and-forget wrapper — catches and logs, never throws. |
| `src/app/[slug]/success/page.tsx` | Static-ish server page shown after successful Stripe checkout. Reads `?session_id` from URL (optional — display only). Shows "Order received" message and link back to shop. |
| `src/app/[slug]/cancel/page.tsx` | Static server page shown after cancelled Stripe checkout. Shows "Checkout cancelled" message and link back to shop. |

---

### 5. Files to Modify

| Path | What changes | Why |
|------|-------------|-----|
| `src/app/api/checkout/session/route.ts` | **Full rewrite** — replace V2 per-seller Stripe key logic with V3 platform destination charge via `checkout.service.ts`. Guest flow, no Clerk auth. | V2 route calls removed `getStripeClient`; breaks build. |
| `src/app/api/webhooks/stripe/route.ts` | **Full rewrite** — V3 signature verification, idempotency guard, `order.service.ts` for Order/OrderItem creation, stock decrement, Resend email, dotell event. | V2 handler references removed schema fields and `getStripeClient`. |
| `src/app/[slug]/page.tsx` | Add `stripeConnectOnboarded` check on seller fetch. Pass connect status to checkout button component. Render disabled `"Not accepting payments yet"` button when false. | Gate is required before any checkout can be initiated. |
| `src/app/[slug]/product/[id]/page.tsx` | Same `stripeConnectOnboarded` gate as storefront index — disabled button when seller not onboarded. | Consistent checkout gate across all buyer-facing entry points. |
| `src/lib/stripe.ts` | Confirm singleton export `stripe` is used — no changes expected, but verify `STRIPE_SECRET_KEY` singleton is the only export. Flag if V2 residue remains. | M2 already rewrote this; confirm clean for M3 Checkout Session creation. |

---

### 6. Files to Leave Untouched

- `prisma/schema.prisma` — no schema changes in M3
- All migration files under `prisma/migrations/`
- `src/lib/prisma.ts`
- `src/lib/dotell.ts`
- `src/services/seller.service.ts`
- `src/services/stripeConnect.service.ts`
- `src/app/api/stripe/connect/route.ts`
- `src/app/api/stripe/connect/sync/route.ts`
- `src/app/dashboard/stripe/return/page.tsx`
- `src/app/dashboard/stripe/refresh/page.tsx`
- `src/components/dashboard/StripeConnectCard.tsx`
- `src/components/dashboard/dashboard-header.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/onboarding/actions.ts`
- `src/components/onboarding/onboarding-form.tsx`
- `middleware.ts`
- `next.config.ts`
- `.cursorrules`
- `vercel.json` (does not exist yet — do not create in M3)
- `src/app/dashboard/settings/` — broken, acknowledged, not touched in M3
- Any V2 component files not being rendered (leave on disk per M2 agreement)

---

### 7. Layer Rules (Three Most Relevant)

1. **Service layer owns all external API calls.** `checkout.service.ts` calls Stripe. `order.service.ts` calls Prisma. `email.service.ts` calls Resend. Route handlers call services only — no Stripe SDK, no Prisma client, no Resend client imported directly in route files.

2. **Every Prisma query touching tenant data includes `where: { sellerId }`.** Product lookups in `checkout.service.ts` must include `where: { id: productId, sellerId, published: true }`. Order creation in `order.service.ts` must write `sellerId` on the `Order` record. No unscoped queries.

3. **No `NEXT_PUBLIC_*` prefix on server-only secrets.** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-only. `NEXT_PUBLIC_APP_URL` is the only Stripe-related public env var (used for `success_url`, `cancel_url`, Connect redirect URLs). Do not introduce any new public env vars.

---

### 8. Engineering Rules

**DO:**
- Use `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET` — hard requirement, return `400` on failure, no fallthrough.
- Check for existing `Order` with `stripePaymentIntentId` before creating — idempotency is mandatory. Return `200` on duplicate detection.
- Use `prisma.$transaction([...])` for Order creation + stock decrements together — they must be atomic.
- Snapshot product price into `OrderItem.priceSnapshot` from Stripe line item `unit_amount` (cents) — not re-fetched from DB.
- Set `application_fee_amount` = `Math.floor(sessionTotalCents * 0.02)` — integer cents, round down, no exceptions.
- Set `payment_intent_data.transfer_data.destination` = `seller.stripeConnectAccountId`.
- Build `success_url` and `cancel_url` from `process.env.NEXT_PUBLIC_APP_URL` — never hardcode domain.
- Wrap Resend call in try/catch — log error, do not re-throw. Order creation must succeed even if email fails.
- Read the raw request body for webhook signature verification using `req.text()` before any JSON parsing.
- Validate `seller.stripeConnectOnboarded === true` in `checkout.service.ts` before creating any Stripe session.
- Include `sellerId` and `items` in Stripe Checkout Session `metadata` so the webhook can reconstruct the order without a DB lookup on the session.

**DO NOT:**
- Do not import `stripe` (the Stripe SDK instance) directly in route handlers — use service functions only.
- Do not use `getStripeClient` anywhere — it was removed in M2 and must not be resurrected.
- Do not apply a per-seller Stripe key — platform singleton only.
- Do not call Prisma from webhook route handler directly — all DB operations go through `order.service.ts`.
- Do not add Clerk auth to `/api/checkout/session` or `/api/webhooks/stripe` — both are public routes.
- Do not implement refund logic — out of scope for M3.
- Do not implement order management UI — that is M4.
- Do not add shipping rate calculation — Shippo integration is M6.
- Do not create `vercel.json` — it belongs in M5 (postcard route).
- Do not modify the Prisma schema — no new fields, no new models.
- Do not fetch buyer email from the DB — capture it from `session.customer_details.email` in the webhook.
- Do not store `session_id` or do any DB query in the `/[slug]/success` page — display only.

---

### 9. Ambiguity Protocol

If any of the following conditions arise, **stop, do not guess, and record the question in §12 Open Questions**:

- The existing `/api/checkout/session/route.ts` path does not exist (V2 may have used a different path) — record the actual path found and wait.
- The existing `/api/webhooks/stripe/route.ts` path does not exist or is at a non-standard path — record and wait.
- `src/app/[slug]/page.tsx` does not currently render any checkout/buy button at all (pure display only in V2 state) — record what UI exists and what changes are safe to make without breaking the browse flow.
- Any Prisma model field names differ from the V3 schema spec (e.g., `stripePaymentIntentId` vs `stripeSessionId`, `priceSnapshot` vs `unitPrice`) — record the actual field names from `schema.prisma` and use those exactly.
- `Resend` is not yet installed or has no initialized client in the codebase — record and ask whether to add the package and a minimal client file.
- `OrderItem` model does not exist in the current schema — stop immediately, record, and do not proceed with order creation until M3 has confirmed schema support.

---

### 10. What Is NOT in This Milestone

- No shipping rate calculation (Shippo — M6)
- No order management dashboard UI (M4)
- No Telegram order notifications (M4)
- No seller-facing order accept/decline actions (M4)
- No refund UI or refund API (not in V3 scope)
- No `vercel.json` creation (M5)
- No FAQ page (M5)
- No QR code or postcard generation (M5)
- No dotell analytics beyond console-log stub (M5)
- No PostHog buyer event instrumentation (separate concern, not blocking M3)
- No changes to `/dashboard/settings` (acknowledged broken, deferred)
- No changes to product CRUD or image upload
- No Prisma schema modifications
- No admin routes
- No multi-product cart UI (the storefront may already have or lack a cart — only wire the checkout API call and gate, do not redesign the storefront UI)

---

### 11. Assumptions Made

- **Assumption 1:** Idempotency key is `stripeSessionId` (session.id), per ONBOARDING.md — not `stripePaymentIntentId` as written in MILESTONE_03 §8 (treated as typo). Both fields are stored on the Order; duplicate guard uses `stripeSessionId` only.
- **Assumption 2:** Checkout route path is **`/api/checkout/session`** (new), not `/api/[slug]/checkout`. Legacy slug route returns `410` with pointer to the new path. `FavoritesSummary` updated to POST `{ sellerId, items }`.
- **Assumption 3:** No `/[slug]/product/[id]` page exists — checkout gate applied only on `FavoritesSummary` (sole checkout entry point in swipe UI).
- **Assumption 4:** Minimal storefront V3 fixes included (user-approved): `src/lib/shop-product.ts` mapper (`published` + `stock > 0`, cents → display dollars, `images[0]` → `imageUrl`); updated `/api/products`, `/api/categories`; hero GET returns `[]` (HeroImage model removed).
- **Assumption 5:** `constructStripeWebhookEvent` and `getCheckoutSessionLineItems` live in `checkout.service.ts` so route handlers do not import the Stripe SDK directly.
- **Assumption 6:** Webhook does not call legacy `routeFulfillment` / Telegram — out of M3 scope (M4). Buyer Resend email only.
- **Assumption 7:** Prices validated server-side from DB (cents); client sends `productId` + `quantity` only.
- **Assumption 8:** `application_fee_amount = Math.floor(sessionTotalCents * 0.02)` on destination charge via platform Checkout Session.

---

### 12. Open Questions

- **Question 1 (resolved):** Checkout path was `/api/[slug]/checkout` in V2 — created `/api/checkout/session` per approved plan.
- **Question 2 (resolved):** No product detail page — gate on cart checkout only.
- **Question 3 (resolved):** Storefront V3 fixes included for testability.
- **Question 4 (resolved):** Idempotency uses `stripeSessionId` per ONBOARDING.md.
- **Question 5:** Full `npm run build` still fails on unrelated V2 routes (dashboard actions, fulfillment, settings, cron, seed). M3-specific files typecheck clean in isolation.
- **Question 6:** Stripe webhook must be registered in Stripe Dashboard pointing to `/api/webhooks/stripe` with `STRIPE_WEBHOOK_SECRET` — developer must confirm test-mode setup for local testing (Stripe CLI `stripe listen --forward-to`).
- **Question 7:** No published products in dev DB = empty storefront. Manual product insert or M3+ dashboard restore required to test checkout end-to-end.
- **Question 8:** `src/lib/resend.ts` remains V2 (seller notification) and broken — M3 uses new `email.service.ts` for buyer confirmation only.