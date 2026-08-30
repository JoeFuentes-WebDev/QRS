# QRS — Database Schema
## MVP

---

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── SELLER ───────────────────────────────────────────────────────────────────

model Seller {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Identity
  clerkUserId String @unique
  email       String @unique
  phone       String?
  storeName   String
  slug        String @unique

  // Fulfillment preference
  fulfillmentType FulfillmentType @default(EMAIL)

  // Email fulfillment
  notificationEmail String?

  // Telegram + Shippo fulfillment
  telegramBotToken  String?
  telegramChatId    String?
  shippoApiKey      String?
  shippoFromName    String?
  shippoFromStreet  String?
  shippoFromCity    String?
  shippoFromState   String?
  shippoFromZip     String?
  shippoFromEmail   String?
  shippoFromPhone   String?

  // Stripe (seller's own keys)
  stripeSecretKey      String?
  stripePublishableKey String?
  stripeWebhookSecret  String?

  // Freemium tracking
  monthlyOrderCount Int      @default(0)
  billingPeriodStart DateTime @default(now())

  // Custom domain (V3)
  customDomain String? @unique

  // Relations
  products   Product[]
  heroImages HeroImage[]
  orders     Order[]

  @@index([slug])
  @@index([customDomain])
  @@index([clerkUserId])
}

enum FulfillmentType {
  EMAIL
  TELEGRAM
}

// ─── PRODUCT ──────────────────────────────────────────────────────────────────

model Product {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sellerId String
  seller   Seller @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  name        String
  description String?
  price       Float
  category    String?
  tags        String[]

  // Quantity: null = unlimited, 1 = one-of-a-kind, N = limited stock
  quantity    Int?
  inStock     Boolean @default(true)

  imageUrl    String?
  imagePublicId String?

  // AI analysis fields
  aiColor     String?
  aiTexture   String?
  aiMaterial  String?
  aiSuggestedPrice Float?

  orderItems OrderItem[]

  @@index([sellerId])
  @@index([sellerId, inStock])
  @@index([sellerId, category])
}

// ─── HERO IMAGE ───────────────────────────────────────────────────────────────

model HeroImage {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  sellerId String
  seller   Seller @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  imageUrl      String
  imagePublicId String

  @@index([sellerId])
}

// ─── ORDER ────────────────────────────────────────────────────────────────────

model Order {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sellerId String
  seller   Seller @relation(fields: [sellerId], references: [id])

  stripeSessionId  String  @unique
  stripePaymentIntent String?

  status OrderStatus @default(PENDING)

  // Buyer info
  buyerName    String?
  buyerEmail   String?
  buyerPhone   String?

  // Shipping address (collected by Stripe)
  shippingName    String?
  shippingStreet  String?
  shippingCity    String?
  shippingState   String?
  shippingZip     String?
  shippingCountry String?

  total Float

  orderItems OrderItem[]

  @@index([sellerId])
  @@index([stripeSessionId])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  CANCELLED
  REFUNDED
}

// ─── ORDER ITEM ───────────────────────────────────────────────────────────────

model OrderItem {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())

  orderId String
  order   Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)

  productId String
  product   Product @relation(fields: [productId], references: [id])

  quantity  Int   @default(1)
  unitPrice Float

  @@index([orderId])
  @@index([productId])
}
```

---

## Key Design Decisions

**Seller.clerkUserId** — Links the Clerk session to the seller record. Set during post-signup onboarding. Used by middleware to scope all dashboard queries.

**Product.quantity** — `null` means unlimited inventory. `1` replicates one-of-a-kind behavior. Any positive integer enables limited stock. `inStock` is derived: set to `false` when quantity reaches 0 after a purchase.

**Product.aiSuggestedPrice** — AI suggests a price, seller sets the actual `price`. Never auto-set.

**Seller Stripe keys** — Stored per seller. In V2 the platform uses the seller's keys directly for checkout. Stripe Connect (platform fee) is V3.

**Seller.monthlyOrderCount** — Tracks freemium threshold. Reset by cron on the 1st of each month. When count exceeds threshold (TBD, e.g. 20 orders/month), 1% Connect fee activates in V3.

**Seller.customDomain** — Unique index set now. Middleware hostname lookup is stubbed. No UI exposure in V2 beyond a disabled settings field.

**Cascade deletes** — Deleting a Seller cascades to Products and HeroImages. Orders are preserved (financial record).

---

## Migration from QRS (V1)

V1 had no Seller table. All products/orders belonged to a single implicit owner.

V2 migration steps:
1. Add `Seller` table and create a single seed seller for Laura
2. Add `sellerId` columns to all tables with a default pointing to Laura's seed seller ID
3. Make `sellerId` required going forward
4. Run `prisma migrate deploy`

---

*Schema.md — QRS — June 2026*
