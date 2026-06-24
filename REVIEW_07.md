# REVIEW_07.md

## SECTION 1 — HUMAN SUMMARY

M7 did its job: **19 dead V2 files deleted**, settings page and seed brought in line with the V3 schema, hero fetch ripped out of the storefront, and **`npm run build` passes clean**. This was deletion and type repair — no new seller-facing capability. The repo is finally deployable from a compile standpoint. Nothing in M7 was manually tested against live Stripe, Cloudinary, or a real order flow in this session. Telegram/SMS order accept-decline is gone permanently; sellers accept or decline from the dashboard only. `ONBOARDING.md` still says M1 and is wrong. Proceed to M8.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed

- **Title:** Legacy V2 Code Removal and Build Fix
- **Number:** 7

---

### 2. Files Created

None. M7 created no new files.

| File | Description |
|------|-------------|
| — | — |

---

### 3. Files Modified

| File | What Changed | Why |
|------|-------------|-----|
| `src/app/dashboard/settings/page.tsx` | Removed V2 Stripe key form and `fulfillmentType` display. Shows store info, Connect status with link to dashboard, and `notificationEmail`. | `settings-form.tsx` and per-seller Stripe fields deleted; page was failing tsc. |
| `prisma/seed.ts` | Dropped `email` and `fulfillmentType`; uses V3 Seller fields only. | Seed was failing tsc against current schema. |
| `src/components/shop/shop-experience.tsx` | Removed `/api/hero` fetch, `initialHeroImages` prop, hero state, carousel effect, and dead hero background UI. | Route deleted in M7; fetch was a silent 404 on every shop load. |
| `src/app/[slug]/page.tsx` | Removed `initialHeroImages={[]}` prop. | Prop no longer exists on `ShopExperience`. |
| `MILESTONE_07.md` | Filled §11 and §12. | Milestone handoff. |

**Files deleted (19):**

| File | Reason |
|------|--------|
| `src/app/dashboard/actions.ts` | V2 server actions; superseded by `products/actions.ts` |
| `src/components/dashboard/add-tab.tsx` | V2 product add UI |
| `src/components/dashboard/edit-tab.tsx` | V2 product edit UI |
| `src/components/dashboard/hero-tab.tsx` | HeroImage model removed |
| `src/components/dashboard/dashboard-shell.tsx` | V2 tab shell; unused |
| `src/components/dashboard/settings-form.tsx` | Per-seller Stripe keys removed in V3 |
| `src/app/api/products/[id]/route.ts` | V2 REST product endpoint |
| `src/app/api/dashboard/hero/route.ts` | HeroImage model removed |
| `src/app/api/hero/route.ts` | HeroImage model removed |
| `src/app/api/dashboard/upload/route.ts` | Only used by deleted `add-tab.tsx` |
| `src/app/api/cron/orders/route.ts` | V2 cron; wrong order statuses |
| `src/app/api/cron/reset-order-counts/route.ts` | `monthlyOrderCount` field removed |
| `src/app/api/fulfill/route.ts` | V2 fulfillment flow |
| `src/app/api/webhooks/telegram/route.ts` | V2 Telegram accept/decline |
| `src/app/api/webhooks/twilio/route.ts` | V2 Twilio accept/decline |
| `src/app/api/setup-telegram/route.ts` | Orphan after telegram webhook removal |
| `src/app/api/admin/route.ts` | V2 admin REST endpoint; V3 admin is `/admin` page |
| `src/lib/fulfillment.ts` | V2 fulfillment router |
| `src/lib/resend.ts` | Superseded by `email.service.ts` |

---

### 4. Assumptions Made

- **`src/app/api/admin/route.ts` deleted** — user confirmed V3 admin is password-gated at `/admin`, not a REST API.
- **Telegram/Twilio webhook stack deleted wholesale** — user confirmed V3 notifications go through `notification.service.ts` + `email.service.ts` via the Stripe webhook. Accept/decline via bot is not coming back in this form.
- **`settings-form.tsx` deleted** — user confirmed Connect-only; no per-seller Stripe key UI.
- **`/api/hero` deleted** — storefront works without hero banners. Empty background is acceptable until a V3 hero feature exists.
- **`updateProduct` publish-on-save** — M7 spec called for a fix, but code already set `published = seller.stripeConnectOnboarded` on edit. No code change was needed. REVIEW_06's note that edit-save keeps draft state was stale relative to the actual `products/actions.ts` implementation.
- **Storefront hero cleanup** — done immediately after M7 core work because leaving a fetch to a deleted route is sloppy even if it failed silently.

---

### 5. Open Questions

- **`ONBOARDING.md` is stale** — still says "M1: schema migration." Regenerate before M8 or any new agent session will misread project state.
- **`src/lib/cloudinary.ts` still exports `uploadHeroImage()`** — dead code with no callers. Delete in a future cleanup or leave it; it does not break the build.
- **`src/types/index.ts` still defines a V2-shaped `Product` type** (`imageUrl`, `inStock`, etc.) — intentional shim via `shop-product.ts` for the swipe UI. Confusing but not broken. Consolidate when storefront is rewritten or leave it.
- **When to run full manual E2E** — build passes; nobody ran create-product → publish → checkout → webhook → order dashboard in this session.

---

### 6. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Telegram/SMS accept-decline removed | **Medium** | Sellers must use `/dashboard/orders` or API routes. Document in seller onboarding if not already. |
| Hero banners gone on storefront | **Low** | Accept for V3 or add a V3 hero source later (e.g. first published product image). |
| Settings page is read-only stub | **Low** | Shippo toggle and notification prefs are future milestones. Page does not mislead about Stripe keys. |
| M6 flows still untested live | **High** | Cloudinary upload, AI tags, publish → storefront, postcard download — none verified in this session. Run REVIEW_06 checklist before calling production-ready. |
| Vercel deploy not verified here | **Medium** | `npm run build` passed locally twice. Push and confirm Vercel green. |
| `src/app/dashboard/page.tsx` still queries Prisma directly | **Low** | Pre-existing layer violation from M6. Does not block build. Fix when touching dashboard home. |
| Global Telegram env in `notification.service.ts` | **Low** | Uses `TELEGRAM_BOT_TOKEN` + `SELLER_CHAT_ID`, not per-seller tokens. Correct for V3; wrong if you expected per-seller bot setup UI. |

---

### 7. Layer Violations

**One pre-existing violation, unchanged by M7:**

- `src/app/dashboard/page.tsx` queries `prisma.product` directly for postcard image options instead of `product.service.ts`.

**M7 introduced no new violations.** Deletions only; settings page is presentation-only with no Prisma.

---

### 8. Engineering Rule Violations

M7 did not touch Stripe webhook, checkout, or schema. Rules below reflect repo state after M7.

| Rule | Status | Notes |
|------|--------|-------|
| Every Prisma query includes `where: { sellerId }` | **Pass** | M7 did not add tenant queries |
| No `NEXT_PUBLIC_*` secrets in client bundles | **Pass** | Deleted per-seller Stripe key UI |
| Stripe webhook: signature verification hard-required | **Pass** | Untouched; still in `webhooks/stripe` |
| Stripe webhook: idempotency guard on `checkout.session.completed` | **Pass** | Untouched |
| Stripe Connect only — no per-seller key paths | **Pass** | V2 key paths deleted |
| 2% `application_fee_amount` on every PaymentIntent | **Pass** | Untouched |
| Shippo fallback to BAKED_IN is silent — no buyer-facing error | **N/A** | Shippo not implemented yet |
| Shipping toggle hidden unless seller has Shippo API key | **N/A** | Settings stub only |
| Postcard template is fixed — no color/font customization | **Pass** | Untouched |
| FAQ is hardcoded array — no DB model or admin CRUD | **Pass** | Untouched |
| Platform fee not returned on refund | **Pass** | Untouched |
| Telegram failures are fire-and-forget | **Pass** | `notification.service.ts` catches and logs |
| No scheduled workloads — all execution request-driven | **Pass** | Both cron routes deleted |
| vercel.json memory/duration scoped to postcard route only | **Pass** | Untouched |
| QR code URL driven by `NEXT_PUBLIC_APP_URL` — not hardcoded | **Pass** | Untouched |
| M7 §8: fix edit-save publish behavior | **Already satisfied** | No change required; spec was redundant with existing code |

---

### 9. Ready to Proceed

**Decision:** YES

**Reasoning:** M7 scope is complete. `npx tsc --noEmit` and `npm run build` both pass. The V2/schema split that blocked every Vercel deploy is resolved. No layer or engineering violations were introduced. The remaining gaps are documentation staleness (`ONBOARDING.md`), dead helper code (`uploadHeroImage`), and manual E2E verification carried forward from M6 — none of those block starting M8. Regenerate `ONBOARDING.md` at the top of M8 and run the M6 manual checklist before treating production as shippable.
