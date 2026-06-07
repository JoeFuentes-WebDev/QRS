# QRS — Technical Decisions
## MVP

Every decision in this file is locked. Cursor should not second-guess these or propose alternatives without explicit instruction.

---

## Platform Name
**Decision:** QRS

**Rationale:** Short, abstract, commerce-adjacent (cash qrs). Works at scale. No negative connotation. Not tied to a physical product category.

---

## URL Structure: Slug-based (`/[slug]`)
**Decision:** Public shops live at `/[slug]`. No subdomains in V2.

**Rationale:** Wildcard subdomains on Vercel require DNS configuration and add routing complexity. Slug routing is simpler, ships faster, and is the correct V2 decision. Subdomain support is V3.

**Custom domain note:** The data model has `customDomain` on Seller and middleware has a hostname lookup stub. No UI exposure in V2. Activating custom domains in V3 requires no schema changes.

---

## Auth: Clerk
**Decision:** Clerk for authentication.

**Rationale:** Pre-built signup/login UI, session management, email verification, and Next.js App Router integration out of the box. No OAuth providers needed. No regulated environment constraints. Fastest path to working auth.

Do not use NextAuth. Do not build custom auth.

---

## Revenue Model: Freemium + 1% via Stripe Connect
**Decision:** Free up to a monthly order threshold (TBD, e.g. 20 orders/month). 1% platform fee per transaction above the threshold via Stripe Connect.

**Rationale:** Zero friction for new sellers. They prove value before paying anything. 1% is negligible for low-volume sellers and acceptable for high-volume.

**V2 implementation:** Freemium threshold tracking is built. Stripe Connect infrastructure is stubbed. The 1% fee does not activate until V3. In V2, seller uses their own Stripe keys and the platform takes no cut.

---

## Per-Seller Stripe Keys (V2)
**Decision:** Each seller stores their own Stripe secret key, publishable key, and webhook secret in their Seller record.

**Rationale:** Avoids Stripe Connect complexity in V2 while sqrs enabling real payments. Sellers are responsible for their own Stripe accounts.

**Security note:** Keys are stored in the database. Treat as sensitive. Do not log, expose in API responses, or include in client-side bundles.

---

## Fulfillment: Email or Telegram + Shippo (Seller's Choice)
**Decision:** Seller picks their notification method during onboarding. Cannot mix both in V2.

- **Email:** Resend. Order details + shipping address sent to seller's notification email.
- **Telegram + Shippo:** Existing QRS flow. Per-seller bot token and Shippo key. YES generates label, NO refunds and restocks.

**Rationale:** Email is the lowest-friction option for non-technical sellers. Telegram + Shippo is the power option for sellers who want automated label generation.

---

## Product Quantity Model
**Decision:** `quantity` field on Product. `null` = unlimited. `1` = one-of-a-kind. Any positive integer = limited stock. `inStock` is derived from quantity, not manually set.

**Rationale:** QRS used `inStock` as a manual flag with no quantity concept. This model is more general and supports all seller types (handmade one-of-a-kinds, batch producers, unlimited digital-adjacent goods).

---

## AI Pricing: Suggest Only, Never Auto-Set
**Decision:** Claude Vision suggests a price. Seller sets the actual price. AI suggestion is pre-filled in the admin review queue but always editable.

**Rationale:** QRS auto-set prices based on piece count. That was acceptable for a single known seller. For a general platform, price is a seller's decision. The AI is a convenience, not an authority.

---

## Dashboard URL: `/dashboard`
**Decision:** Seller admin lives at `/dashboard`, not `/[slug]/admin`.

**Rationale:** A seller manages one store. There's no ambiguity about which store `/dashboard` refers to — it's always the logged-in seller's store. Slug-scoped admin URLs add complexity without benefit in V2.

---

## Cloudinary: Single Platform Account, Seller-Scoped Folders
**Decision:** Platform uses one Cloudinary account. Images are stored in `qrs/[sellerId]/products/` and `qrs/[sellerId]/hero/`.

**Rationale:** Per-seller Cloudinary keys would require sellers to have their own Cloudinary accounts. That's too much onboarding friction. A single account with folder scoping is secure enough for V2.

---

## Repo: V2 Branch on qrs
**Decision:** V2 is a branch off the `qrs` repo, not a new repo.

**Rationale:** Reuses ~40% of QRS stack. Branch keeps git history. New repo when/if the platform warrants it.

---

## Migration Strategy
**Decision:** Seed a single Seller record for Laura during migration. All existing Products, HeroImages, and Orders get Laura's `sellerId` as default.

**Rationale:** Preserves Laura's existing data. Clean migration path. Laura's shop continues to work at `/laura` (or whatever slug is assigned during migration).

---

*TechnicalDecisions.md — QRS — June 2026*
