# Cursor Prompt — SEO + OG Tags (V1.1)

## Overview

Add basic SEO and Open Graph tags across my-qrs.co. Goal: make pages discoverable by search engines and look great when shared on social media (Instagram, WhatsApp, iMessage, etc.).

No new dependencies needed — use Next.js built-in `metadata` API.

---

## Part 1 — Landing Page (`src/app/page.tsx`)

Add static metadata export:

```typescript
export const metadata: Metadata = {
  title: 'my-qrs.co — Your whole store. One QR code.',
  description: 'Set up an online storefront in 5 minutes. Take a photo, set a price, get a QR code postcard. Built for craft fair vendors, artisan makers, and local sellers.',
  openGraph: {
    title: 'my-qrs.co — Your whole store. One QR code.',
    description: 'Set up an online storefront in 5 minutes. Built for craft fair vendors, artisan makers, and local sellers.',
    url: 'https://my-qrs.co',
    siteName: 'my-qrs.co',
    images: [
      {
        url: 'https://my-qrs.co/og-default.png',
        width: 1200,
        height: 630,
        alt: 'my-qrs.co — Your whole store. One QR code.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'my-qrs.co — Your whole store. One QR code.',
    description: 'Set up an online storefront in 5 minutes. Built for craft fair vendors and local sellers.',
    images: ['https://my-qrs.co/og-default.png'],
  },
}
```

---

## Part 2 — How It Works Page (`src/app/how-it-works/page.tsx`)

```typescript
export const metadata: Metadata = {
  title: 'How it works — my-qrs.co',
  description: 'Sign up, connect Stripe, add products, get your QR code postcard, and start selling. Five steps to your online store.',
  openGraph: {
    title: 'How it works — my-qrs.co',
    description: 'Five steps to your online store. Built for craft fair vendors and local sellers.',
    url: 'https://my-qrs.co/how-it-works',
    siteName: 'my-qrs.co',
    images: [{ url: 'https://my-qrs.co/og-default.png', width: 1200, height: 630 }],
    type: 'website',
  },
}
```

---

## Part 3 — FAQ Page (`src/app/faq/page.tsx`)

```typescript
export const metadata: Metadata = {
  title: 'FAQ — my-qrs.co',
  description: 'Frequently asked questions about my-qrs.co — how it works, pricing, payments, shipping, and more.',
  openGraph: {
    title: 'FAQ — my-qrs.co',
    description: 'Everything you need to know about selling on my-qrs.co.',
    url: 'https://my-qrs.co/faq',
    siteName: 'my-qrs.co',
    images: [{ url: 'https://my-qrs.co/og-default.png', width: 1200, height: 630 }],
    type: 'website',
  },
}
```

---

## Part 4 — Seller Storefront (`src/app/[slug]/page.tsx`)

Dynamic metadata per seller. Fetch seller data server-side and generate metadata:

```typescript
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const seller = await prisma.seller.findUnique({
    where: { slug: params.slug },
    include: { heroImages: { orderBy: { order: 'asc' }, take: 1 } },
  })

  if (!seller) {
    return {
      title: 'Store not found — my-qrs.co',
    }
  }

  const heroImageUrl = seller.heroImages[0]?.url ?? 'https://my-qrs.co/og-default.png'
  const storeUrl = `https://my-qrs.co/${seller.slug}`

  return {
    title: `${seller.storeName} — Shop on my-qrs.co`,
    description: `Browse and buy from ${seller.storeName}. Scan the QR code or visit ${storeUrl} to shop.`,
    openGraph: {
      title: seller.storeName,
      description: `Browse and buy from ${seller.storeName} on my-qrs.co.`,
      url: storeUrl,
      siteName: 'my-qrs.co',
      images: [
        {
          url: heroImageUrl,
          width: 1200,
          height: 630,
          alt: seller.storeName,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seller.storeName,
      description: `Browse and buy from ${seller.storeName} on my-qrs.co.`,
      images: [heroImageUrl],
    },
  }
}
```

---

## Part 5 — Root Layout (`src/app/layout.tsx`)

Add default metadata as fallback:

```typescript
export const metadata: Metadata = {
  title: {
    default: 'my-qrs.co',
    template: '%s — my-qrs.co',
  },
  description: 'Your whole store. One QR code. Built for craft fair vendors and local sellers.',
  metadataBase: new URL('https://my-qrs.co'),
}
```

---

## Part 6 — Sitemap (`src/app/sitemap.ts`)

Create `src/app/sitemap.ts`:

```typescript
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sellers = await prisma.seller.findMany({
    where: { stripeConnectOnboarded: true },
    select: { slug: true, updatedAt: true },
  })

  const sellerUrls = sellers.map(seller => ({
    url: `https://my-qrs.co/${seller.slug}`,
    lastModified: seller.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: 'https://my-qrs.co',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://my-qrs.co/how-it-works',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://my-qrs.co/faq',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...sellerUrls,
  ]
}
```

---

## Part 7 — robots.txt (`src/app/robots.ts`)

Create `src/app/robots.ts`:

```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/api/', '/onboarding'],
    },
    sitemap: 'https://my-qrs.co/sitemap.xml',
  }
}
```

---

## Part 8 — Default OG Image

Create a placeholder file at `public/og-default.png`. This should be a simple 1200×630 image with:
- QRS orange background (#FF6B35)
- White text: "my-qrs.co"
- Subtext: "Your whole store. One QR code."

If generating an image is complex, use a solid orange 1200×630 PNG as placeholder and note that a proper OG image should be designed later.

---

## Engineering Rules

- Use Next.js `Metadata` type from `'next'` — do not use HTML meta tags directly
- `metadataBase` must be set in root layout for relative OG image URLs to resolve correctly
- `generateMetadata` on the seller storefront must not throw if seller is not found — return minimal metadata
- Sitemap only includes sellers with `stripeConnectOnboarded: true` — do not expose inactive stores
- Do not add `/dashboard`, `/admin`, `/onboarding`, or `/api` routes to sitemap
- Run `npm run build` and confirm it passes before closing

## Do Not Touch

- Any existing page content or components
- Schema or migrations
- Notification service
- Admin dashboard
- Any API routes
