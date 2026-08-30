# QRS — Architecture
## MVP

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (admin/dashboard), custom (shop UI) |
| Auth | Clerk |
| Database | Prisma 5 + Neon (Postgres) |
| Image Storage | Cloudinary |
| AI Tagging | Anthropic Claude Vision API |
| Payments | Stripe (seller's own keys, per-seller config) |
| Platform Fee | Stripe Connect (freemium: free up to X sales, 1% above threshold) |
| Email Fulfillment | Resend |
| Telegram Fulfillment | Telegram Bot API + Shippo |
| Deployment | Vercel |
| Repo | qrs — main branch |

---

## Multi-Tenant Model

Every resource is scoped to a `Seller`. All existing tables (Product, HeroImage, Order, OrderItem) get a `sellerId` foreign key. Queries always filter by `sellerId`. No seller can access another seller's data.

---

## URL Structure

| Route | Description |
|-------|-------------|
| `/` | Marketing/signup landing page |
| `/sign-up` | Clerk signup flow |
| `/sign-in` | Clerk login flow |
| `/dashboard` | Seller admin (post-login, scoped to logged-in seller) |
| `/[slug]` | Public shop (no auth required) |
| `/[slug]/success` | Post-Stripe confirmation |

Slug is set during onboarding. Unique, URL-safe, lowercase. Cannot be changed after creation (V2).

---

## Auth Flow (Clerk)

1. Seller visits `/` and clicks "Get Started"
2. Clerk signup: email, password
3. Post-signup onboarding wizard (in-app, not Clerk):
   - Store name
   - Slug (auto-suggested from store name, editable)
   - Phone
   - Notification preference: Email or Telegram + Shippo
   - If Email: confirm email address for order notifications
   - If Telegram + Shippo: enter Bot token, Shippo key, origin address
4. Stripe keys entered in Settings (not blocking onboarding — seller can add later)
5. Land in `/dashboard`

Clerk session middleware protects `/dashboard` and all `/api/seller/*` routes. Public shop routes (`/[slug]`) require no auth.

---

## Fulfillment Paths

### Email (Resend)
- Stripe webhook fires on `checkout.session.completed`
- Order saved to DB
- Resend sends order notification to seller's email: product name, buyer name, shipping address, order total
- Seller fulfills manually

### Telegram + Shippo
- Stripe webhook fires on `checkout.session.completed`
- Order saved to DB
- Telegram sends seller: product photo + YES/NO inline buttons
- Seller taps YES: Shippo generates shipping label, sends PDF to Telegram
- Seller taps NO: Stripe refund issued, item back in stock
- Uses per-seller Bot token and Shippo key stored in Seller table

---

## Per-Seller Stripe Configuration

Each seller stores their own Stripe secret key and publishable key in the Seller table (encrypted at rest via environment-level encryption or Vercel secret management).

Checkout sessions are created using the seller's Stripe keys, not a platform key.

Platform fee (Stripe Connect) is V3. In V2, the platform takes no cut.

Freemium tracking: `monthlyOrderCount` on Seller, reset on the 1st of each month via a Vercel cron job. When count exceeds threshold, 1% Connect fee activates. (Connect infrastructure stubbed in V2, activated in V3.)

---

## Cloudinary

Each seller's images are uploaded to a Cloudinary folder scoped by `sellerId`: `qrs/[sellerId]/products/` and `qrs/[sellerId]/hero/`. Platform uses a single Cloudinary account. No per-seller Cloudinary keys needed.

---

## Custom Domain (Placeholder)

`customDomain` field on Seller table. Settings UI shows the field as disabled with a "Coming soon" label. Next.js middleware has a hostname check stub that can be activated in V3 without schema changes.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Marketing/signup landing |
| `src/app/dashboard/page.tsx` | Seller admin (replaces /admin) |
| `src/app/[slug]/page.tsx` | Public shop |
| `src/app/[slug]/success/page.tsx` | Post-checkout confirmation |
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhook — order save + fulfillment trigger |
| `src/app/api/webhooks/telegram/route.ts` | Telegram YES/NO handler |
| `src/middleware.ts` | Clerk auth protection + custom domain stub |
| `src/lib/fulfillment.ts` | Fulfillment router (email vs Telegram) |
| `src/lib/resend.ts` | Email order notification |
| `src/lib/telegram.ts` | Telegram API utilities (per-seller) |
| `src/lib/stripe.ts` | Per-seller Stripe client factory |
| `src/lib/ai-analysis.ts` | Claude Vision tagging |
| `src/components/shop/SwipeCard.tsx` | Swipe UI card |
| `prisma/schema.prisma` | Full multi-tenant schema |

---

*Architecture.md — QRS — June 2026*
