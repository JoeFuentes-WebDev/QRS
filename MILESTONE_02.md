# MILESTONE_02 — Seller Dashboard
## QRS

This prompt begins Milestone 2. Read it fully before writing any code.

---

## Goal

The seller dashboard is fully functional. Seller can add products (with AI tagging), edit existing products, manage hero images, and configure their settings. All data is scoped to the logged-in seller.

---

## Before You Write Any Code

### Step 1 — Confirm M1 state

Verify the following before starting:
- `/onboarding` creates a Seller record linked to Clerk user ID
- `/dashboard` loads and shows seller name and shop URL
- Middleware correctly redirects unauthenticated users and users without a Seller record

If any of these are broken, stop and report.

### Step 2 — Read the relevant existing files

- `src/app/dashboard/page.tsx` — current dashboard stub
- `src/lib/seller.ts` — seller lookup helpers
- `src/app/admin/` — existing Laura's Pots admin (reference for what to port)
- `src/components/` — existing components to reuse
- `prisma/schema.prisma` — Product, HeroImage, Seller models

### Step 3 — Describe your implementation plan

Before writing anything, describe in plain English:
- How you will scope all DB queries to the logged-in seller
- How you will structure the three tabs (Add / Edit / Hero)
- How the AI tagging queue will work
- Which existing components from `/admin` you will reuse vs rebuild

**Wait for approval before writing any code.**

---

## What to Build

### Tab structure

Three tabs at `/dashboard`:
- **Add** — upload photos, AI tag queue, approve and save products
- **Edit** — search and edit existing products
- **Hero** — manage hero/splash images

Plus a **Settings** link (separate page at `/dashboard/settings`).

---

### Add Tab

**Upload:**
- Multi-image upload (1-20 photos at once) via Cloudinary
- Images stored at `qrs/[sellerId]/products/`
- On upload, send each image to Claude Vision API in parallel
- AI returns: name, category, description, tags, suggested price

**Review queue:**
- Thumbnail strip at top showing all uploaded images, current one highlighted
- One product card at a time for review
- Fields (all editable): name, category, description, tags, price
- "AI suggested" label next to price field
- Approve button: saves product to DB with `sellerId`, moves to next card
- Skip button: removes from queue without saving
- Progress indicator: "3 of 7 reviewed"

**Product saved to DB:**
- `sellerId` from current seller session
- `quantity`: default to `null` (unlimited) unless seller sets it
- `inStock`: true on create
- `imageUrl` and `imagePublicId` from Cloudinary

---

### Edit Tab

- Search input: filter products by name (client-side filter, no new API call)
- Product list: show all seller's products (inStock and out of stock)
- Inline edit: name and price editable inline on the list
- Quantity field: editable (null = unlimited, number = limited stock)
- Soft delete: sets `inStock: false` and `quantity: 0` — does not hard delete
- Restore: if soft-deleted, show "Restore" option to set `inStock: true`

---

### Hero Tab

- Upload hero images via Cloudinary
- Images stored at `qrs/[sellerId]/hero/`
- Show existing hero images in a grid
- Delete button on each image (removes from DB and Cloudinary)
- No limit on number of hero images in M2

---

### Settings Page (`/dashboard/settings`)

**Store info (read-only for now):**
- Store name
- Slug
- Shop URL: `qrs.app/[slug]`

**Stripe configuration:**
- Stripe publishable key (text input, masked)
- Stripe secret key (text input, masked)
- Stripe webhook secret (text input, masked)
- Save button — updates Seller record

**Notification preference (read-only display):**
- Show current preference (Email or Telegram + Shippo)
- "Edit notification settings" — not functional in M2, show "Coming soon"

**Custom domain (placeholder):**
- Disabled text input
- Label: "Custom domain — coming soon"

---

## Scoping Rules

- Every DB query touching Products or HeroImages MUST include `where: { sellerId }` — no exceptions
- Get `sellerId` via `getCurrentSeller()` from `src/lib/seller.ts` — never trust client input
- Never expose Stripe keys in API responses or client-side code

---

## What NOT to Build in This Milestone

- Public shop `/[slug]` (M3)
- Stripe checkout flow changes (M4)
- Fulfillment changes (M4)
- Freemium tracking (M5)
- Slug change flow
- Notification preference editing

---

## Done When

- Seller can upload photos and approve AI-tagged products
- Products saved to DB with correct `sellerId`
- Seller can edit product name, price, quantity inline
- Seller can soft-delete and restore products
- Seller can upload and delete hero images
- Settings page saves Stripe keys to Seller record
- All queries scoped to logged-in seller — no cross-seller data leakage

---

## Stop Here

Report when M2 is complete:
1. Add tab works end to end — upload, AI tag, approve, saved to DB (yes/no)
2. Edit tab — inline edit and soft delete working (yes/no)
3. Hero tab — upload and delete working (yes/no)
4. Settings — Stripe keys saving to DB (yes/no)
5. Any issues encountered

Do not start Milestone 3 without explicit instruction.

---

*MILESTONE_02.md — QRS — June 2026*
