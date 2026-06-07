# MILESTONE_03 — Public Shop
## QRS

This prompt begins Milestone 3. Read it fully before writing any code.

---

## Goal

The public shop at `/[slug]` is fully functional. Any seller's shop renders correctly scoped to their products. The swipe UI works. The skip hint fires on first use. The action button bug is fixed.

---

## Before You Write Any Code

### Step 1 — Confirm M2 state

Verify the following before starting:
- Seller can add products via the Add tab and they save to DB with correct `sellerId`
- Hero images upload and display correctly
- Settings page saves Stripe keys to Seller record

If any of these are broken, stop and report.

### Step 2 — Read the relevant existing files

- `src/app/shop/page.tsx` — existing swipe UI
- `src/components/shop/SwipeCard.tsx` — swipe card component
- `src/components/shop/` — all shop components
- `src/app/page.tsx` — current landing (to understand hero image loading)
- `prisma/schema.prisma` — Product, HeroImage, Seller models
- `src/lib/seller.ts` — seller lookup helpers

### Step 3 — Describe your implementation plan

Before writing anything, describe in plain English:
- How `/[slug]` will look up the correct seller and scope their products
- How the swipe queue will be built and filtered
- Where the skip hint state will be stored
- Which existing shop components can be reused as-is vs need modification

**Wait for approval before writing any code.**

---

## What to Build

### Public shop route (`/[slug]`)

- Look up Seller by slug
- If slug not found: 404 page — "This shop doesn't exist (yet)."
- If found: render the seller's shop

**Page loads:**
- Seller's hero images as rotating background (same pattern as Laura's Pots)
- Seller's store name
- Category pills built dynamically from seller's products
- "Show All" pill
- Entry to swipe UI on category/show all tap

---

### Swipe UI

Reuse existing swipe UI as much as possible. Key changes:

**Product queue:**
- Filter by `sellerId` and `inStock: true`
- Filter by selected category if a category pill is active
- Queue loops — skipped cards return to the back
- Out of stock products never appear in the queue

**Quantity handling:**
- On successful purchase: decrement `quantity` by items purchased
- If `quantity` reaches 0: set `inStock: false`
- If `quantity` is null: unlimited, never set `inStock: false` on purchase

**Action buttons — bug fix (REQUIRED):**
- In collapsed card state, action buttons (✕ ♥ 📌) must fire their action immediately
- They must NOT trigger card expand
- Add `e.stopPropagation()` to all three action button click/tap handlers in `SwipeCard.tsx`
- Tap-to-expand handler must live on the card/image area only, not on the buttons

**Skip hint (first use only):**
- On the very first ✕ skip in a browser session, show a one-time tooltip on the skip button: "Skipped items come back around"
- Use localStorage to track whether the hint has been shown (`qrs_skip_hint_shown`)
- Dismiss on any interaction
- Never show again after dismissal

---

### Cart and saved

- Reuse existing cart/saved bottom sheet
- Scope cart items to the current seller's shop only (cart clears on slug change)
- Cart icon in header shows item count

---

### Post-checkout confirmation (`/[slug]/success`)

- Thank you message
- Order summary (items, total)
- "Continue shopping" link back to `/[slug]`

---

### Hardcoded string cleanup (do this first)

Before touching any shop routing, audit the entire codebase for hardcoded strings and replace them:

- Any "Laura's Pots" in page titles, meta tags, or UI copy → use `seller.storeName`
- Any "Laura's Pots" in platform-level copy (landing page, onboarding, dashboard) → replace with "QRS" or remove
- Any hardcoded seller name, email, or contact info → pull from Seller record
- Any hardcoded Cloudinary paths with "laura" → verify already scoped to `qrs/[sellerId]/`

Report all instances found before fixing anything. Wait for approval.

---

### 404 handling

- Unknown slug: friendly 404 — "This shop doesn't exist (yet)."
- Out of stock shop (all products inStock: false): show "This shop is currently closed. Check back soon."

---

## Scoping Rules

- All product queries MUST filter by `sellerId`
- `sellerId` comes from the slug lookup — never from client input
- Cart state is scoped to the current slug — switching shops clears the cart

---

## What NOT to Build in This Milestone

- Stripe checkout wiring (M4)
- Fulfillment notifications (M4)
- Freemium tracking (M5)
- Low stock badge ("3 left") — post-MVP
- Rewind button for skipped items — post-MVP

---

## Done When

- `/[slug]` renders correct seller's shop
- Two different slugs render two different shops with different products
- Swipe UI works: right=buy, left=skip, up=save
- Action button bug fixed — buttons fire in collapsed state without expanding card
- Skip hint fires once on first skip, never again
- Unknown slug returns 404
- Cart scoped to current seller

---

## Stop Here

Report when M3 is complete:
1. Two different seller slugs render two different shops (yes/no)
2. Swipe gestures working correctly (yes/no)
3. Action button bug fixed (yes/no)
4. Skip hint fires once and never again (yes/no)
5. Unknown slug returns 404 (yes/no)
6. Any issues encountered

Do not start Milestone 4 without explicit instruction.

---

*MILESTONE_03.md — QRS — June 2026*
