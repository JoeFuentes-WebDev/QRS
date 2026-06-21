# QRS — Build Plan
## V3

Ordered milestones. Complete each fully before starting the next.

---

## Milestone 0 — Branch and Infrastructure Setup

**Goal:** V3 branch created. Production domain connected. Clerk production instance live. Resend domain verified.

### Tasks
1. Create `v3` branch off `main`
2. Connect `my-qrs.co` to Vercel project (Settings → Domains)
3. Add DNS A record in GoDaddy: `216.198.79.1` (already done — verify it resolves)
4. Create Clerk production instance:
   - Go to clerk.com → Create application → set domain to `my-qrs.co`
   - Generate production keys
   - Update Vercel env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
5. Verify `my-qrs.co` with Resend:
   - Resend dashboard → Domains → Add domain → follow DNS instructions
   - Update `RESEND_FROM_EMAIL` to `orders@my-qrs.co` in Vercel env vars
6. Update `NEXT_PUBLIC_APP_URL` to `https://my-qrs.co` in Vercel env vars
7. Deploy and verify: sign up at `my-qrs.co`, confirm email arrives from `orders@my-qrs.co`

**Done when:** `my-qrs.co` loads the app. Clerk signup works. Order emails come from `orders@my-qrs.co`.

---

## Milestone 1 — Schema Migration

**Goal:** V3 schema deployed. Stripe key fields removed. Connect fields added. Existing sellers migrated.

### Tasks
1. Update `prisma/schema.prisma`:
   - Remove `stripeSecretKey`, `stripePublishableKey`, `stripeWebhookSecret`
   - Add `stripeConnectAccountId String?`
   - Add `stripeConnectOnboarded Boolean @default(false)`
2. Create migration: `npx prisma migrate dev --name v3-stripe-connect`
3. Run migration on production: `DATABASE_URL=... npx prisma migrate deploy`
4. Add dashboard banner: sellers with `stripeConnectOnboarded: false` see "Connect your Stripe account to accept payments"
5. Verify: existing test seller shows banner, shop still loads, products still visible

**Done when:** Production DB migrated. All existing sellers show Connect banner in dashboard.

---

## Milestone 2 — Stripe Connect OAuth

**Goal:** Seller can connect their Stripe account via OAuth. `stripeConnectAccountId` saved. Dashboard shows connected state.

### Tasks
1. Set up Stripe Connect in Stripe dashboard:
   - Go to Connect settings → Enable Express accounts
   - Set redirect URI: `https://my-qrs.co/api/stripe/connect/callback`
   - Copy `STRIPE_CONNECT_CLIENT_ID` to Vercel env vars
2. Create `src/app/api/stripe/connect/authorize/route.ts`:
   - Generates Stripe OAuth URL with `client_id`, `state` (seller ID), `redirect_uri`
   - Redirects seller to Stripe
3. Create `src/app/api/stripe/connect/callback/route.ts`:
   - Receives `code` and `state` from Stripe
   - Exchanges code for access token via Stripe API
   - Saves `stripeConnectAccountId` and sets `stripeConnectOnboarded: true`
   - Redirects to `/dashboard?connected=true`
4. Add "Connect with Stripe" button to:
   - Onboarding page (Step 3 — after notification preference)
   - Dashboard Settings page (replaces Stripe key fields)
5. Dashboard shows "Stripe connected ✓" when `stripeConnectOnboarded: true`
6. Dashboard shows "Connect your Stripe account" banner when `stripeConnectOnboarded: false`

**Done when:** Seller can complete Connect OAuth flow. Account ID saved to DB. Dashboard shows correct state.

---

## Milestone 3 — Checkout with Connect Fee

**Goal:** Checkout uses platform Stripe key. 2% application fee collected. Seller receives 98% of payment.

### Tasks
1. Add platform Stripe env vars to Vercel:
   - `STRIPE_SECRET_KEY` (platform key, not seller key)
   - `STRIPE_WEBHOOK_SECRET` (platform webhook secret)
2. Update `src/lib/stripe.ts`:
   - Remove per-seller Stripe client factory
   - Export single platform Stripe client
3. Update `src/app/api/[slug]/checkout/route.ts`:
   - Check `seller.stripeConnectOnboarded` — if false, return error
   - Create checkout session with platform Stripe client
   - Add `payment_intent_data.application_fee_amount` (2% of total in cents)
   - Add `payment_intent_data.transfer_data.destination` = `seller.stripeConnectAccountId`
4. Update `src/app/api/webhooks/stripe/route.ts`:
   - Use platform webhook secret for verification
   - Remove per-seller webhook secret lookup
5. Set up production Stripe webhook:
   - Stripe dashboard → Webhooks → Add endpoint: `https://my-qrs.co/api/webhooks/stripe`
   - Event: `checkout.session.completed`
   - Copy signing secret to Vercel env var
6. Test with Stripe test mode:
   - Use Connect test account
   - Verify 2% fee appears in platform Stripe dashboard
   - Verify seller receives 98%

**Done when:** End-to-end checkout works with Connect. Platform receives 2% fee. Seller receives 98%.

---

## Milestone 4 — Custom Domains

**Goal:** Seller can enter a custom domain in Settings. QRS adds it to Vercel. Middleware routes correctly.

### Tasks
1. Add env vars to Vercel:
   - `VERCEL_API_TOKEN` (create at vercel.com/account/tokens)
   - `VERCEL_PROJECT_ID` (find in Vercel project settings)
2. Create `src/lib/vercel.ts`:
   - `addDomain(domain: string)` — calls Vercel API to add domain to project
   - `removeDomain(domain: string)` — removes domain from project
3. Update `src/app/dashboard/settings/page.tsx`:
   - Activate custom domain field (remove "Coming soon" label)
   - On save: validate domain format, call `addDomain()`, show DNS instructions
   - DNS instructions: "Add a CNAME record pointing `www` to `cname.vercel-dns.com`"
   - Show domain status (pending DNS / active)
4. Update `src/middleware.ts`:
   - Check `request.headers.get('host')`
   - If not `my-qrs.co` or `*.vercel.app`: look up seller by `customDomain`
   - Rewrite request to `/[slug]` internally
5. Test with a real domain (use `my-qrs.co` subdomain or `get-qrs.com` as test)

**Done when:** Seller enters custom domain → QRS adds to Vercel → seller adds CNAME → domain resolves to their shop.

---

## Milestone 5 — Onboarding Fixes

**Goal:** Telegram sellers can complete onboarding without manual DB entry. Connect button in onboarding.

### Tasks
1. Add `telegramChatId` field to onboarding form (visible when Telegram + Shippo selected)
2. Add help text: "Your Telegram Chat ID — send a message to @userinfobot to find it"
3. Add Connect with Stripe step to onboarding (after notification preference)
4. Make Connect optional in onboarding — seller can skip and connect later from Settings
5. Remove old Stripe key fields from onboarding entirely

6. Build static FAQ page at `/faq`:
   - Accordion UI — expandable/collapsible per question
   - Questions hardcoded as an array in the component
   - Initial questions: How much does it cost? How do I get paid? What if I sell out? Do I need a website? How does shipping work? Is it safe for customers to pay? What if someone wants a refund? How long does setup take?
   - Add link to FAQ in landing page footer and nav
   - V4: FAQ becomes DB-driven with admin CRUD interface

**Done when:** Telegram sellers can complete full onboarding without manual DB entry. Connect button visible in onboarding. FAQ page live at `/faq`.

---

## Milestone 6 — Final Deploy and Smoke Test

**Goal:** V3 merged to main, deployed, smoke tested end to end on `my-qrs.co`.

### Tasks
1. Run full smoke test on `v3` branch before merging:
   - Sign up at `my-qrs.co`
   - Complete Connect OAuth
   - Add products
   - Complete test checkout — verify 2% fee in Stripe dashboard
   - Enter custom domain — verify DNS instructions shown
2. Merge `v3` PR to `main`
3. Vercel auto-deploys from main
4. Run production DB migration if not already done
5. Verify `my-qrs.co` live and working

**Done when:** V3 live on `my-qrs.co`. Full smoke test passes. Platform fee collecting.

---

*BuildPlan.md — QRS V3 — June 2026*

---

## Milestone 7 — Packaging Intelligence

**Goal:** AI assigns packaging profiles. Inventory tracked per seller. [Buy Boxes] appears when kits run low. Order fulfillment decrements kit count.

### Tasks
1. Create `src/lib/packaging.ts`:
   - Profile definitions (MUG_A, MUG_B, BOWL_A, BOWL_B, VASE_A, SCULPTURE_A)
   - Uline SKU mapping per profile
   - Cart URL builder: `buildUlineCartUrl(profile, quantity)`
2. Update Prisma schema:
   - Add `PackagingInventory` table
   - Add `packagingProfile String?` to Product
   - Add `packagingEnabled Boolean @default(true)` to Seller
3. Run migration
4. Update Claude Vision AI prompt to return `packagingProfile` alongside existing fields
5. Update Add tab review queue:
   - Show `packagingProfile` as a field (editable — seller can change AI suggestion)
6. Update post-publish flow:
   - Calculate coverage summary per profile
   - Show Packaging Coverage Summary in dashboard after publish
   - Show `[Buy Boxes]` if any profile is below threshold
7. Build `[Buy Boxes]` action:
   - Calculate shortfall quantities
   - Build Uline cart URL
   - Open in new tab
   - Increment `quantityOnHand` immediately
8. Update YES fulfillment handler:
   - Decrement `PackagingInventory.quantityOnHand` for product's profile
   - Flag dashboard if new count <= reorderThreshold
9. Add Packaging settings toggle in dashboard Settings (opt-out)
10. Add packaging instructions to fulfillment notification:
    - Email: "Use MUG_A Kit — 11 remaining"
    - Telegram: same info added to message

**Done when:**
- AI assigns packaging profile during upload
- Coverage summary shows after publish
- `[Buy Boxes]` appears when below threshold, opens Uline, increments count
- Kit count decrements on YES
- Opt-out toggle works

---

*BuildPlan.md — QRS V3 — June 2026*
