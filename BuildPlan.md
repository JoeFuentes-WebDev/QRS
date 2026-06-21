# QRS — Build Plan
## MVP

Ordered milestones. Complete each milestone fully before starting the next. Each milestone is a shippable state.

---

## Milestone 0: Foundation

**Goal:** main branch set up, Clerk installed, schema migrated, existing QRS functionality preserved.

### Tasks
1. Duplicate the qrs repo into a new repo: JoeFuentes-WebDev/qrs
2. Install Clerk: `npm install @clerk/nextjs`
3. Add Clerk environment variables to `.env.local` and Vercel
4. Wrap app in `<ClerkProvider>` in `src/app/layout.tsx`
5. Add Clerk middleware to `src/middleware.ts` — protect `/dashboard` routes only
6. Update `prisma/schema.prisma` — add full V2 schema (Seller table, sellerId on all tables, quantity on Product)
7. Create migration: `npx prisma migrate dev --name v2-multi-tenant`
8. Seed script: create default Seller record, assign `sellerId` to all existing Products, HeroImages, Orders
9. Run migration and seed on local Neon dev database
10. Verify: default seller shop loads at assigned slug, existing products visible

**Done when:** App runs on main branch. Existing seller data intact. `/dashboard` redirects to Clerk login when unauthenticated.

---

## Milestone 1 — Seller Onboarding

**Goal:** A new seller can sign up and complete onboarding. They land in a working (empty) dashboard.

### Tasks
1. Build `/` marketing landing page — headline, CTA button ("Get Your Shop"), how it works (3 steps)
2. Clerk handles `/sign-up` and `/sign-in` (use Clerk's hosted UI or embed components)
3. Post-signup onboarding wizard at `/onboarding` (protected, redirects to `/dashboard` when complete):
   - Step 1: Store name + slug (auto-suggest from store name, validate uniqueness, editable)
   - Step 2: Phone number
   - Step 3: Notification preference — Email or Telegram + Shippo
   - If Email: confirm notification email
   - If Telegram + Shippo: enter Bot token, Shippo key, origin address fields
4. On wizard complete: create Seller record in DB with `clerkUserId`, redirect to `/dashboard`
5. Middleware: if authenticated seller has no Seller record, redirect to `/onboarding`
6. Middleware: if authenticated seller has Seller record, allow `/dashboard`

**Done when:** New signup flow works end to end. Seller record created. Lands in empty dashboard.

---

## Milestone 2 — Seller Dashboard

**Goal:** Seller can manage their shop from `/dashboard`. All three tabs working. Scoped to logged-in seller.

### Tasks
1. Move `/admin` to `/dashboard`. Update all internal links.
2. Scope all dashboard queries by `sellerId` (from Clerk session → Seller record lookup)
3. Add/Edit/Hero tabs — identical to QRS admin but seller-scoped
4. Add Settings tab:
   - Stripe keys (secret, publishable, webhook secret) — password-masked inputs
   - Notification preference (read-only display, edit TBD V3)
   - Custom domain field — disabled input, "Coming soon" label
5. Update Cloudinary upload paths to `qrs/[sellerId]/products/` and `qrs/[sellerId]/hero/`
6. Update AI analysis to use platform Anthropic key (not per-seller)

**Done when:** Seller can add/edit/remove products and hero images. Settings page renders. All data scoped to seller.

---

## Milestone 3 — Public Shop

**Goal:** `/[slug]` renders the correct seller's shop. Swipe UI works. Cart works.

### Tasks
1. Create `src/app/[slug]/page.tsx` — look up Seller by slug, 404 if not found
2. Pass seller context to SwipeCard, FavoritesSummary components
3. Filter product queue by `sellerId` and `inStock: true`
4. Apply quantity logic: after purchase, decrement quantity; if quantity reaches 0, set `inStock: false`
5. Fix SwipeCard collapsed state bug: add `e.stopPropagation()` to all action button handlers
6. Add first-skip hint: after first ✕ tap, show one-time tooltip "Skipped items come back around"
7. Update `/[slug]/success` confirmation page

**Done when:** Two different seller slugs render two different shops. Cart works. Bug fixed. Skip hint fires once.

---

## Milestone 4 — Checkout and Fulfillment

**Goal:** Stripe checkout works per-seller. Order saved to DB. Seller notified via their chosen fulfillment method.

### Tasks
1. Create per-seller Stripe client factory in `src/lib/stripe.ts` — instantiates Stripe with seller's secret key
2. Update checkout session creation to use seller's Stripe keys
3. Update Stripe webhook handler:
   - Look up seller by `stripeSessionId` → order → sellerId
   - Save order to DB
   - Route to fulfillment based on `seller.fulfillmentType`
4. Email fulfillment (Resend):
   - Install Resend: `npm install resend`
   - Build order notification email template
   - Send to `seller.notificationEmail`
5. Telegram + Shippo fulfillment:
   - Update `src/lib/telegram.ts` to accept per-seller bot token
   - Update Shippo label generation to use per-seller Shippo key and origin address
   - Update Telegram webhook handler to route by seller

**Done when:** End-to-end order flow works for both fulfillment types. Seller gets notified. Order in DB.

---

## Milestone 5 — Freemium Tracking

**Goal:** Monthly order count tracked per seller. Threshold logic in place. (Connect fee not activated until V3.)

### Tasks
1. Increment `seller.monthlyOrderCount` on every successful order (in Stripe webhook handler)
2. Create Vercel cron job (`/api/cron/reset-order-counts`) — runs 1st of each month, resets all counts to 0
3. Add `CRON_SECRET` env var, protect cron endpoint
4. Add `billingPeriodStart` update on reset
5. Stub: log when a seller crosses threshold (console.log for now — Connect activation is V3)

**Done when:** Order counts increment. Cron resets monthly. Threshold crossing is logged.

---

## Milestone 6 — Migration and Deploy

**Goal:** V2 deployed to Vercel. Existing seller shop live at production URL (or staging). All existing data intact.

### Tasks
1. Run migration on production Neon database
2. Run seed script on production (default seller record + sellerId assignment)
3. Add all new env vars to Vercel: Clerk keys, Resend key
4. Deploy main branch to Vercel preview URL
5. Smoke test: existing seller shop, new seller signup, add product, checkout (test mode), email notification
6. Merge to main when smoke tests pass

**Done when:** V2 live on Vercel. Existing seller shop works. New seller signup works end to end.

---

## Post-MVP Enhancements (Not Blocking V2 Launch)

- Low stock badge on swipe card ("3 left")
- Rewind button for skipped items
- Seller can change notification preference after onboarding
- Slug change request flow
- Order history in dashboard
- Basic sales stats (total orders, total revenue) in dashboard

---

*BuildPlan.md — QRS — June 2026*
