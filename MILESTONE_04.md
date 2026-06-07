# MILESTONE_04 — Checkout and Fulfillment
## QRS

This prompt begins Milestone 4. Read it fully before writing any code.

---

## Goal

End-to-end order flow works. Buyer checks out via Stripe, order is saved to DB, seller is notified via their chosen fulfillment method (email or Telegram + Shippo). Both fulfillment paths work correctly.

---

## Before You Write Any Code

### Step 1 — Confirm M3 state

Verify the following before starting:
- `/[slug]` renders correct seller's shop
- Swipe UI works, action button bug is fixed
- Cart is scoped to current seller

If any of these are broken, stop and report.

### Step 2 — Read the relevant existing files

- `src/app/api/webhooks/stripe/route.ts` — existing webhook handler
- `src/lib/stripe.ts` — existing Stripe utilities
- `src/lib/telegram.ts` — existing Telegram utilities
- `src/lib/fulfillment.ts` — existing fulfillment router (if present)
- `src/app/[slug]/success/page.tsx` — post-checkout confirmation
- `prisma/schema.prisma` — Order, OrderItem, Seller models

### Step 3 — Describe your implementation plan

Before writing anything, describe in plain English:
- How you will create a per-seller Stripe client using the seller's stored keys
- How the checkout session will be created and linked to the correct seller
- How the webhook handler will identify which seller an order belongs to
- How you will route to email vs Telegram fulfillment based on seller preference

**Wait for approval before writing any code.**

---

## What to Build

### Per-seller Stripe client

- `src/lib/stripe.ts` must export a factory function: `getStripeClient(seller: Seller)`
- Instantiates Stripe with the seller's `stripeSecretKey`
- Never use a platform-wide Stripe key for checkout
- If seller has no Stripe keys configured: return a clear error, do not attempt checkout

### Checkout session creation

- Buyer taps checkout in cart
- API route: `POST /api/[slug]/checkout`
- Look up seller by slug
- Verify seller has Stripe keys configured — if not, show error: "This shop is not accepting payments yet."
- Create Stripe checkout session using seller's Stripe client:
  - Line items: cart contents (product name, price, quantity)
  - Shipping address collection: required
  - Buyer email collection: required
  - Success URL: `/[slug]/success?session_id={CHECKOUT_SESSION_ID}`
  - Cancel URL: `/[slug]`
  - Metadata: `sellerId`, `slug`
- Return session URL, redirect buyer to Stripe hosted checkout

### Stripe webhook handler

- Endpoint: `POST /api/webhooks/stripe`
- Verify webhook signature using seller's `stripeWebhookSecret`
- Handle `checkout.session.completed` event:
  1. Extract `sellerId` from session metadata
  2. Look up seller by `sellerId`
  3. Save order to DB (Order + OrderItems)
  4. Decrement product quantity, set `inStock: false` if quantity reaches 0
  5. Route to fulfillment based on `seller.fulfillmentType`

**Important:** Webhook signature verification must use the seller's webhook secret, not a platform secret.

### Email fulfillment (Resend)

- Triggered when `seller.fulfillmentType === 'EMAIL'`
- Send to `seller.notificationEmail`
- Email contains:
  - Order ID
  - Product name(s), quantity, price per item
  - Order total
  - Buyer name and email
  - Full shipping address
- Use Resend. Install if not already present: `npm install resend`
- Simple HTML email, no fancy template required for M4

### Telegram + Shippo fulfillment

- Triggered when `seller.fulfillmentType === 'TELEGRAM'`
- Reuse existing Laura's Pots flow, updated for per-seller config:
  - Use `seller.telegramBotToken` and `seller.telegramChatId`
  - Use `seller.shippoApiKey` and seller origin address fields
- Telegram message: product photo + buyer name + shipping address + YES / NO inline buttons
- YES: generate Shippo label using seller's Shippo key and origin address, send label image to Telegram
- NO: issue Stripe refund via seller's Stripe client, set product `inStock: true`, restore quantity

### Fulfillment router

- `src/lib/fulfillment.ts` — single function: `routeFulfillment(order, seller)`
- Checks `seller.fulfillmentType` and calls the correct handler
- All fulfillment logic lives here, not in the webhook handler

---

## Testing

Use Stripe test mode throughout:
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC
- Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` during testing
- Verify order appears in DB after checkout
- Verify seller receives email notification (check Resend dashboard or inbox)
- Verify Telegram message fires if using Telegram fulfillment

---

## What NOT to Build in This Milestone

- Freemium tracking (M5)
- Platform fee / Stripe Connect (V3)
- Order history in dashboard (post-MVP)
- Shipment tracking for buyer (post-MVP)

---

## Done When

- Buyer can complete checkout via Stripe hosted checkout
- Order saved to DB with correct `sellerId`, buyer info, shipping address, line items
- Product quantity decremented, `inStock` updated correctly
- Email notification sent to seller on successful order
- Telegram + Shippo flow works for sellers with that preference
- Stripe refund works when seller taps NO in Telegram
- `/[slug]/success` shows order confirmation

---

## Stop Here

Report when M4 is complete:
1. End-to-end checkout works with test card (yes/no)
2. Order saved to DB correctly (yes/no)
3. Email fulfillment fires (yes/no)
4. Telegram + Shippo fulfillment fires (yes/no — skip if not applicable to test seller)
5. Product quantity/inStock updated after purchase (yes/no)
6. Any issues encountered

Do not start Milestone 5 without explicit instruction.

---

*MILESTONE_04.md — QRS — June 2026*
