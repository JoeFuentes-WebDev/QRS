# Cursor Prompt — Platform Admin Dashboard

## Overview

Build a platform admin dashboard at `/admin`. This page is for the platform owner (Joe) only. It is already password-protected via `ADMIN_PASSWORD` env var — do not change the auth mechanism.

Replace the current `/admin` placeholder with a fully functional dashboard. No tabs, no accordions (except the postcard generator section). Single scrollable page with clear section headings.

---

## Stack

- Next.js App Router server component (fetch data server-side from Prisma)
- Tailwind CSS for styling — keep it clean and minimal, not fancy
- No new dependencies
- No new API routes — query Prisma directly in the server component

---

## Section 1 — Platform Overview (number cards)

Show 6 stat cards in a grid (3 per row on desktop, 2 per row on mobile):

1. **Total Sellers** — `COUNT(*)` from Seller table
2. **Active Sellers** — `COUNT(*)` where `stripeConnectOnboarded = true`
3. **New Sellers (30 days)** — `COUNT(*)` where `createdAt >= now() - 30 days`
4. **Total Orders** — `COUNT(*)` from Order table
5. **Total Revenue** — sum of all Order totals × 0.02 (2% platform fee). Order total = sum of `OrderItem.priceSnapshot × quantity`. Display in dollars (divide cents by 100).
6. **Orders (30 days)** — `COUNT(*)` from Order where `createdAt >= now() - 30 days`

Each card: label on top, large number below. Clean white card, subtle border, no shadows needed.

---

## Section 2 — Seller List

A simple table with these columns:

| Store Name | Slug | Stripe | Products | Orders | Signed Up | Store |
|------------|------|--------|----------|--------|-----------|-------|

- **Store Name** — seller.storeName
- **Slug** — seller.slug
- **Stripe** — green "Connected" or yellow "Pending" based on `stripeConnectOnboarded`
- **Products** — count of seller's products
- **Orders** — count of seller's orders
- **Signed Up** — seller.createdAt formatted as MMM DD, YYYY
- **Store** — link icon that opens `https://my-qrs.co/{slug}` in a new tab

Sort by `createdAt` descending (newest first). No pagination for now — render all sellers.

---

## Section 3 — Recent Activity

Show last 20 rows from the `AnalyticsEvent` table (Prisma model: `AnalyticsEvent`), ordered by `createdAt` descending.

For each event show:
- Event name (bold)
- `userId` (truncated to first 12 chars)
- Properties (JSON, truncated if long — max 80 chars, show `...` if cut off)
- Timestamp (formatted as MMM DD, HH:MM)

Simple list, no table needed. Monospace font for properties.

---

## Section 4 — Recent Errors

Query `AnalyticsEvent` where `event IN ('stripe.connect_failed', 'checkout.failed')`, last 10, ordered by `createdAt` descending.

For each error show:
- Event name in red
- `userId` 
- Error message from properties (extract `properties.error` if available)
- Timestamp

If no errors: show "No recent errors" in muted text.

---

## Section 5 — SA Postcard Generator (collapsible)

A collapsible section (use HTML `<details>/<summary>` — no JS needed).

Inside:
- Label: "Campaign name (utm_source)" — text input, placeholder "e.g. japantown-jan2027", default value "organic"
- Label: "Channel (utm_medium)" — select dropdown with options:
  - `sa-postcard` — "Seller Acquisition Postcard" (default)
- Download button — on click, navigates to `/api/postcard/seller-acquisition?utm_source={value}&utm_medium={medium}`
- Small note below: "Leave campaign name blank to use 'organic' as default."

This is a client component (`'use client'`) since it needs form interactivity. Extract it as `<PostcardGenerator />` and import it into the server page.

---

## Page Layout

```
/admin
├── "Platform Admin" heading (large, top of page)
├── Section 1: Overview cards
├── Section 2: Seller List  
├── Section 3: Recent Activity
├── Section 4: Recent Errors
└── Section 5: SA Postcard Generator (collapsible)
```

Sections separated by a horizontal rule or clear spacing. No sidebar. No navigation beyond what's already on the page.

---

## Data Queries

All Prisma queries go directly in the server component (no separate service functions needed for this admin-only page).

For Section 1 revenue calculation:
```typescript
const orders = await prisma.order.findMany({
  include: { items: true }
})
const totalRevenue = orders.reduce((sum, order) => {
  const orderTotal = order.items.reduce((s, item) => s + item.priceSnapshot * item.quantity, 0)
  return sum + Math.floor(orderTotal * 0.02)
}, 0)
```

---

## Do Not Touch

- The password gate logic on `/admin` — leave exactly as is
- Any other routes or components
- Schema or migrations
- `src/lib/dotell.ts` or `src/services/analytics.service.ts`
- Vercel.json

---

## Engineering Rules

- Server component by default — only `<PostcardGenerator />` needs `'use client'`
- No inline Prisma in client components
- All monetary values stored in cents, displayed in dollars
- Run `npm run build` and confirm it passes before closing
