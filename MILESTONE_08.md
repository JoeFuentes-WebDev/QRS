# MILESTONE_08.md

## SECTION 1 — HUMAN SUMMARY

M8 is the production deploy milestone — the final step before real sellers can use my-qrs.co. It covers the Settings page V3 rewrite, store URL fix, Resend domain switch, production Neon migration, live Stripe key swap, full end-to-end smoke test, and merge of the v3 branch to main. No new features. No schema changes. The goal is a fully operational production app with real money movement enabled. Estimated complexity: medium-high. Most of the work is configuration and verification, not code. Cursor handles the Settings page and store URL fix. The rest is manual steps requiring developer action in Vercel, Stripe, Resend, and Neon dashboards.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**M8 — Production Deploy**

---

### 2. What This Milestone Builds

**Part A — Settings Page V3 Rewrite (Cursor)**

Rewrite `src/app/dashboard/settings/page.tsx` to reflect V3 state:

- Display `seller.notificationEmail` with an edit field (updates via server action)
- Display `seller.storeName` and `seller.slug` as read-only (set during onboarding)
- Display Stripe Connect status with a link back to `/dashboard` to reconnect if needed
- Add a Shipping section with the following static copy:
  - Heading: "Shipping"
  - Body: "Shipping is included in your product price. When setting prices, make sure to account for your shipping costs."
  - Hint: "Automatic shipping rate calculation is coming soon."
- No Shippo API key field. No shipping mode toggle. BAKED_IN only.
- Remove all V2 Stripe key fields (already removed in M7 but confirm the page is clean)

**Part B — Store URL Fix (Cursor)**

Audit every place in the codebase where the storefront URL is constructed for display to sellers (e.g. "Your shop is live at..."). Ensure all instances use `NEXT_PUBLIC_APP_URL` and not any hardcoded domain or fallback. If `NEXT_PUBLIC_APP_URL` is not set, display a clear warning rather than a broken URL.

**Part C — Manual Steps (Developer, not Cursor)**

The following steps are performed manually by the developer in external dashboards. Cursor documents what needs to be done but does not execute these steps:

1. **Resend domain** — verify my-qrs.co with Resend, update `RESEND_FROM_EMAIL` to `orders@my-qrs.co` in Vercel environment variables
2. **Production Neon migration** — run `prisma migrate deploy` against the production `DATABASE_URL`. Confirm no existing product rows before running (price Float→Int conversion risk documented in REVIEW_01)
3. **Live Stripe keys** — swap `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` to live values in Vercel environment variables. Add live webhook endpoint in Stripe dashboard pointing to `https://my-qrs.co/api/webhooks/stripe`
4. **Vercel environment variables** — confirm `NEXT_PUBLIC_APP_URL=https://my-qrs.co` is set in production

**Part D — Smoke Test (Developer)**

After production deploy, run this checklist manually:

1. Sign up as a new seller at my-qrs.co
2. Complete onboarding (store name, slug, notification email)
3. Connect Stripe (live mode)
4. Add a product with images — confirm AI tagging runs, product appears on storefront
5. Browse `/[slug]` as a buyer — confirm product appears, buy button is active
6. Complete a real checkout with a real card (small amount)
7. Confirm order appears in `/dashboard/orders` as PENDING
8. Accept order — confirm seller email received at `notificationEmail`
9. Mark fulfilled
10. Confirm 2% platform fee visible in Stripe dashboard

**Part E — Merge v3 to main (Developer)**

After smoke test passes:

```bash
git checkout main
git merge v3
git push origin main
```

Verify Vercel deploys from main successfully.

---

### 3. Why This Comes Next

M1–M7 have built and cleaned the full V3 feature set. The build is clean. Settings and store URL are the only remaining code gaps. Everything else is configuration and verification. This is the last milestone before real sellers can use the platform.

---

### 4. Files to Create

None. This milestone creates no new files.

---

### 5. Files to Modify

| Path | What Changes | Why |
|------|-------------|-----|
| `src/app/dashboard/settings/page.tsx` | Full V3 rewrite — notificationEmail edit, read-only store info, Stripe Connect status, Shipping section with BAKED_IN copy | M7 left settings as a stub; sellers need a functional settings page |
| `src/app/dashboard/settings/actions.ts` (create if not exists) | Server action: `updateNotificationEmail` — validates email format, updates `seller.notificationEmail`, scoped by `sellerId` | Settings form needs a mutation path |
| Any file constructing storefront URLs for seller display | Replace hardcoded domains or missing env var fallbacks with `NEXT_PUBLIC_APP_URL` | Store URL must show `my-qrs.co/[slug]` not a stale domain |

---

### 6. Files to Leave Untouched

- `src/app/dashboard/products/` — all product routes untouched
- `src/app/dashboard/orders/` — untouched
- `src/app/dashboard/stripe/` — untouched
- `src/app/[slug]/` — storefront untouched
- `src/app/page.tsx` — landing page untouched
- `src/app/faq/page.tsx` — untouched
- `src/app/api/webhooks/stripe/route.ts` — untouched
- `src/app/api/qr/route.ts` — untouched
- `src/app/api/postcard/route.ts` — untouched
- `prisma/schema.prisma` — no schema changes
- `vercel.json` — untouched
- `.cursorrules` — untouched
- `ONBOARDING.md` — update to reflect M8 complete after this milestone closes

---

### 7. Layer Rules Reminder

1. **Settings mutation goes through a server action** — `updateNotificationEmail` lives in `settings/actions.ts`, not inline in the page component or a direct API route.
2. **`updateNotificationEmail` must scope by `sellerId`** — fetch the current seller via `getCurrentSeller()`, use their `id` as the Prisma `where` clause. Never trust a client-supplied sellerId.
3. **Store URL construction uses `NEXT_PUBLIC_APP_URL` only** — no hardcoded strings, no `process.env.VERCEL_URL`, no fallback to localhost in production-facing copy.

---

### 8. Engineering Rules

**DO:**
- Validate `notificationEmail` format server-side in the server action before updating
- Return a structured `{ error?: string }` from the server action — no thrown exceptions
- Use `NEXT_PUBLIC_APP_URL` for all storefront URL display. If undefined, show: "Set NEXT_PUBLIC_APP_URL in your environment variables."
- Confirm `npm run build` still passes after settings page changes
- Document the manual deploy steps in §11 as they are completed

**DO NOT:**
- Add Shippo API key input or shipping mode toggle — BAKED_IN only, no toggle
- Add seller analytics display
- Change checkout, webhook, or order logic
- Add new Prisma schema fields
- Touch storefront, landing, or buyer-facing routes
- Add new environment variables (use existing ones only)
- Run `prisma migrate deploy` against production without first confirming the production DB has no existing product rows with Float prices

---

### 9. Ambiguity Protocol

If any of the following arise, stop and record in §12:

- `src/app/dashboard/settings/actions.ts` already exists with conflicting logic — do not overwrite silently; record what was found
- `getCurrentSeller()` does not exist or has a different import path — record actual path before using
- `NEXT_PUBLIC_APP_URL` is referenced in more than 5 places with inconsistent construction patterns — record all locations before fixing

---

### 10. What Is NOT in This Milestone

- Shippo integration or shipping mode toggle
- Seller analytics dashboard
- Buyer accounts
- Admin UI
- Custom domains
- Packaging Intelligence
- Multi-product QR codes
- FAQ updates
- Any new features
- Any Prisma migrations
- Any new API routes beyond `settings/actions.ts`

---

### 11. Assumptions Made

- Custom domain section removed from settings per user — no "coming soon" stubs on the page.
- `updateSellerNotificationEmail()` added to `seller.service.ts`; `settings/actions.ts` is a thin server-action wrapper.
- Shop URL display centralized in `getShopUrlDisplay()` (`lib/qr.ts`); used by settings page and onboarding slug preview.
- `notification-email-form.tsx` created as a client component — required for `useActionState`; not listed in M8 §4 but necessary for the editable email field.
- Manual deploy steps (Resend, Neon, Stripe live keys, smoke test, git merge) documented here but not executed by Cursor.

**Files created:**

| File | Description |
|------|-------------|
| `src/app/dashboard/settings/actions.ts` | `updateNotificationEmail` server action |
| `src/components/dashboard/notification-email-form.tsx` | Client form for notification email |

**Files modified:**

| File | Change |
|------|--------|
| `src/app/dashboard/settings/page.tsx` | Full V3 rewrite: store info, editable email, Connect status, Shipping copy |
| `src/services/seller.service.ts` | Added `updateSellerNotificationEmail()` |
| `src/lib/qr.ts` | Added `getShopUrlDisplay()` and `APP_URL_MISSING_MESSAGE` |
| `src/components/onboarding/onboarding-form.tsx` | Removed `my-qrs.co` fallback; uses `getShopUrlDisplay()` |
| `ONBOARDING.md` | Full regenerate — V3/M8 state |

**Manual deploy checklist (developer):**

1. Resend: verify my-qrs.co, set `RESEND_FROM_EMAIL=orders@my-qrs.co` in Vercel
2. Neon: `prisma migrate deploy` on production (confirm no Float-price products)
3. Stripe: live keys in Vercel; live webhook → `https://my-qrs.co/api/webhooks/stripe`
4. Vercel: `NEXT_PUBLIC_APP_URL=https://my-qrs.co`
5. Smoke test per M8 §2 Part D
6. `git checkout main && git merge v3 && git push origin main`

---

### 12. Open Questions

- None for code scope. Production go-live depends on manual steps above and smoke test pass.
