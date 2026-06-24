# MILESTONE_07.md

## SECTION 1 — HUMAN SUMMARY

M7 is a focused cleanup milestone: delete or rewrite every legacy V2 file that references schema fields that no longer exist (`inStock`, `imageUrl`, `heroImage`, `orderItems`, etc.), so that `npm run build` passes clean. This is a prerequisite for any production deploy and must come before M8 (orders/webhooks) or any other feature work. Estimated session complexity: medium — mostly deletion with targeted rewrites on any route that has a V3 equivalent.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number
**Title:** Legacy V2 Code Removal and Build Fix
**Number:** 7

---

### 2. What This Milestone Builds

Remove all legacy V2 files that reference non-existent Prisma schema fields (`inStock`, `imageUrl`, `heroImage`, `orderItems`, `stripeAccountId`, `stripeSecretKey`, or any other field deleted in the V3 schema migration). The goal is a clean `npm run build` with zero TypeScript errors originating from dead V2 code.

No new features are added. No schema changes are made. No V3 routes are rewritten unless a V2 file is shadowing a V3 route at the same path.

---

### 3. Why This Comes Next

`npm run build` currently fails with 40+ TypeScript errors caused by V2 files referencing fields that no longer exist in the Prisma schema. This blocks every Vercel production deploy. All M6 deliverables are complete and correct. M7 must pass before any downstream milestone (orders, webhooks, Shippo, settings) can be deployed.

---

### 4. Files to Create

None. This milestone creates no new files.

---

### 5. Files to Modify or Delete

Cursor must first run a full TypeScript error scan (`npx tsc --noEmit`) and identify every file producing errors. The following are the known candidates from M6 review; treat this list as a starting inventory, not a complete list.

#### Files to DELETE (dead V2 routes with no V3 equivalent)

| File | Reason |
|------|--------|
| `src/app/dashboard/actions.ts` (V2 version, if it still exists alongside M6's `products/actions.ts`) | References V2 schema fields; superseded by `src/app/dashboard/products/actions.ts` |
| `src/app/dashboard/add-tab.tsx` | V2 product add UI; superseded by `/dashboard/products/new` |
| `src/app/dashboard/edit-tab.tsx` | V2 product edit UI; superseded by `/dashboard/products/[id]` |
| `src/app/dashboard/hero-tab.tsx` | V2 hero image tab; `heroImage` field removed from schema |
| `src/app/api/products/[id]/route.ts` | V2 REST product endpoint; V3 uses server actions |
| `src/app/api/dashboard/hero/route.ts` | V2 hero upload endpoint; field no longer exists |
| `src/app/api/hero/route.ts` | V2 hero route; field no longer exists |
| Any cron/webhook files referencing V2 fields | e.g., `twilio`, `telegram` V2 webhook handlers referencing `orderItems` or `inStock` |

#### Files to REWRITE (retain the route, fix the type errors)

Only rewrite a file if:
- It serves a route that still exists and has a purpose in V3, AND
- It fails `tsc --noEmit` due to V2 field references

If a file is referenced by a V3 route and contains V2 field access, update only the broken field references to match the current Prisma schema. Do not expand scope — fix the type error, nothing more.

#### Files to MODIFY

| File | Change | Why |
|------|--------|-----|
| `src/app/dashboard/page.tsx` | Remove any direct `prisma.product` query that references V2 fields (e.g., `imageUrl`, `inStock`) | Pre-existing layer violation noted in M6; fix only the fields causing TypeScript errors |
| Any file importing from deleted modules | Remove or replace the import | Broken imports cause build failure |

---

### 6. Files to Leave Untouched

- `src/services/product.service.ts`
- `src/app/dashboard/products/actions.ts`
- `src/app/dashboard/products/page.tsx`
- `src/app/dashboard/products/new/page.tsx`
- `src/app/dashboard/products/[id]/page.tsx`
- `src/components/dashboard/product-form.tsx`
- `src/components/dashboard/product-list.tsx`
- `src/components/dashboard/image-uploader.tsx`
- `src/app/api/cloudinary/sign/route.ts`
- `src/lib/ai-analysis.ts`
- `src/lib/cloudinary.ts`
- `src/components/dashboard/dashboard-header.tsx`
- All storefront routes (`src/app/[slug]/**`)
- All landing/FAQ/postcard/QR routes
- `src/app/api/webhooks/**` — touch only if a file fails `tsc --noEmit` due to V2 fields; do not restructure webhook logic
- `prisma/schema.prisma` — no schema changes
- `.env`, `.env.example`, `.cursorrules`
- `vercel.json`

---

### 7. Layer Rules Reminder

1. **Service layer owns Prisma queries.** If a dashboard page is querying `prisma.product` directly and that query references V2 fields, fix the field names to match the V3 schema — do not add new direct Prisma calls. If the query can be replaced with a call to `product.service.ts`, do so.
2. **Deletions are permanent.** Before deleting a file, confirm no other file imports it. If a file is imported by a V3 route that is still in use, rewrite the broken references rather than delete.
3. **No feature additions in a cleanup milestone.** If fixing a type error requires adding new logic (beyond field rename), stop and record it as an open question rather than inventing scope.

---

### 8. Engineering Rules

**DO:**
- Run `npx tsc --noEmit` first to get the full error list before touching any file
- Delete files that have no V3 equivalent and no active imports from V3 code
- Fix field-name mismatches (V2 → V3 schema) in files that serve live V3 routes
- Verify `npm run build` passes before closing the session
- Record every deleted file in §11 Assumptions Made
- Fix edit-save behavior: in updateProduct server action, if seller.stripeConnectOnboarded === true, set published: true on save regardless of current draft state.

**DON'T:**
- Add new product, order, or settings features
- Change any Prisma schema
- Modify any V3 route that is already typecheck-clean
- Rewrite webhook logic — only fix broken field references if a webhook file fails `tsc`
- Add new API routes
- Touch storefront, landing, or buyer-facing pages unless they are in the TypeScript error list
- Silently cast to `any` to suppress errors — fix the actual field reference

---

### 9. Ambiguity Protocol

If any of the following situations arise, **stop and record in §12 Open Questions** rather than guessing:

- A V2 file is imported by both a dead V2 route AND a live V3 route — do not delete; record the conflict
- A file fails `tsc` due to a missing field that is not clearly a V2 artifact (may indicate a schema migration gap)
- A webhook handler references V2 fields in a way that would require logic changes (not just field renames) to fix — record it, do not rewrite
- Any file outside the known candidate list fails `tsc` for reasons unrelated to V2 field names

---

### 10. What Is NOT in This Milestone

- Order management UI or dashboard
- Stripe webhook handler logic changes
- Shippo integration
- Settings page
- Telegram notification updates
- Seller onboarding flow changes
- Any new UI components
- Any new API routes
- Any Prisma schema migration
- Analytics event changes
- Storefront changes
- FAQ, QR, postcard route changes
- Admin route changes

---

### 11. Assumptions Made

- Deleted `src/app/api/admin/route.ts` per user confirmation — V3 admin is password-gated at `/admin`, not a REST endpoint.
- Deleted the full V2 Telegram/Twilio webhook stack (`fulfillment.ts`, `resend.ts`, telegram/twilio webhook routes, `setup-telegram`) — V3 uses `notification.service.ts` and `email.service.ts` via the Stripe webhook.
- Removed per-seller Stripe key UI (`settings-form.tsx`); settings page now points sellers to Stripe Connect on the dashboard.
- Deleted `src/app/api/hero/route.ts` entirely — storefront already passes `initialHeroImages={[]}` and tolerates fetch failure; HeroImage model is gone in V3.
- Deleted `src/app/api/dashboard/upload/route.ts` — only consumer was V2 `add-tab.tsx`.
- `updateProduct` publish-on-save behavior was already correct in `products/actions.ts`; no change needed.

**Files deleted:**

| File | Reason |
|------|--------|
| `src/app/dashboard/actions.ts` | V2 server actions superseded by `products/actions.ts` |
| `src/components/dashboard/add-tab.tsx` | V2 product add UI |
| `src/components/dashboard/edit-tab.tsx` | V2 product edit UI |
| `src/components/dashboard/hero-tab.tsx` | HeroImage model removed |
| `src/components/dashboard/dashboard-shell.tsx` | V2 tab shell, unused |
| `src/components/dashboard/settings-form.tsx` | Per-seller Stripe keys removed in V3 |
| `src/app/api/products/[id]/route.ts` | V2 REST product endpoint |
| `src/app/api/dashboard/hero/route.ts` | HeroImage model removed |
| `src/app/api/hero/route.ts` | HeroImage model removed |
| `src/app/api/dashboard/upload/route.ts` | V2 upload, only used by add-tab |
| `src/app/api/cron/orders/route.ts` | V2 cron, wrong order statuses |
| `src/app/api/cron/reset-order-counts/route.ts` | `monthlyOrderCount` field removed |
| `src/app/api/fulfill/route.ts` | V2 fulfillment flow |
| `src/app/api/webhooks/telegram/route.ts` | V2 Telegram accept/decline |
| `src/app/api/webhooks/twilio/route.ts` | V2 Twilio accept/decline |
| `src/app/api/setup-telegram/route.ts` | Orphan after telegram webhook removal |
| `src/app/api/admin/route.ts` | V2 admin REST endpoint |
| `src/lib/fulfillment.ts` | V2 fulfillment router |
| `src/lib/resend.ts` | Superseded by `email.service.ts` |

**Files modified:**

| File | Change |
|------|--------|
| `src/app/dashboard/settings/page.tsx` | Removed V2 Stripe key form; Connect-only copy |
| `prisma/seed.ts` | Updated to V3 Seller fields |

---

### 12. Open Questions

- None — user confirmed all three ambiguity resolutions before execution.