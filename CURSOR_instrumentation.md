# Cursor Prompt — Complete QRS Instrumentation

## Overview

Add comprehensive analytics instrumentation across QRS. Two layers:
- **Server-side**: dotell writes to Neon `events` table (already wired)
- **Client-side**: dotell sends to PostHog via anonymous identity model

Do not change any existing event calls. Only add new ones.

---

## Part 1 — Enrich Existing Server-Side Events

### `order.placed` — add items array

In `src/app/api/webhooks/stripe/route.ts`, update the `order.placed` trackSellerEvent call to include:

```typescript
void trackSellerEvent(order.seller.clerkUserId, 'order.placed', {
  orderId: order.id,
  sellerId: order.seller.clerkUserId,
  total: order.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0),
  itemCount: order.items.length,
  items: order.items.map(item => ({
    productId: item.productId,
    name: item.product.name,
    price: item.priceSnapshot,
    quantity: item.quantity,
  })),
})
```

Make sure the order query includes `items.product` relation so `item.product.name` is available.

---

## Part 2 — New Server-Side Events

### Product events

In `src/app/dashboard/products/actions.ts`:

- `product.added` — fire after successful `createProduct`, properties: `{ sellerId, productId, category, price }`
- `product.edited` — fire after successful `updateProduct`, properties: `{ sellerId, productId }`
- `product.unpublished` — fire when `togglePublish` sets `published: false`, properties: `{ sellerId, productId }`
- `product.deleted` — fire after successful `deleteProduct`, properties: `{ sellerId, productId }`

### Postcard downloaded

In `src/app/api/postcard/route.ts`, fire after successful PDF generation:

```typescript
void trackSellerEvent(seller.clerkUserId, 'postcard.downloaded', { sellerId: seller.clerkUserId, slug: seller.slug })
```

### Stripe Connect failed

In `src/app/api/stripe/connect/route.ts`, in the catch block, add:

```typescript
void trackSellerEvent(seller.clerkUserId, 'stripe.connect_failed', {
  sellerId: seller.clerkUserId,
  error: error instanceof Error ? error.message : 'unknown',
})
```

### Checkout failed

In `src/app/api/checkout/session/route.ts`, in the catch block, add:

```typescript
void trackSellerEvent(seller.clerkUserId, 'checkout.failed', {
  sellerId: seller.clerkUserId,
  error: error instanceof Error ? error.message : 'unknown',
})
```

---

## Part 3 — Client-Side Events (PostHog via dotell anonymous identity)

### Setup — anonymous dotell client

Create `src/lib/dotell-client.ts`:

```typescript
import { initDotell } from '@joefuentes/dotell'

export const dotellClient = initDotell({
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  model: 'anonymous',
})
```

This is the client-side dotell instance. Use it only in client components (`'use client'`).

### Buyer storefront events

In `src/components/shop/shop-experience.tsx` (or equivalent buyer storefront component):

On mount, initialize anonymous identity and fire storefront events:

```typescript
useEffect(() => {
  const visitedSlugs = JSON.parse(localStorage.getItem('qrs_visited_slugs') || '[]')
  const isReturn = visitedSlugs.includes(slug)

  dotellClient.identify(getOrCreateAnonymousId())

  if (isReturn) {
    dotellClient.track('storefront.returned', { slug, sellerId })
  } else {
    dotellClient.track('storefront.viewed', { slug, sellerId })
    localStorage.setItem('qrs_visited_slugs', JSON.stringify([...visitedSlugs, slug]))
  }
}, [slug])
```

Create helper `getOrCreateAnonymousId()`:

```typescript
function getOrCreateAnonymousId(): string {
  const key = 'qrs_anonymous_id'
  const existing = localStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}
```

### Product events (buyer)

- `product.viewed` — fires when a product card becomes visible in the swipe UI. Use IntersectionObserver on each product card. Properties: `{ productId, slug, sellerId }`
- `product.details_viewed` — fires when buyer taps to see product detail. Properties: `{ productId, slug, sellerId }`
- `product.saved` — fires when buyer saves/likes a product. Properties: `{ productId, slug, sellerId }`
- `product.skipped` — fires when buyer swipes past/dismisses a product. Properties: `{ productId, slug, sellerId }`
- `cart.item_added` — fires when buyer adds product to cart. Properties: `{ productId, price, slug, sellerId }`

### Checkout events (buyer)

- `checkout.started` — fires when buyer taps the checkout button. Properties: `{ slug, sellerId, itemCount, total }`
- `checkout.completed` — fires on `/[slug]/success` page on mount. Properties: `{ slug, sellerId, sessionId }` — extract from URL params.

### Marketing funnel events

In each page component, fire on mount:

- `landing.viewed` — on `src/app/page.tsx`. Properties: `{ utm_source }` extracted from URL search params if present.
- `landing.cta_clicked` — fires when buyer clicks "Get started" or any primary CTA on landing page. Properties: `{ utm_source, cta_label }`
- `howitworks.viewed` — on `src/app/how-it-works/page.tsx`. Properties: `{ utm_source }` if present.
- `faq.viewed` — on `src/app/faq/page.tsx`. No properties needed.

---

## Part 4 — Seller Acquisition Postcard UTM Support

In `src/app/api/postcard/seller-acquisition/route.ts`:

- Accept optional `utm_source` query parameter
- If not provided, default to `'organic'`
- QR code inside the postcard points to `https://my-qrs.co?utm_source={utm_source}`
- No other changes to postcard layout

---

## Engineering Rules

- All client-side dotell calls use `dotellClient` from `src/lib/dotell-client.ts` — never import the server dotell instance in client components
- All server-side dotell calls use `trackSellerEvent` from `src/services/analytics.service.ts` — no changes to this function
- All dotell calls are fire-and-forget (`void`) — never await, never block UI or API response
- Never catch and surface dotell errors to the user
- `getOrCreateAnonymousId()` and `qrs_visited_slugs` use localStorage — wrap in try/catch in case localStorage is unavailable (private browsing)
- `product.viewed` via IntersectionObserver — use a threshold of 0.5 (50% visible) before firing. Fire once per product per session, not on every scroll.
- Do not add any new Prisma models or migrations
- Do not change any existing event names or properties
- Run `npm run build` and confirm it passes before closing

## Do Not Touch

- `src/lib/dotell.ts` — server-side dotell instance, leave unchanged
- `src/services/analytics.service.ts` — leave unchanged
- Any existing trackSellerEvent call sites — only add new ones
- Any schema or migration files
- Any existing UI components beyond adding event tracking calls
