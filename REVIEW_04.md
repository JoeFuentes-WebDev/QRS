# REVIEW_04.md

## SECTION 1 — HUMAN SUMMARY

This review covers Milestone 4. Cursor has completed the milestone and is performing a self-audit before you read the output. M4 sits in the middle of the V3 build — check that seller notifications, tenant-scoped order queries, and dashboard order management are clean before proceeding to M5 (postcard/QR/FAQ). A passing review means: no layer violations, notifications are fire-and-forget, all Prisma order queries include `where: { sellerId }`, and no V4 features have crept into scope. Pay close attention to the open questions and risks sections — any unresolved items there need your decision before M5 starts.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed

- **Title:** Seller Order Management — Telegram Notifications, Dashboard Orders List, and Order Detail
- **Number:** 4

---

### 2. Files Created

| File | Description |
|------|-------------|
| `src/services/notification.service.ts` | Seller-facing notifications on new order: Resend email to `notificationEmail` + optional Telegram via platform env vars. Never throws. |
| `src/app/dashboard/orders/page.tsx` | Authenticated orders list — buyer email, total, status badge, date; sorted `createdAt DESC`; empty state. |
| `src/app/dashboard/orders/[id]/page.tsx` | Order detail — line items, Stripe session ID, status actions; `notFound()` when order missing or not owned by seller. |
| `src/app/api/orders/[id]/accept/route.ts` | POST — Clerk auth, PENDING → ACCEPTED, dotell `order.accepted`; 403/404/409 per spec. |
| `src/app/api/orders/[id]/decline/route.ts` | POST — Clerk auth, PENDING → DECLINED, dotell `order.declined`. |
| `src/app/api/orders/[id]/fulfill/route.ts` | POST — Clerk auth, ACCEPTED → FULFILLED; no dotell event. |
| `src/components/dashboard/order-actions.tsx` | Client component — Accept/Decline/Fulfill buttons calling status API routes. *(Supporting UI — not in M4 §4.)* |
| `src/components/dashboard/order-status-badge.tsx` | Status badge styling for list + detail pages. *(Supporting UI — not in M4 §4.)* |

---

### 3. Files Modified

| File | What changed | Why |
|------|-------------|-----|
| `src/services/order.service.ts` | Added `computeOrderTotalCents`, `getOrdersForSeller`, `getOrderById`, `resolveOrderAccess`, `updateOrderStatus`. Extended `createOrderFromCheckout` seller include with `notificationEmail`. | Dashboard reads + status transitions + seller notification data. |
| `src/app/api/webhooks/stripe/route.ts` | After order creation: `void notifySellerNewOrder(...)` (fire-and-forget). | M4 seller notification on `checkout.session.completed`. |
| `src/app/dashboard/page.tsx` | Added Orders card link to `/dashboard/orders`. | M4 navigation entry (dashboard home only — not header, per user). |
| `MILESTONE_04.md` | Filled §11 Assumptions Made and §12 Open Questions. | Milestone documentation per directive. |

**Explicitly not modified (per M4 §6):** schema, migrations, checkout, storefront, Connect routes, product CRUD, settings, middleware, `email.service.ts` (buyer email unchanged).

---

### 4. Assumptions Made

- **Assumption 1:** V3 Seller has **no `telegramChatId`** field. Per user-approved **Option A**: Telegram uses platform `TELEGRAM_BOT_TOKEN` + `SELLER_CHAT_ID` from env. If either is missing, Telegram is skipped silently (logged only on failure).
- **Assumption 2:** Seller notification email uses **new Resend logic in `notification.service.ts`** — does not import broken V2 `lib/resend.ts` or buyer-only `email.service.ts`.
- **Assumption 3:** Order **total is computed** from `OrderItem.priceSnapshot × quantity` — no `total` column on Order model.
- **Assumption 4:** Dashboard order **detail page** uses `getOrderById(id, sellerId)` and `notFound()` for both missing and wrong-seller orders (user-approved — no information leakage). Status **API routes** still return **403** vs **404** per MILESTONE_04 §7/§8.
- **Assumption 5:** Orders navigation is a **card on `/dashboard` only** — `DashboardHeader` unchanged.
- **Assumption 6:** No notifications on accept/decline/fulfill — only on new order from webhook (M4 §10).
- **Assumption 7:** REFUNDED status is display-only — no transition UI.

---

### 5. Open Questions

- **Question 1 (resolved):** Telegram chat ID not on Seller model — Option A (platform env vars) implemented per user approval.
- **Question 2 (resolved):** Orders link placement — dashboard home card only.
- **Question 3 (resolved):** Detail page access — `notFound()` for wrong seller and missing order.
- **Question 4:** Per-seller Telegram (`telegramChatId` on Seller + onboarding) deferred — when should schema + onboarding be updated? BuildPlanV3 references this for a later milestone.
- **Question 5:** Full `npm run build` still fails on legacy V2 routes (cron, fulfillment, dashboard CRUD, settings). M4-specific files typecheck clean in isolation.
- **Question 6:** Developer must set `TELEGRAM_BOT_TOKEN` + `SELLER_CHAT_ID` to test Telegram locally; `RESEND_API_KEY` for seller email test.
- **Question 7:** Product CRUD still V2/broken — cannot publish products via dashboard; checkout testing still requires manual DB product rows.

---

### 6. Risks

| Risk | Severity | Mitigation | Needs developer action? |
|------|----------|------------|-------------------------|
| Platform `SELLER_CHAT_ID` — all sellers share one Telegram chat in M4 | Medium | Documented as Option A interim | Yes — acceptable for dev; per-seller chat needs schema later |
| Telegram/email failure silent — seller may not know about order | Low | Fire-and-forget per spec; dashboard shows orders | No — check `/dashboard/orders` |
| No pagination — large order volume slows list page | Low | M4 spec: no pagination | No until V4 |
| Wrong-seller API probe returns 403 (reveals order exists) | Low | M4 spec requires 403 on API; detail page uses notFound | Accept per milestone; API only if id guessed |
| Legacy `src/app/api/fulfill/route.ts` may conflict conceptually with new fulfill route | Low | Different paths (`/api/fulfill` vs `/api/orders/[id]/fulfill`) | No for M4 |
| Seller email skipped if `RESEND_API_KEY` unset | Medium | Logged in notification.service | Yes — set env for email test |
| Status action race (double-click Accept) | Low | Second request returns 409 | No |

---

### 7. Layer Violations

**None.**

- Prisma order reads/writes: `order.service.ts` only.
- Resend + Telegram: `notification.service.ts` only (uses `lib/telegram.ts` for HTTP).
- Status API routes: Clerk auth + `order.service.ts` only — no Prisma in route files.
- Dashboard pages: server components call `order.service.ts`; client `OrderActions` calls API routes only.
- Webhook: single addition — `void notifySellerNewOrder(...)` after existing order creation.

---

### 8. Engineering Rule Violations

| Rule | Status | Notes |
|------|--------|-------|
| Tenant-scoped Prisma queries (`where: { sellerId }`) | **Pass** | List, get by id, status update all scoped |
| Telegram fire-and-forget, no throw | **Pass** | try/catch in notification.service |
| Route handlers call services, not Prisma | **Pass** | Status routes |
| dotell on accept/decline only | **Pass** | Not on fulfill |
| 403 forbidden vs 404 not found on API | **Pass** | `resolveOrderAccess` + mapped HTTP codes |
| 409 on invalid transition | **Pass** | |
| No buyer email from notification.service | **Pass** | Seller-facing only |
| No secrets in client bundle | **Pass** | |
| No pagination | **Pass** | |
| No REFUNDED transition UI | **Pass** | Display only |
| Money formatted in UI only (cents in service) | **Pass** | `formatPrice(totalCents / 100)` in pages |

**MILESTONE_04-specific notes:**

| Item | Status | Notes |
|------|--------|-------|
| Telegram per-seller chat on Seller model | **Deferred** | Option A platform env — user-approved schema-free approach |
| Detail page 403 vs 404 | **Bent — user-approved** | Page uses `notFound()` for both; API keeps 403/404 distinction |

---

### 9. Ready to Proceed

- **Decision:** yes
- **Reasoning:** M4 deliverables complete: seller notifications (email + optional Telegram) on webhook order creation, `/dashboard/orders` list, `/dashboard/orders/[id]` detail with status actions, three authenticated status API routes, extended `order.service.ts`, dashboard home Orders link. Layer separation correct. No schema changes. M4 files typecheck clean.

Proceed to M5 with preconditions: test order flow end-to-end (M3 checkout → M4 list/notifications/actions); configure `TELEGRAM_BOT_TOKEN` + `SELLER_CHAT_ID` if testing Telegram; per-seller Telegram remains a future schema/onboarding task.
