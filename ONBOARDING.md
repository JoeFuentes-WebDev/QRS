# ONBOARDING.md

## SECTION 1 — HUMAN SUMMARY

my-qrs.co is a multi-tenant storefront platform for craft fair and street market sellers. **V3 feature build is complete (M1–M7).** **M8 (production deploy) code is complete:** settings page, store URL display, and build are clean. Remaining M8 work is manual — Resend domain, production Neon migration, live Stripe keys, smoke test, merge `v3` → `main`. Regenerate this file when domain decisions change or a new integration is added.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Project Name and Description

**my-qrs.co** — Multi-tenant storefront platform enabling craft/street market sellers to sell online via QR-linked storefronts with guest checkout.

---

### 2. What It Does and Who It's For

**Sellers:** Independent artisan vendors. Sign up via Clerk, complete onboarding (store name, slug, notification email), connect Stripe Connect Express, manage products at `/dashboard/products`, fulfill orders at `/dashboard/orders`, download a QR postcard from the dashboard. No per-seller Stripe key setup.

**Buyers:** Anonymous guests. Open `/{slug}`, browse the swipe UI, check out via Stripe Checkout. No account required.

**Admin:** Password-gated `/admin` page. No full admin UI until V4. Suspension/deletion via Neon console.

---

### 3. Folder Structure and Layer Responsibilities

```
src/app/
  page.tsx, how-it-works/, privacy/, terms/     → Marketing / static
  faq/page.tsx                                  → Platform FAQ (hardcoded)
  sign-in/, sign-up/                            → Clerk auth
  onboarding/                                   → Post-signup seller wizard
  dashboard/                                    → Seller admin (Clerk-protected)
    page.tsx                                    → Home: Stripe Connect, orders link, postcard
    products/                                   → Product CRUD (server actions)
    orders/                                     → Order list and detail
    settings/                                   → Notification email, store info, shipping copy
    stripe/refresh|return                        → Connect onboarding callbacks
  [slug]/                                       → Public buyer storefront
  admin/                                        → Password-gated (env var, not Clerk)
  api/
    webhooks/stripe/                            → Order creation, stock decrement, notifications
    [slug]/checkout/                            → Checkout session creation
    orders/[id]/accept|decline|fulfill/         → Seller order actions
    stripe/connect/                             → Connect onboarding link
    cloudinary/sign/                            → Signed upload for product images
    postcard/, qr/, products/, categories/      → Storefront and seller utilities

src/components/
  shop/                                         → Swipe UI (buyer-facing)
  dashboard/                                    → Admin UI (shadcn-style)
  onboarding/                                   → Onboarding wizard

src/lib/
  prisma.ts                                     → Prisma singleton
  stripe.ts                                     → Platform Stripe client (server-only)
  seller.ts                                     → Seller lookup helpers (Clerk → Seller)
  cloudinary.ts, ai-analysis.ts, qr.ts          → Images, AI tags, QR URLs
  telegram.ts                                   → Telegram send helpers (fire-and-forget)
  shop-product.ts, shop-cart.ts                 → Storefront product mapping and cart
  faq-data.ts, postcard-pdf.ts, dotell.ts       → FAQ, PDF, analytics client

src/services/
  seller.service.ts                             → Seller mutations (Connect, notification email)
  product.service.ts                            → Product queries/mutations (sellerId required)
  order.service.ts                              → Order queries/mutations (sellerId required)
  checkout.service.ts                           → Stripe Checkout sessions (2% platform fee)
  stripeConnect.service.ts                      → Connect Express onboarding
  email.service.ts                              → Buyer order confirmation (Resend)
  notification.service.ts                       → Seller new-order alerts (email + optional Telegram)
  analytics.service.ts                          → dotell seller events

prisma/schema.prisma                            → Source of truth for entities
vercel.json                                     → Postcard route only: 3008MB, 30s maxDuration
.cursorrules                                    → Env var and layer policy
```

**Layer rules:**

- `/app` routes call services or lib clients. Public slug → seller lookup may use Prisma directly (non-tenant-scoped by slug).
- `/services` own all tenant-scoped Prisma queries. Every function takes `sellerId` as a required parameter.
- `/lib` owns external client instantiation and shared helpers. No tenant business rules.
- `/api/webhooks/stripe` owns Order + OrderItem creation, stock decrement, buyer email, seller notification, and `order.placed` analytics on `checkout.session.completed`.

---

### 4. Tech Stack

| Technology | Role |
|---|---|
| Next.js (App Router) | Full-stack: buyer UI, seller dashboard, API routes |
| Clerk | Seller authentication and middleware |
| Prisma + Neon | Postgres ORM and host |
| Cloudinary | Product image storage and delivery |
| Stripe Connect Express | Payments, destination charges, 2% `application_fee_amount` |
| Resend | Buyer confirmation + seller order notification emails |
| Telegram (optional) | Platform-level seller alert via `TELEGRAM_BOT_TOKEN` + `SELLER_CHAT_ID` |
| Anthropic Claude | AI product tagging (Vision) |
| qrcode | On-the-fly QR PNG for postcard PDF |
| @sparticuz/chromium | Server-side postcard PDF in Vercel |
| dotell | Seller-side event analytics (Clerk userId keyed) |
| Vercel | Production deployment |

**Not yet integrated in UI:** Shippo live rates (`shippingModel` / `shippoApiKey` exist in schema; settings shows BAKED_IN copy only).

---

### 5. Layer Rules

**`/app`**
- MAY call services and lib clients.
- MAY query Prisma directly for public slug → seller lookups only.
- MUST NOT expose server-only env vars to client components.

**`/services`**
- OWNS tenant-scoped Prisma queries with `where: { sellerId }`.
- MUST accept `sellerId` as a parameter — never trust client-supplied sellerId.
- MUST NOT call external APIs (Stripe, Resend, etc.) — that belongs in route handlers or dedicated service modules that wrap external calls (checkout, email, notification services are the bounded exceptions for their domains).

**`/lib`**
- Client instantiation and pure helpers only.

**`/api/webhooks/stripe`**
- MUST verify Stripe signature before processing.
- MUST idempotently check `stripeSessionId` before creating an Order.
- OWNS atomic stock decrement + Order/OrderItem creation.

**`/[slug]` storefront**
- MUST gate checkout on `seller.stripeConnectOnboarded`.
- Shop remains browsable when Connect is not complete.

---

### 6. Engineering Rules

**DO:**

- Include `where: { sellerId }` on every tenant-scoped Prisma query.
- Verify Stripe webhook signature; return 400 on failure.
- Idempotency guard on `stripeSessionId` before Order insert.
- Use `NEXT_PUBLIC_APP_URL` for QR codes, Connect return/refresh URLs, and seller-facing shop URL display. If unset, show: "Set NEXT_PUBLIC_APP_URL in your environment variables."
- Apply 2% `application_fee_amount` on every Connect destination charge.
- Snapshot `priceSnapshot` on OrderItem at checkout.
- Decrement stock in the same transaction as Order creation in the webhook.
- Keep FAQ as a hardcoded array. No DB model.
- Generate QR and postcard PDF at request time — do not persist composites.
- Keep Telegram notifications fire-and-forget.
- Keep all execution request-driven — no cron jobs in V3.

**DO NOT:**

- Per-seller Stripe API keys — Connect Express only.
- Prefix secrets with `NEXT_PUBLIC_*`.
- Hardcode `my-qrs.co` in application code (contact emails in marketing copy are fine).
- Seller-facing analytics dashboard, buyer accounts, multi-shop per seller, RLS, staging infra.
- vercel.json overrides except `app/api/postcard/route.ts`.
- Auto-unpublish at zero stock.
- Return platform fee on refunds.

---

### 7. Current Build Phase and Out-of-Scope

**Current phase: V3 complete — M8 production deploy (code done, manual steps pending)**

**Milestone sequence (all code milestones complete):**

| # | Title | Status |
|---|-------|--------|
| M1 | Prisma schema migration | Done |
| M2 | Stripe Connect Express | Done |
| M3 | Shipping model (schema; UI deferred) | Partial — BAKED_IN only in settings |
| M4 | Order model + multi-product checkout | Done |
| M5 | QR postcard, FAQ, dotell analytics | Done |
| M6 | Product CRUD and publish flow | Done |
| M7 | Legacy V2 code removal, build fix | Done |
| M8 | Settings V3, store URL fix, production deploy | Code done — manual deploy steps remain |

**M8 manual steps (developer, not Cursor):**

1. Verify Resend domain; set `RESEND_FROM_EMAIL=orders@my-qrs.co` in Vercel
2. `prisma migrate deploy` on production Neon (confirm no Float-price product rows first)
3. Swap to live Stripe keys; register live webhook → `https://my-qrs.co/api/webhooks/stripe`
4. Set `NEXT_PUBLIC_APP_URL=https://my-qrs.co` in Vercel production
5. Run full smoke test (signup → Connect → product → checkout → order flow)
6. Merge `v3` → `main` and verify Vercel deploy

**Explicitly out of scope for V3:**

- Shippo UI and live rate checkout
- Seller analytics dashboard
- Buyer accounts
- Custom domains
- Admin suspension UI
- Per-product QR codes
- Hero image carousel (removed with V2)
- Cron jobs, queues, background tasks
- Staging environment

---

### 8. Domain Model

#### Seller

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| clerkUserId | String | Unique |
| storeName | String | Set at onboarding; read-only in settings |
| slug | String | Unique; set at onboarding; read-only in settings |
| notificationEmail | String | Editable in `/dashboard/settings` |
| stripeConnectAccountId | String? | Set during Connect onboarding |
| stripeConnectOnboarded | Boolean | `@default(false)` — gates checkout and auto-publish |
| shippingModel | Enum | `BAKED_IN` (default) or `SEPARATE` — UI shows BAKED_IN copy only |
| shippoApiKey | String? | Schema only until Shippo milestone |

**Invariants:**

- One Clerk user = one Seller = one shop.
- Products publish when `stripeConnectOnboarded === true` (create and edit save both set `published: true`).
- Checkout blocked when `stripeConnectOnboarded === false`.

#### Product

| Field | Type | Notes |
|---|---|---|
| price | Int | Cents |
| images | String[] | Cloudinary URLs, max 5 |
| stock | Int | Decremented in webhook transaction |
| published | Boolean | Gated by Stripe Connect |

#### Order / OrderItem

| Order.status | Set by |
|---|---|
| PENDING | Stripe webhook on `checkout.session.completed` |
| ACCEPTED | Seller via dashboard or `/api/orders/[id]/accept` |
| DECLINED | Seller via dashboard or `/api/orders/[id]/decline` |
| FULFILLED | Seller via dashboard or `/api/orders/[id]/fulfill` |
| REFUNDED | Manual DB in V3 |

OrderItem.`priceSnapshot` is immutable (cents at purchase time).

#### Analytics (dotell, seller events)

`SELLER_SIGNED_UP`, `SELLER_ONBOARDING_COMPLETED`, `PRODUCT_PUBLISHED`, `ORDER_PLACED`, `ORDER_ACCEPTED`, `ORDER_DECLINED`, `STRIPE_CONNECTED`

---

### 9. Must-Always and Must-Never

**MUST ALWAYS:**

1. `where: { sellerId }` on tenant-scoped Prisma queries.
2. Stripe webhook signature verification and `stripeSessionId` idempotency.
3. 2% platform fee on every PaymentIntent.
4. `stripeConnectOnboarded` check before rendering pay/checkout.
5. `NEXT_PUBLIC_APP_URL` for URL construction and seller display (with explicit warning if missing).
6. `priceSnapshot` at checkout; atomic stock decrement in webhook.
7. Settings mutations via server actions scoped by `getCurrentSeller().id`.

**MUST NEVER:**

1. Expose secrets via `NEXT_PUBLIC_*` or client bundles.
2. Per-seller Stripe key code paths.
3. Hardcode production domain in shop URL logic.
4. Store QR PNG or postcard PDF in Cloudinary.
5. Cron jobs or retry logic on Telegram.
6. Buyer accounts, multi-shop, seller analytics UI, RLS — all V4.

---

*QRS — ONBOARDING.md — regenerated after M8 code complete — June 2026*
