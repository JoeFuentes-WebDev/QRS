# REVIEW_03.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 3. Cursor has completed the milestone and is self-auditing before you proceed. Read the Files Created and Files Modified sections to confirm the deliverables match what M3 required. Pay close attention to Risks and Layer Violations — any entry there needs your sign-off before M4 begins. A passing review means: no layer violations, no engineering rule violations, all open questions either answered or explicitly deferred, and Cursor has flagged anything that needs your eyes rather than hiding it.

---

## SECTION 2 — CURSOR DIRECTIVE

Complete every field honestly. Do not leave a field blank — write "None" if there is nothing to report. Do not guess; if you are uncertain, say so in Open Questions.

---

### 1. Milestone Completed

**Title:** V3 Checkout, Destination Charges, and Stripe Webhook  
**Number:** M3

---

### 2. Files Created

| File | Description |
|------|-------------|
| `src/services/checkout.service.ts` | Validates seller/products, creates Stripe Checkout Session (destination charge, 2% fee), verifies webhook signatures, retrieves expanded line items for order creation. |
| `src/services/order.service.ts` | Idempotency check by `stripeSessionId`; atomic `$transaction` for Order + OrderItems + stock decrement. |
| `src/services/email.service.ts` | Buyer order confirmation via Resend — try/catch, logs errors, never throws. |
| `src/app/api/checkout/session/route.ts` | Guest `POST` — accepts `{ sellerId, items }`, returns `{ url }`. Delegates to `checkout.service.ts`. |
| `src/app/[slug]/cancel/page.tsx` | Static “Checkout cancelled” page with link back to shop. |
| `src/lib/shop-product.ts` | V3→storefront product mapper and `storefrontProductWhere` (`published` + `stock > 0`). *(User-approved prerequisite for testable storefront — not in M3 §4 but required.)* |

**Note:** M3 §4 listed `src/app/[slug]/success/page.tsx` as “create”; file existed from V2 — **rewritten** in place (see §3).

---

### 3. Files Modified

| File | What Changed | Why |
|------|--------------|-----|
| `src/app/api/webhooks/stripe/route.ts` | Full rewrite — platform `STRIPE_WEBHOOK_SECRET` verification, `checkout.session.completed` only, `stripeSessionId` idempotency, order creation via services, buyer email, `order.placed` dotell. Removed V2 per-seller webhook secret, fulfillment routing, freemium counter. | M3 core deliverable. |
| `src/app/[slug]/success/page.tsx` | Rewritten — static “Order received” message; optional `session_id` display only. No Stripe API, no DB. | M3 spec: display-only success page. |
| `src/app/[slug]/page.tsx` | V3 product query (`published` + `stock > 0`); removed `HeroImage` / `inStock` queries; passes `sellerId`, `paymentsEnabled` to `ShopExperience`. | Connect checkout gate + minimal V3 storefront fix. |
| `src/components/shop/FavoritesSummary.tsx` | Checkout calls `POST /api/checkout/session` with `{ sellerId, items }`; disabled **“Not accepting payments yet”** when `paymentsEnabled` is false. | M3 storefront wiring + gate. |
| `src/components/shop/shop-experience.tsx` | Accepts and forwards `sellerId`, `paymentsEnabled` to `FavoritesSummary`. | Prop plumbing for checkout gate. |
| `src/app/api/products/route.ts` | V3 `storefrontProductWhere`; returns `mapProductForShop()` (cents→dollars, `images[0]`→`imageUrl`). | Storefront could not load products on V3 schema without this. |
| `src/app/api/categories/route.ts` | Replaced `inStock: true` with `storefrontProductWhere`. | Paired with products API V3 fix. |
| `src/app/api/hero/route.ts` | GET returns `[]` immediately (HeroImage model removed). POST/DELETE unchanged (still V2/broken). | Shop client fetches hero on mount; empty array is safe. |
| `src/app/api/[slug]/checkout/route.ts` | Returns `410` — “Use POST /api/checkout/session instead”. | Legacy V2 path deprecated per approved plan. |
| `MILESTONE_03.md` | Filled §11 Assumptions Made and §12 Open Questions. | Milestone documentation per directive. |

**Explicitly not modified (per M3 §6):** `prisma/schema.prisma`, migrations, dashboard, Connect routes, onboarding, middleware, `lib/stripe.ts` (verified clean — singleton only), settings, product CRUD dashboard actions.

**Not modified (M3 spec gap):** `src/app/[slug]/product/[id]/page.tsx` — **does not exist** in repo. Gate applied on cart checkout only (`FavoritesSummary`).

---

### 4. Assumptions Made

- **Assumption 1:** Idempotency key is **`stripeSessionId`** (session.id), per ONBOARDING.md and explicit user instruction — not `stripePaymentIntentId` as written in MILESTONE_03 §8 (documented as typo). Both fields stored on Order; duplicate guard uses `stripeSessionId` only.
- **Assumption 2:** Checkout route is **`/api/checkout/session`** (new). V2 `/api/[slug]/checkout` returns 410. Client sends `sellerId` + `{ productId, quantity }[]` — no client-side prices.
- **Assumption 3:** No `/[slug]/product/[id]` page — checkout gate only on `FavoritesSummary` (sole pay button in swipe UI).
- **Assumption 4:** Minimal storefront V3 fixes included (user-approved) so `/[slug]` is testable: `shop-product.ts`, products/categories APIs, hero GET stub.
- **Assumption 5:** `constructStripeWebhookEvent` and `getCheckoutSessionLineItems` live in `checkout.service.ts` so route handlers do not import the Stripe SDK instance (webhook route imports `Stripe` type only for event narrowing).
- **Assumption 6:** Webhook does **not** call legacy `routeFulfillment`, Telegram, or seller notification email — M4 scope. M3 sends **buyer** confirmation via new `email.service.ts` only.
- **Assumption 7:** `application_fee_amount = Math.floor(sessionTotalCents * 0.02)` on platform Checkout Session with `payment_intent_data.transfer_data.destination`.
- **Assumption 8:** `priceSnapshot` taken from Stripe line item `unit_amount` (cents), not re-fetched from DB at webhook time.
- **Assumption 9:** `checkout.service.ts` uses Prisma directly for seller/product validation (M3 §4 assigns Stripe + validation to this service; not routed through `seller.service.ts` / `product.service.ts` which do not exist yet).

---

### 5. Open Questions

- **Question 1 (resolved):** V2 checkout path was `/api/[slug]/checkout` — new `/api/checkout/session` created; legacy route 410.
- **Question 2 (resolved):** No product detail page — gate on cart only.
- **Question 3 (resolved):** Storefront V3 fixes included for testability.
- **Question 4 (resolved):** Idempotency uses `stripeSessionId` per ONBOARDING.md (user confirmed MILESTONE_03 §8 typo).
- **Question 5:** Full `npm run build` / project-wide `tsc` still fails on unrelated V2 routes (`fulfillment.ts`, dashboard actions, settings, cron, seed, telegram/twilio webhooks). M3-specific files typecheck clean in isolation. Accept until M4+?
- **Question 6:** **Developer must verify** Stripe webhook locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and `STRIPE_WEBHOOK_SECRET` from CLI output. Production webhook endpoint registration not done in M3.
- **Question 7:** **No published products in dev DB** = empty storefront. Checkout cannot be tested without manual product insert or dashboard product CRUD restoration (still V2/broken). Developer needs test data before e2e checkout test.
- **Question 8:** `src/lib/resend.ts` remains V2 (seller notification, removed Order fields) and broken. M3 uses `email.service.ts` for buyer email only. Consolidate or delete `resend.ts` in which milestone?
- **Question 9:** Seller notification on new order (email/Telegram) deferred to M4 — buyer gets Resend confirmation only in M3.

---

### 6. Risks

| Risk | Severity | Mitigation in place | Needs developer action? |
|------|----------|---------------------|-------------------------|
| Webhook not received locally without Stripe CLI forwarding | High | Handler implemented correctly | Yes — run `stripe listen` and set webhook secret |
| No published products → empty shop / untestable checkout | High | Documented | Yes — seed or manual insert test product |
| Full build still fails on V2 legacy code | Medium | M3 paths typecheck clean | Yes — accept until M4 or fix incrementally |
| Idempotency deviates from MILESTONE_03.md §8 text (uses `stripeSessionId`) | Low | Matches ONBOARDING.md; user approved | No |
| `getCheckoutSessionLineItems` requires `productId` in Stripe product metadata — mismatch breaks webhook | Medium | Set in `createCheckoutSession` line_items | No if checkout path unchanged |
| Stock decrement throws inside transaction if concurrent oversell | Medium | `updateMany` with `stock: { gte: quantity }` guard | Monitor; consider optimistic locking in M4 |
| Resend failure silent (logged only) — buyer may not get email | Low | Order still created per spec | No — acceptable for M3 |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` missing → email skipped with error log | Medium | try/catch in email.service | Yes — confirm env vars for email test |
| Legacy `/api/[slug]/checkout` 410 if old client cached | Low | FavoritesSummary updated | No |
| Hero POST/DELETE routes still V2/broken | Low | Shop only uses GET (returns []) | No for M3 buyer flow |
| Dashboard product CRUD still V2 — cannot publish products via UI | High | None | Yes — manual DB insert or wait for M4 dashboard restore |
| Destination charge requires seller Connect account fully onboarded | High | Checked in checkout.service | Yes — seller must have `stripeConnectOnboarded: true` |
| `NEXT_PUBLIC_APP_URL` mismatch breaks success/cancel redirect URLs | Medium | Built from env in checkout.service | Yes — must match running dev URL |

---

### 7. Layer Violations

**None.**

- Stripe SDK calls: `checkout.service.ts` only (`createCheckoutSession`, `constructStripeWebhookEvent`, `getCheckoutSessionLineItems`).
- Prisma order writes: `order.service.ts` only.
- Resend: `email.service.ts` only.
- Route handlers (`/api/checkout/session`, `/api/webhooks/stripe`) call services only; webhook imports `Stripe` **type** for event narrowing, not the SDK client.
- Storefront components call API routes only — no server secrets on client.
- `trackSellerEvent` called from webhook route (same pattern as M2 return handler) — analytics stub, not business logic.

**Minor note (not a violation):** `checkout.service.ts` mixes Stripe API calls and Prisma validation reads. M3 §4 explicitly assigns both to this file.

---

### 8. Engineering Rule Violations

| Rule | Status | Notes |
|------|--------|-------|
| Stripe webhook signature verification via `constructEvent` — 400 on failure | **Pass** | Hard fail; no JSON parse before verify |
| Idempotency: check existing Order before create | **Pass** | By `stripeSessionId` per ONBOARDING (MILESTONE_03 §8 text says `stripePaymentIntentId` — **intentional bend**, user-approved) |
| Order + stock decrement in single `$transaction` | **Pass** | `order.service.ts` |
| `priceSnapshot` from Stripe line item cents | **Pass** | Not re-fetched from DB |
| 2% `application_fee_amount`, floor, no exceptions | **Pass** | `Math.floor(sessionTotalCents * 0.02)` |
| Destination charge to `stripeConnectAccountId` | **Pass** | |
| URLs from `NEXT_PUBLIC_APP_URL` only | **Pass** | success/cancel URLs |
| Resend fire-and-forget (order succeeds if email fails) | **Pass** | |
| `stripeConnectOnboarded` gate before checkout button | **Pass** | `FavoritesSummary` disabled state |
| Every tenant Prisma query includes `where: { sellerId }` | **Pass** | Product validation and stock decrement scoped by `sellerId` |
| No `NEXT_PUBLIC_*` on server secrets | **Pass** | |
| No per-seller Stripe keys / no `getStripeClient` | **Pass** | Removed from checkout/webhook paths |
| No Clerk auth on checkout/webhook routes | **Pass** | |
| No shipping/Shippo in checkout | **Pass** | M6 scope |
| No order management UI | **Pass** | M4 scope |
| No Telegram on webhook | **Pass** | M4 scope |
| Success page: no DB/Stripe query | **Pass** | Optional `session_id` display string only |
| ONBOARDING §5: services must not call external APIs | **Bent — acceptable for M3** | MILESTONE_03 §7 explicitly assigns Stripe/Resend to service layer; overrides generic ONBOARDING service rule for this milestone |

**MILESTONE_03-specific deviations:**

| Deviation | Status | Notes |
|-----------|--------|-------|
| §5 lists modify `[slug]/product/[id]/page.tsx` | **Skipped** | Page does not exist; gate on `FavoritesSummary` only |
| §8 idempotency on `stripePaymentIntentId` | **Bent — user-approved** | Implemented on `stripeSessionId` per ONBOARDING.md |
| §4 lists create `[slug]/success/page.tsx` | **Rewritten, not net-new** | V2 file existed |
| Extra files: `shop-product.ts`, products/categories/hero APIs, `FavoritesSummary`, `shop-experience`, `[slug]/checkout` 410 | **Scope expansion — user-approved** | Required for testable storefront |

---

### 9. Ready to Proceed

**Ready:** Yes

**Reasoning:** M3 deliverables are complete: platform destination-charge checkout, guest session API, V3 webhook with signature verification and `stripeSessionId` idempotency, atomic order/stock creation, buyer confirmation email stub, storefront checkout gate, success/cancel pages, and V3-compatible product loading for `/[slug]`. Layer separation matches M3 §7. No schema changes. M3-specific files typecheck clean.

Proceed to M4 with these preconditions for **your testing** before sign-off:

1. Seller with `stripeConnectOnboarded: true` and valid Connect account  
2. At least one **published** product with **stock > 0** (likely manual DB insert until dashboard CRUD restored)  
3. `stripe listen --forward-to localhost:3000/api/webhooks/stripe` with matching `STRIPE_WEBHOOK_SECRET`  
4. `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, optional `RESEND_API_KEY` / `RESEND_FROM_EMAIL`  

Full project build remains broken on legacy V2 routes — does not block M4 order-management work but blocks production deploy until addressed.
