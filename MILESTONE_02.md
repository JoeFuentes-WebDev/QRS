# MILESTONE_02.md

## SECTION 1 — HUMAN SUMMARY

This milestone builds the Stripe Connect Express integration: the server-side service layer, the onboarding API routes, and the dashboard UI for initiating and completing Connect onboarding. It comes directly after M1 because the schema now has `stripeConnectAccountId` and `stripeConnectOnboarded` fields to write to. All checkout and seller publishing gates depend on `stripeConnectOnboarded: true`, so this must land before storefront or checkout work begins. Medium-high complexity — involves Stripe API calls, Clerk auth, Prisma writes, and two redirect-handling routes.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**M2 — Stripe Connect Express Onboarding**

---

### 2. What This Milestone Builds

A complete Stripe Connect Express onboarding flow for sellers, including:

- A server-side service function that creates a Stripe Connect Express account and persists `stripeConnectAccountId` to the `Seller` record
- A server-side service function that generates a Stripe Account Link (onboarding URL) using `return_url` and `refresh_url` constructed from `NEXT_PUBLIC_APP_URL`
- An API route that initiates onboarding (creates account if needed, returns Account Link URL)
- A return route handler (`/dashboard/stripe/return`) that verifies onboarding completion via the Stripe API and updates `stripeConnectOnboarded: true` on the `Seller` record if `charges_enabled === true`
- A refresh route handler (`/dashboard/stripe/refresh`) that regenerates a new Account Link and redirects the seller back to Stripe onboarding
- A dashboard UI component showing the seller's current Stripe Connect status and a "Connect Stripe" / "Onboarding incomplete — continue" button
- A `dotell` analytics event fired on successful `stripeConnectOnboarded: true` write: `stripe.connected`

**Charge model context:** Destination charge. Platform Stripe account creates PaymentIntents. Seller's Connect account receives funds via `transfer_data.destination`. The `stripeConnectAccountId` stored here is used in all future checkout PaymentIntent creation.

---

### 3. Why This Comes Next

M1 established the V3 schema with `stripeConnectAccountId: String?` and `stripeConnectOnboarded: Boolean` on `Seller`. M2 is the first application-layer milestone and must come before:
- M3 (storefront/checkout): checkout PaymentIntent requires a valid `stripeConnectAccountId` and `stripeConnectOnboarded: true` gate
- M4 (order management): sellers cannot have orders if checkout is blocked
- Any product publish gate: `stripeConnectOnboarded: true` is a publish prerequisite

No application code exists yet that uses the V3 schema — M2 is the first code written against it.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Stripe client singleton — initialises `new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })` and exports it. Server-only. |
| `src/services/stripeConnect.service.ts` | Service layer: `getOrCreateConnectAccount(sellerId, email)` and `createAccountLink(stripeAccountId)`. All Stripe API calls live here, not in route handlers. |
| `src/app/api/stripe/connect/route.ts` | POST handler — Clerk-authenticated. Calls `getOrCreateConnectAccount` then `createAccountLink`, returns `{ url }`. |
| `src/app/dashboard/stripe/return/page.tsx` | Server component — handles Stripe return redirect. Reads Clerk session, fetches seller, calls Stripe `accounts.retrieve`, sets `stripeConnectOnboarded: true` if `charges_enabled`. Fires `stripe.connected` analytics event. Redirects to `/dashboard`. |
| `src/app/dashboard/stripe/refresh/page.tsx` | Server component — handles Stripe refresh redirect. Regenerates Account Link via `createAccountLink` and redirects seller back to Stripe onboarding URL. |
| `src/components/dashboard/StripeConnectCard.tsx` | Client component — renders Connect status and CTA button. Reads `stripeConnectOnboarded` prop. Calls `/api/stripe/connect` on button click, then `window.location.href = url`. |

---

### 5. Files to Modify

| Path | What changes | Why |
|------|-------------|-----|
| `src/services/seller.service.ts` | Add (or create if absent) `getSellerByClerkId(clerkUserId)` and `updateSellerStripeConnect(sellerId, { stripeConnectAccountId?, stripeConnectOnboarded? })` — used by Connect routes and return handler. | Route handlers and server components must retrieve and update the Seller record; service layer is the correct location per architecture rules. |
| `src/app/dashboard/page.tsx` | Import and render `<StripeConnectCard>` with seller's current `stripeConnectOnboarded` and `stripeConnectAccountId` values. | Dashboard must surface Connect status so sellers can complete onboarding. |

> **Note:** If `src/services/seller.service.ts` does not exist, create it. If `src/app/dashboard/page.tsx` does not exist in a V3-compatible state, create the minimal shell needed to render `<StripeConnectCard>` — do not attempt to reconcile V2 dashboard content. Scope is limited to the Connect card only.

---

### 6. Files to Leave Untouched

- `prisma/schema.prisma` — M1 deliverable; do not modify
- `prisma/migrations/` — do not add or alter migration files
- `prisma/seed.ts` — incompatible with V3, leave broken until a later milestone
- `middleware.ts` — Clerk middleware config is correct; do not modify
- `src/app/[slug]/` — buyer storefront; not in scope
- `src/app/api/webhooks/` — Stripe webhook handler; not in scope
- `src/app/api/checkout/` — checkout flow; not in scope
- `.cursorrules` — do not modify
- `vercel.json` — not needed for M2; do not create or modify
- `next.config.ts` — do not modify
- `.env` — do not modify; env vars are assumed present

---

### 7. Layer Rules Reminder

1. **Stripe API calls belong in the service layer, not in route handlers or components.** `src/services/stripeConnect.service.ts` owns all `stripe.accounts.*` and `stripe.accountLinks.*` calls. Route handlers call service functions only.
2. **Every Prisma query on a tenant-scoped table must include `where: { sellerId }`** (or equivalent scoping by `clerkUserId → sellerId`). No unscoped Seller fetches.
3. **Server-only secrets (`STRIPE_SECRET_KEY`) must never appear in client components or files importable by the client bundle.** `src/lib/stripe.ts` must not be imported from any `'use client'` file. The `StripeConnectCard` component calls an API route — it does not import the Stripe client directly.

---

### 8. Engineering Rules

**DO:**
- Use `NEXT_PUBLIC_APP_URL` (from `process.env`) to construct `return_url` and `refresh_url` in `createAccountLink` — never hardcode domain strings
- Check `charges_enabled` on the retrieved Stripe account object in the return handler before setting `stripeConnectOnboarded: true`
- Fire the `stripe.connected` dotell/analytics event (Model B, Clerk userId) only on the first successful `charges_enabled: true` confirmation — guard with a check on current `stripeConnectOnboarded` value before firing
- Return a clear JSON error response (`{ error: 'Unauthorized' }`, 401) from the API route if no Clerk session is present
- Use `currentUser()` or `auth()` from `@clerk/nextjs/server` in server components and route handlers — never from client components
- Keep `getOrCreateConnectAccount` idempotent: if `seller.stripeConnectAccountId` already exists, skip account creation and return the existing ID

**DO NOT:**
- Do not create a Stripe Connect account for `type: 'standard'` or `type: 'custom'` — use `type: 'express'` only
- Do not pass any per-seller Stripe secret key into Stripe API calls — all calls use the platform `STRIPE_SECRET_KEY` only
- Do not store or log the full Stripe Account Link URL — it is single-use and short-lived; return it immediately to the client
- Do not implement any fee configuration, payout schedule, or capability requests beyond what Stripe Express sets by default
- Do not add Shippo, Resend, Telegram, or any other integration to this milestone
- Do not build any product publish gating UI in this milestone — that comes in a later milestone
- Do not invent fields on the Seller model not present in the M1 schema
- Do not use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` or any `NEXT_PUBLIC_*` Stripe variable — Stripe Connect onboarding uses server-side API calls only

---

### 9. Ambiguity Protocol

If any of the following are true, **stop, do not guess, and record the blocker in §11 Assumptions Made / §12 Open Questions**:

- `src/services/seller.service.ts` exists with V2-era logic that conflicts with V3 schema field names — do not silently overwrite; note the conflict
- `src/app/dashboard/page.tsx` contains substantial V2 UI that would be deleted by creating a minimal shell — flag it; do not delete unexplained content
- The Stripe API version currently in use differs from `'2024-06-20'` — use whatever version is already configured if one exists, note the discrepancy
- Any required env var (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_APP_URL`) is absent from `.env` or `.env.local` — note it; do not fabricate values

---

### 10. What Is NOT in This Milestone

- Stripe webhook handler for `account.updated` events — not needed; return handler polls directly
- Stripe checkout / PaymentIntent creation — M3
- Product publish gate enforcement — later milestone
- Seller onboarding checklist UI (store name, slug, notification email steps) — later milestone
- Shippo API key entry or validation — later milestone
- Any buyer-facing storefront changes
- Seller dashboard beyond the Connect card (orders list, product management, settings)
- Email (Resend) notifications for Connect status changes
- Telegram notifications
- FAQ page
- QR code / postcard generation
- Admin route (`/admin`)
- `vercel.json` creation

---

### 11. Assumptions Made

- Dashboard V2 `DashboardShell` / Add/Edit/Hero tabs not rendered; files left in place per user approval. Minimal shell with `DashboardHeader` + `StripeConnectCard` only.
- `src/lib/dotell.ts` added (not in M2 file table) — logs `[dotell] seller=… event=…` locally until M5 wires real endpoint. Event name: `stripe.connected`.
- Stripe API version: MILESTONE_02 specifies `2024-06-20`; `stripe` ^22.1.1 types require `2026-04-22.dahlia` — used package-required version.
- `src/lib/stripe.ts` fully replaced (V2 `getStripeClient` / `sellerHasStripeConfigured` removed). Checkout, webhooks, fulfillment remain broken until M3+ per user approval.
- `dashboard-header.tsx` extracted so server `dashboard/page.tsx` can render header with client `SignOutButton` without importing full V2 `DashboardShell`.
- Seller lookup in Connect flow uses new `src/services/seller.service.ts`; existing `src/lib/seller.ts` unchanged for onboarding/layout.
- Express account created with `card_payments` and `transfers` capabilities requested; no custom fee/payout configuration.

---

### 12. Open Questions

- **`npm run build` / `tsc` fails** on V2 routes (checkout, webhooks, storefront, settings, seed) due to V3 schema + removed stripe exports. Expected until M3+. M2 Connect paths typecheck clean.
- **`/dashboard/settings`** still references V2 Stripe key fields — will error if visited; out of M2 scope.
- **Stripe Connect in test mode** requires platform `STRIPE_SECRET_KEY` with Connect enabled and valid `NEXT_PUBLIC_APP_URL` for return/refresh URLs — manual verification required.