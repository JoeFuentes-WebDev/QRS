# QRS — Product Vision
## MVP

---

## What It Is

QRS is a lightweight multi-tenant storefront platform for anyone selling physical goods who needs an online presence fast. No technical skills required. Onboarding under 5 minutes. Mobile-first from day one.

Sellers get a public shop at `qrs.app/[slug]`. Customers browse via a swipe UI, add to cart, and check out with Stripe. Seller gets notified and ships.

---

## The Core Use Case

A seller at a street market, craft fair, or pop-up hands a customer a postcard with a QR code. Customer scans it, browses the catalogue, buys. The app turns a one-time in-person encounter into a repeat purchase relationship.

QRS is the repeat purchase engine. The stall is the acquisition channel.

---

## Who It Is For

- Street market and craft fair vendors
- Farmers market sellers (jam, hot sauce, soap, candles)
- Artists selling prints or originals
- Jewelry and accessory makers
- Vintage and thrift resellers
- Anyone with physical goods and no online store

---

## What Makes It Different

- QR postcard to live shop in under 5 minutes
- Swipe-based browse UX — feels like flipping through a seller's table
- No platform takes a cut until you're selling at volume (freemium)
- Fulfillment handled via email or Telegram + auto-generated shipping label
- One-of-a-kind and multi-quantity products both supported

---

## MVP Scope

- Multi-tenant: any seller can sign up and get their own shop
- Auth via Clerk (signup, login, session)
- Public shop at `/[slug]`
- Seller dashboard at `/dashboard`
- Product management: add, edit, remove, AI-assisted tagging via Claude Vision
- Quantity support (null = unlimited, 1 = one-of-a-kind)
- Fulfillment: seller's choice — email (Resend) or Telegram + Shippo
- Seller's own Stripe keys (platform takes no cut in MVP)
- Freemium model: free up to X sales/month, 1% per transaction above threshold (Stripe Connect)
- Custom domain field in settings (placeholder only — V3 feature)
- Skip hint: "comes back around" on first use
- Bug fix: action buttons fire correctly in collapsed card state

---

## Out of Scope for MVP

- Custom domains (data model ready, UI placeholder only)
- Subdomain per seller
- Bulk add/remove
- Pre-order / "ships by" date
- Event expiry / archive
- Low stock countdown display
- Analytics dashboard
- Loyalty / retention features
- Multi-location

---

## Version Roadmap

| Version | Focus |
|---------|-------|
| V1 | QRS — single tenant, shipped |
| **MVP** | **Multi-tenant MVP. Any seller can sign up and sell.** |
| V3 | Custom domains, Stripe Connect platform fee, subdomain routing |
| V4 | Bulk operations, pre-order, analytics, loyalty |

---

## Positioning

QRS is not QOA. QOA is a food ordering and pickup platform. QRS is mail order only. Seller ships the product. No pickup queue, no "order ready" flow.

---

*ProductVision.md — QRS — June 2026*
