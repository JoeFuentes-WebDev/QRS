# QRS — Schema Changes
## V3

---

## What Changes

Three Stripe key fields removed from Seller. Two Connect fields added. `customDomain` activated (already exists, no schema change needed).

---

## Migration

```prisma
// Remove from Seller:
// - stripeSecretKey
// - stripePublishableKey
// - stripeWebhookSecret

// Add to Seller:
stripeConnectAccountId  String?
stripeConnectOnboarded  Boolean @default(false)
```

### Migration file
```sql
ALTER TABLE "Seller" DROP COLUMN IF EXISTS "stripeSecretKey";
ALTER TABLE "Seller" DROP COLUMN IF EXISTS "stripePublishableKey";
ALTER TABLE "Seller" DROP COLUMN IF EXISTS "stripeWebhookSecret";
ALTER TABLE "Seller" ADD COLUMN "stripeConnectAccountId" TEXT;
ALTER TABLE "Seller" ADD COLUMN "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false;
```

---

## Updated Seller Model

```prisma
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
  telegramChatId    String?   // Now collected in onboarding
  shippoApiKey      String?
  shippoFromName    String?
  shippoFromStreet  String?
  shippoFromCity    String?
  shippoFromState   String?
  shippoFromZip     String?
  shippoFromEmail   String?
  shippoFromPhone   String?

  // Stripe Connect (replaces per-seller keys)
  stripeConnectAccountId  String?
  stripeConnectOnboarded  Boolean @default(false)

  // Freemium tracking
  monthlyOrderCount  Int      @default(0)
  billingPeriodStart DateTime @default(now())

  // Custom domain (active in V3)
  customDomain String? @unique

  // Relations
  products   Product[]
  heroImages HeroImage[]
  orders     Order[]

  @@index([slug])
  @@index([customDomain])
  @@index([clerkUserId])
}
```

---

## V2 Seller Migration

Sellers who set up Stripe keys in V2 will have those keys removed. They will need to reconnect via Stripe Connect.

**Migration strategy:**
- Run schema migration (drops old key fields, adds Connect fields)
- All existing sellers will have `stripeConnectOnboarded: false`
- Dashboard shows "Connect your Stripe account to accept payments" banner for all existing sellers
- Sellers click Connect, complete OAuth, back in business

No orders are lost. No products are affected. Only payment configuration changes.

---

## No Other Schema Changes

All other tables (Product, HeroImage, Order, OrderItem) are unchanged.

---

*Schema.md — QRS V3 — June 2026*

---

## Packaging Intelligence Schema additions

### New Table: PackagingInventory

```prisma
model PackagingInventory {
  id               String   @id @default(cuid())
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  sellerId         String
  seller           Seller   @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  profile          String   // e.g. "MUG_A", "BOWL_A"
  quantityOnHand   Int      @default(0)
  reorderThreshold Int      @default(5)
  pendingOrder     Boolean  @default(false)
  pendingQuantity  Int      @default(0)

  @@unique([sellerId, profile])
  @@index([sellerId])
}
```

### Updated Product Table

```prisma
// Add to Product model:
packagingProfile    String?   // e.g. "MUG_A" — assigned by AI, confirmed by seller
```

### Updated Seller Table

```prisma
// Add to Seller model:
packagingEnabled    Boolean @default(true)  // opt-out flag
```


---

## Shipping Model

### Updated Seller Table

```prisma
// Add to Seller model:
shippingModel    ShippingModel @default(BAKED_IN)

enum ShippingModel {
  BAKED_IN    // Seller absorbs shipping cost — no line item at checkout
  SEPARATE    // Buyer pays shipping — calculated via Shippo at checkout
}
```

### How It Works

**BAKED_IN:**
- No shipping line item in Stripe checkout
- Seller responsible for pricing products to cover shipping
- Simplest setup — no Shippo rate calculation needed at checkout

**SEPARATE:**
- Checkout API calls Shippo rate calculation before creating Stripe session
- Inputs: seller origin address, buyer shipping address, package dimensions (from PackagingProfile or product-level estimate)
- Returns available carrier rates
- Seller configures preferred rate option in Settings (e.g. cheapest, USPS Ground only)
- Stripe checkout displays shipping as a separate line item
- Buyer sees full cost before paying

### Integration with Packaging Intelligence
If seller uses packaging profiles, box dimensions are already known per product. Shippo rate calculation uses those dimensions automatically — no manual entry needed per product.

### New Seller Settings Fields
- `shippingModel` — BAKED_IN or SEPARATE (checkbox in onboarding and Settings)
- `preferredShippingRate` — e.g. "cheapest", "usps_ground" (only relevant if SEPARATE)


---

## Shipping Model — Revised

### Default: BAKED_IN
Seller rolls shipping cost into product price. No Shippo required. One price at checkout. Zero friction.

Appropriate for: local/regional sellers, new sellers, sellers without Shippo account.

### Upgrade: SEPARATE  
Seller sets up Shippo. At checkout, QRS calls Shippo rate API with seller origin + buyer destination + package dimensions from packaging profile. Returns real shipping cost. Stripe checkout shows product price + shipping = total. Buyer pays actual shipping. Seller does nothing extra.

Appropriate for: sellers with national reach, high-volume sellers, sellers who want pricing transparency.

### Default Logic
- No Shippo API key configured → BAKED_IN (only option)
- Shippo API key configured → seller can choose BAKED_IN or SEPARATE in Settings

### Onboarding
- Shippo not mentioned during onboarding — keeps setup fast
- Settings page has "Upgrade to real-time shipping" section explaining Shippo with link to shippo.com
- Seller can set up Shippo and switch to SEPARATE any time after launch

### Schema (unchanged from previous)
```prisma
shippingModel    ShippingModel @default(BAKED_IN)
preferredShippingRate  String?  // e.g. "cheapest", "usps_ground" — only if SEPARATE

enum ShippingModel {
  BAKED_IN
  SEPARATE
}
```

### No shippingCost field on Product
Real-time Shippo rate at checkout replaces any static estimate. BAKED_IN sellers price products to cover shipping — no separate field needed.

