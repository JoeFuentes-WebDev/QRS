# REVIEW_08.md

## SECTION 1 — HUMAN SUMMARY

M8 code is done. Settings is a real V3 page — editable notification email, read-only store info, Connect status, BAKED_IN shipping copy, no stubs. Store URL display no longer lies with hardcoded `my-qrs.co` fallbacks. **`npm run build` passes.** Production is **not** live: Resend domain, Neon migrate, live Stripe keys, smoke test, and `v3` → `main` merge were never run in this session. M8 is half a milestone — Cursor finished Part A and B; Parts C–E are entirely on you. Do not merge to main or take real money until the manual checklist passes.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed

- **Title:** Production Deploy
- **Number:** 8

*(Code scope complete. Manual deploy scope incomplete.)*

---

### 2. Files Created

| File | Description |
|------|-------------|
| `src/app/dashboard/settings/actions.ts` | Server action `updateNotificationEmail` — auth via `getCurrentSeller()`, email validation, `{ error? \| success? }` return shape |
| `src/components/dashboard/notification-email-form.tsx` | Client form with `useActionState` for notification email save |

M8 §4 says "Files to Create: None" but §5 explicitly allows `settings/actions.ts`. The notification form component was not listed anywhere — it was required to make the editable field work without putting `"use client"` on the page.

---

### 3. Files Modified

| File | What Changed | Why |
|------|-------------|-----|
| `src/app/dashboard/settings/page.tsx` | Full V3 rewrite: read-only store name/slug/shop URL, editable notification email, Stripe Connect status + dashboard link, Shipping BAKED_IN copy. Removed custom domain stub and all "coming soon" blocks. | M7 left a stub; M8 spec |
| `src/services/seller.service.ts` | Added `updateSellerNotificationEmail(sellerId, notificationEmail)` | Layer-clean Prisma mutation per user direction |
| `src/lib/qr.ts` | Added `getShopUrlDisplay()`, `APP_URL_MISSING_MESSAGE`, `ShopUrlDisplay` type | Centralize seller-facing shop URL display with env-missing warning |
| `src/components/onboarding/onboarding-form.tsx` | Replaced `?? 'my-qrs.co'` slug preview fallback with `getShopUrlDisplay()` | M8 Part B store URL audit |
| `ONBOARDING.md` | Full regenerate — V3 complete, M8 code done, manual deploy steps documented | Stale doc said M1; required at M8 close |
| `MILESTONE_08.md` | Filled §11–§12 | Milestone handoff |

**Not modified (M8 §6 respected):** products, orders, stripe routes, storefront, webhooks, schema, `vercel.json`.

---

### 4. Assumptions Made

- Custom domain section removed entirely — user chose tighter page, no stubs.
- Prisma update lives in `seller.service.ts`; `settings/actions.ts` only validates and calls the service.
- `getShopUrlDisplay()` lives in `lib/qr.ts` because M8 forbade new files and qr already owns shop URL construction. Slightly odd file placement, functionally correct.
- Marketing `mailto:hello@my-qrs.co` on landing/how-it-works left alone — contact address, not storefront URL construction.
- Manual deploy steps documented in `MILESTONE_08.md` and `ONBOARDING.md` but not executed — Cursor has no access to Vercel/Stripe/Resend/Neon dashboards.
- No M9 milestone exists; "proceed" means production go-live, not more feature code.

---

### 5. Open Questions

- **Has production Neon been migrated?** If the production DB still has V2 schema or Float prices, `prisma migrate deploy` can fail or corrupt data. Confirm empty or migrated before deploy (REVIEW_01 risk).
- **Is Resend domain verified for my-qrs.co?** Until it is, seller/buyer emails send from `onboarding@resend.dev` or fail silently depending on Resend config.
- **Live Stripe webhook registered?** Test-mode webhook on production URL will not fire for live checkouts.
- **When does `v3` merge to `main`?** Only after smoke test — not before.

---

### 6. Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Production deploy not executed | **HIGH** | M8 is incomplete until manual steps C–E pass. Code alone does not enable real money. |
| Full E2E never run in any session | **HIGH** | Signup → Connect → product → checkout → webhook → order email — still unverified end-to-end, including M6 Cloudinary upload. |
| `prisma migrate deploy` on production | **HIGH** | Float→Int price conversion if legacy product rows exist. Check production DB first. |
| Resend `RESEND_FROM_EMAIL` still dev default | **MEDIUM** | Buyer/seller emails may look unprofessional or bounce until domain verified. |
| `TELEGRAM_BOT_TOKEN` / `SELLER_CHAT_ID` optional | **LOW** | Telegram alerts are platform-global env vars, not per-seller. Most sellers get email only. |
| `src/lib/cloudinary.ts` `uploadHeroImage()` dead code | **LOW** | No callers. Harmless but confusing. |
| `src/app/dashboard/page.tsx` direct Prisma query | **LOW** | Pre-existing layer violation for postcard image picker. Unchanged by M8. |
| `.env.example` stale comments | **LOW** | Still references per-seller Stripe keys and legacy fulfillment. Misleading for new setup. |
| Notification form uses `defaultValue` | **LOW** | After save, revalidation refreshes server props; input does not reset to saved value until page navigation. Success message confirms save — acceptable UX. |

---

### 7. Layer Violations

**M8 introduced none.**

| Location | Violation | Justification (if any) |
|----------|-----------|------------------------|
| `src/app/dashboard/page.tsx` | Direct `prisma.product.findMany` for postcard image options | Pre-existing from M6. Not fixed in M8 scope. Should use `product.service.ts`. |

M8 settings flow is correct: page (server) → client form → server action → `seller.service.ts` → Prisma with `where: { id: sellerId }`.

---

### 8. Engineering Rule Violations

M8 did not touch checkout, webhooks, or Shippo checkout paths.

| Rule | Violated? | Details |
|------|-----------|---------|
| Every tenant Prisma query includes `where: { sellerId }` | **No** | `updateSellerNotificationEmail` uses `where: { id: sellerId }` on Seller — correct |
| No `NEXT_PUBLIC_*` secrets | **No** | No secrets added; removed hardcoded domain fallbacks |
| Stripe webhook: signature verification hard-required | **No** | Untouched |
| Stripe webhook: idempotency guard on duplicate session | **No** | Untouched |
| Platform fee 2% on every PaymentIntent — no exceptions | **No** | Untouched |
| Shippo rate failure falls back silently to BAKED_IN | **N/A** | Shippo not wired in checkout UI |
| Shipping toggle hidden unless Shippo API key present | **N/A** | No toggle in settings — BAKED_IN copy only |
| Checkout blocked if `stripeConnectOnboarded: false` | **No** | Untouched |
| QR codes use `NEXT_PUBLIC_APP_URL` — never hardcoded | **No** | `getShopUrlDisplay()` enforces env or warning for seller display; `buildShopUrl()` still throws if unset at QR generation time |
| Postcard template fixed — no seller color/font customization | **No** | Untouched |
| FAQ hardcoded array only — no DB model or admin CRUD | **No** | Untouched |
| Telegram failures fire-and-forget — no retry logic | **No** | Untouched |
| Platform fee not returned on refund | **No** | Untouched |
| M8 §4 "no new files" vs two files created | **Bent — necessary** | `settings/actions.ts` explicitly allowed in §5; form component required for editable field |

---

### 9. Ready to Proceed

**Ready:** YES *(for M8 code sign-off)* / **NO** *(for production go-live)*

**Reasoning:** M8 Parts A and B are complete and build-clean. Settings works as specified. Store URL display is honest about missing env vars. Layer and engineering rules hold for all M8 changes. M8 Parts C–D–E — Resend, Neon migrate, live Stripe, smoke test, merge to main — were not done and block production. Run the manual checklist in `MILESTONE_08.md` §11 before taking real payments. There is no M9 feature milestone; the next step is deploy verification, not more Cursor feature work.
