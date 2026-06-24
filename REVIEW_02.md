# REVIEW_02.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 2. Cursor has completed the milestone and is self-auditing the result before you proceed to M3. Read through the files created and modified, then check the assumptions and risks sections carefully — those are the places most likely to need your input. A passing review means: no layer violations, no engineering rule violations, all open questions are either resolved or explicitly handed to you for a decision, and Cursor has flagged anything that could break silently in production.

---

## SECTION 2 — CURSOR DIRECTIVE

You have just completed Milestone 2. Fill in every field below honestly. Do not skip sections. Do not write "N/A" without a reason.

---

### 1. Milestone Completed

**Title:** Stripe Connect Express Onboarding  
**Number:** 2

---

### 2. Files Created

| File | Description |
|------|-------------|
| `src/lib/dotell.ts` | Minimal seller analytics helper — logs `[dotell] seller=… event=…` to console until M5 wires a real endpoint. |
| `src/services/seller.service.ts` | Tenant-scoped Seller reads/updates: `getSellerByClerkId`, `updateSellerStripeConnect`. |
| `src/services/stripeConnect.service.ts` | Stripe Connect service: `getOrCreateConnectAccount` (Express), `createAccountLink`, and `syncStripeConnectStatus` (polls Stripe, updates `stripeConnectOnboarded`, fires `stripe.connected` once). |
| `src/app/api/stripe/connect/route.ts` | Clerk-authenticated `POST` — creates Connect account if needed, returns Account Link `{ url }`. |
| `src/app/api/stripe/connect/sync/route.ts` | Clerk-authenticated `POST` — syncs Connect status from Stripe API; used by dashboard refresh control. *(Post-M2 hotfix.)* |
| `src/app/dashboard/stripe/return/page.tsx` | Stripe return handler — calls `syncStripeConnectStatus`, redirects to `/dashboard`. |
| `src/app/dashboard/stripe/refresh/page.tsx` | Stripe refresh handler — regenerates Account Link and redirects back to Stripe onboarding. |
| `src/components/dashboard/StripeConnectCard.tsx` | Client UI — status indicator, Connect CTA, refresh icon; opens Stripe in a new tab and syncs status without full page reload. |
| `src/components/dashboard/dashboard-header.tsx` | Client header with store name, Settings link, and Clerk SignOutButton — extracted because minimal dashboard no longer uses V2 `DashboardShell`. |

---

### 3. Files Modified

| File | What changed | Why |
|------|-------------|-----|
| `src/lib/stripe.ts` | Replaced V2 per-seller `getStripeClient` / `sellerHasStripeConfigured` with platform singleton `stripe` using `STRIPE_SECRET_KEY`. | M2 requires platform Stripe client for Connect; per-seller keys are V3-removed. |
| `src/app/dashboard/page.tsx` | Removed V2 product/hero queries and `DashboardShell` render. Added `DashboardHeader` + `StripeConnectCard` with seller Connect fields. | M2 scope: Connect card only; V2 tabs cannot compile against V3 schema. User approved leaving V2 component files in place but not rendering them. |
| `src/app/onboarding/actions.ts` | Rewritten for V3 Seller schema (`storeName`, `slug`, `notificationEmail` only). Removed V2 fields (`email`, `phone`, `FulfillmentType`, Telegram/Shippo). | Post-M2 hotfix — onboarding failed on submit after M1 schema migration. |
| `src/components/onboarding/onboarding-form.tsx` | Simplified to V3 fields only; removed phone, fulfillment type, Telegram/Shippo conditional UI. | Post-M2 hotfix — paired with onboarding actions rewrite. |
| `src/components/dashboard/StripeConnectCard.tsx` | Post-M2 UX: opens Stripe in new tab (blank tab on click, then navigate after API); refresh icon + local status state; auto-sync after Connect starts. | User-requested after M2 — dashboard stays open while Stripe onboarding runs in another tab. |
| `src/app/dashboard/stripe/return/page.tsx` | Refactored to call `syncStripeConnectStatus` instead of inline Stripe retrieve/update logic. | DRY with new sync API; same behavior. |
| `src/services/stripeConnect.service.ts` | Added `syncStripeConnectStatus` and `StripeConnectSyncResult` type. | Shared by return page, sync API route, and dashboard refresh control. |
| `MILESTONE_02.md` | Filled §11 Assumptions Made and §12 Open Questions. | Milestone documentation per directive. |

**Explicitly not modified (per M2 §6):** `prisma/schema.prisma`, migrations, seed, middleware, `[slug]/`, webhooks, checkout routes, `.env`, `vercel.json`, `next.config.ts`, `.cursorrules`.

---

### 4. Assumptions Made

- **Assumption 1:** Dashboard V2 `DashboardShell`, Add/Edit/Hero tabs, and related data fetches are intentionally not rendered. Component files remain on disk for M3+ restoration. User approved this explicitly.
- **Assumption 2:** `src/lib/dotell.ts` was added even though it is not listed in MILESTONE_02 §4 — required to fire `stripe.connected` on first successful Connect; real dotell endpoint deferred to M5 per user approval (console log only).
- **Assumption 3:** `src/components/dashboard/dashboard-header.tsx` was added as a supporting file not listed in M2 §4 — needed so server `dashboard/page.tsx` can render logout/settings without importing the full V2 client `DashboardShell`.
- **Assumption 4:** Stripe API version in MILESTONE_02 is `2024-06-20`, but `stripe` ^22.1.1 TypeScript types require `2026-04-22.dahlia`. Used the package-required version and documented the discrepancy.
- **Assumption 5:** Seller lookup by `clerkUserId` in `seller.service.ts` satisfies tenant isolation for auth-bound routes even though it is not a literal `where: { sellerId }` — the Clerk session maps 1:1 to one Seller row.
- **Assumption 6:** Express account creation requests `card_payments` and `transfers` capabilities only. No custom fee, payout schedule, or capability configuration beyond Stripe Express defaults.
- **Assumption 7:** Checkout, webhooks, fulfillment, storefront, and settings remain broken until M3+ — user approved leaving them unfixed in M2.
- **Assumption 8:** Connect onboarding email comes from `seller.notificationEmail`, falling back to Clerk primary email if needed.
- **Assumption 9:** *(Post-M2)* Stripe Connect onboarding opens in a **new browser tab** so the dashboard remains open. Status is refreshed manually via a sync icon (or automatically once after Connect starts), not by reloading the page.
- **Assumption 10:** *(Post-M2)* `syncStripeConnectStatus` is the single source of truth for persisting `stripeConnectOnboarded` from Stripe's `charges_enabled` flag — used by return URL, sync API, and dashboard refresh. No `account.updated` webhook in M2.

---

### 5. Open Questions

- **Question 1:** ~~`src/app/onboarding/actions.ts` is still V2~~ **Resolved (post-M2 hotfix).** Onboarding rewritten for V3 (`storeName`, `slug`, `notificationEmail`). Fresh signups verified locally.
- **Question 2:** `npm run build` fails project-wide due to V2 code referencing removed schema fields and removed `getStripeClient` exports. M2 Connect files typecheck clean in isolation. Is a broken full build acceptable until M3, or should CI be scoped/disabled on `v3`?
- **Question 3:** `/dashboard/settings` still references V2 per-seller Stripe key fields. Visiting it will error. Remove, redirect, or rewrite in which milestone?
- **Question 4:** Stripe Connect manual verification — has the developer confirmed platform `STRIPE_SECRET_KEY` has Connect enabled, `NEXT_PUBLIC_APP_URL` matches the running dev URL, and return/refresh URLs work in Stripe test mode? *(Partially verified locally — Connect flow exercised in dev with new-tab + sync UX.)*
- **Question 5:** ~~After M1 dev DB reset, existing Seller rows may be absent~~ **Resolved for dev** — onboarding creates V3 Seller rows; Connect tested after signup.

---

### 6. Risks

| Risk | Severity | Mitigation in place | Needs developer action? |
|------|----------|---------------------|-------------------------|
| Stale Prisma client in Next.js dev cache causes `Seller.email does not exist` after M1 migration | High | `prisma generate` + delete `.next`; developer must restart `npm run dev` | Yes — restart dev server after schema/client changes |
| ~~V2 onboarding cannot create Seller on V3 schema~~ | ~~High~~ | **Resolved (post-M2)** — onboarding rewritten for V3 | No |
| Full `tsc` / `npm run build` fails on V2 routes | High | M2 paths typecheck clean; failure is expected and documented | Yes — accept until M3 or fix incrementally |
| Removed `getStripeClient` breaks checkout, webhooks, fulfillment, success page | High | Intentional per M2 scope | Yes — M3+ must restore platform Connect checkout |
| `/dashboard/settings` crashes on V2 Stripe field references | Medium | Settings link still visible in header | Yes — avoid route or fix in later milestone |
| `stripe.connected` dotell event is console-only | Low | Logged with clerk userId | No until M5 |
| Return handler / sync polls Stripe once — no `account.updated` webhook | Low | Sync icon on dashboard mitigates stuck “incomplete” when onboarding finishes in another tab | No — monitor in production |
| Account Link URL is single-use; client opens blank tab synchronously then navigates after API (~6s) | Low | Avoids popup blockers; closes tab on API failure | No |
| Dashboard tab may show stale Connect status until user clicks refresh | Low | Sync icon + auto-sync after Connect start; hint text explains flow | No |
| Dev DB empty after M1 reset — no test sellers/products | Medium | Onboarding creates sellers; verified locally | No for dev |

---

### 7. Layer Violations

**None.**

- Stripe API calls live in `src/services/stripeConnect.service.ts`.
- Route handlers and server pages call service functions only.
- `StripeConnectCard` calls `/api/stripe/connect` and `/api/stripe/connect/sync` — does not import `src/lib/stripe.ts`.
- Prisma Seller updates go through `src/services/seller.service.ts` from Connect routes/pages (except `getOrCreateConnectAccount` initial lookup by `sellerId`, which is tenant-scoped).

---

### 8. Engineering Rule Violations

Rules below are from ONBOARDING/preflight. M2 only implements Connect onboarding — many rules apply to checkout/webhooks not touched in this milestone.

| Rule | Status | Notes |
|------|--------|-------|
| Every Prisma query touching tenant data includes `where: { sellerId }` | **Partial — acceptable for M2** | `updateSellerStripeConnect` uses `where: { id: sellerId }`. `getSellerByClerkId` uses `clerkUserId` (1:1 auth mapping). No unscoped Product/Order queries added. |
| No `NEXT_PUBLIC_*` prefix on server-only secrets | **Pass** | `STRIPE_SECRET_KEY` server-only. No new public Stripe vars. |
| Stripe webhook signature verification is hard-required | **Not applicable** | Webhook handler not modified in M2. Existing V2 webhook code is broken/unreachable until M3+. |
| Stripe webhook idempotency guard (check before create) | **Not applicable** | Webhooks not in M2 scope. |
| Shippo fallback is silent BAKED_IN, never surfaces to buyer | **Not applicable** | Shippo not in M2 scope. |
| Shipping toggle only renders if Shippo API key is present | **Not applicable** | Settings/shipping UI not in M2 scope. |
| Checkout guard checks Stripe Connect onboarding before rendering pay button | **Not applicable** | Storefront/checkout not in M2 scope. |
| Platform fee (2%) applied on every PaymentIntent, no exceptions | **Not applicable** | PaymentIntent creation not in M2 scope. |
| Platform fee not returned on refund — no refund fee recovery logic built | **Not applicable** | Refunds not in M2 scope. |
| No per-product or per-event QR codes — shop slug only | **Pass** | No QR code work in M2. |
| Postcard template is fixed — no color/font customization | **Not applicable** | Postcard not in M2 scope. |
| FAQ is hardcoded array — no DB model or admin CRUD routes | **Not applicable** | FAQ not in M2 scope. |
| Telegram failures are fire-and-forget — no retry logic | **Not applicable** | Telegram not in M2 scope. |
| No background jobs, cron, or queues in V3 | **Pass** | M2 adds none. (Legacy V2 cron routes still exist in repo but are broken.) |
| `/admin` password gate is runtime check in handler, not Clerk middleware | **Pass** | `/admin` not modified in M2. |

**MILESTONE_02-specific deviations:**

| Deviation | Status | Notes |
|-----------|--------|-------|
| M2 §4 lists `src/lib/stripe.ts` as “create”; file existed with V2 logic | **Replaced, not net-new** | Documented in §3. |
| M2 §8 specifies Stripe API version `2024-06-20` | **Bent** | Used `2026-04-22.dahlia` required by `stripe` ^22.1.1 types. |
| M2 §8 says use `prisma migrate dev` workflow | **Not applicable** | No schema changes in M2. |
| Per-seller Stripe key paths removed from `lib/stripe.ts` | **Pass (intentional)** | Aligns with V3 Connect-only rule; breaks V2 callers until M3. |

---

### 9. Ready to Proceed

**Ready to proceed to M3: YES**

**Reasoning:** M2 deliverables are complete: platform Stripe singleton, Connect service layer, authenticated connect API route, return/refresh handlers, dashboard Connect card, and `stripeConnectOnboarded` persistence with guarded `stripe.connected` analytics logging. Layer separation is correct. No schema changes. M2-specific files typecheck clean.

**Post-M2 hotfixes (same review period, before M3):** V3 onboarding rewrite; Connect opens in new tab; `syncStripeConnectStatus` + refresh icon for status without page reload. End-to-end signup → onboarding → Connect exercised locally in dev.

Proceed to M3 with these preconditions understood: (1) ~~rewrite V3 onboarding~~ done, (2) restart dev server / regenerate Prisma client after M1 schema changes, (3) full build remains broken until M3 updates checkout/storefront/webhooks, (4) manually verify Stripe Connect in test mode with valid env vars. None of these block starting M3 work on checkout and Connect-gated storefront — they block production deploy and full end-to-end smoke test until addressed.
