# MILESTONE_04.md

## SECTION 1 — HUMAN SUMMARY

Milestone 4 builds the seller order management flow: Telegram notifications on new orders, a dashboard orders list with PENDING/ACCEPTED/DECLINED/FULFILLED status display, and the seller-facing order detail view. This comes directly after M3 because it depends on the Order and OrderItem records that webhook now creates. No schema changes. Medium complexity — three distinct surfaces (Telegram, dashboard list, detail page) but no new external integrations beyond Telegram which is already wired.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Title:** Seller Order Management — Telegram Notifications, Dashboard Orders List, and Order Detail  
**Number:** M4

---

### 2. What This Milestone Builds

**Telegram notification on new order:**
- When `checkout.session.completed` fires and an Order is successfully created, the webhook handler calls a new `notification.service.ts` which sends a Telegram message to the seller's configured Telegram chat.
- Message content: buyer email, order total (formatted in dollars), item names + quantities, and an order ID.
- Fire-and-forget: Telegram failure never throws, never blocks order creation, logged only.
- Seller notification email via Resend (to `seller.notificationEmail`) also sent from `notification.service.ts` — same fire-and-forget pattern.

**Dashboard orders list:**
- New authenticated page at `/dashboard/orders` listing all orders for the authenticated seller.
- Displays: order ID (truncated), buyer email, order total, status badge (PENDING / ACCEPTED / DECLINED / FULFILLED / REFUNDED), created date.
- Orders sorted by `createdAt DESC`.
- Seller-scoped: only orders where `sellerId` matches authenticated seller.
- Empty state handled.
- No pagination in M4 — all orders returned (V4 concern).

**Order detail page:**
- New authenticated page at `/dashboard/orders/[id]`.
- Displays: all list fields plus line items (product name, quantity, priceSnapshot in dollars), Stripe session ID.
- Seller-scoped: 404 if order belongs to a different seller.
- Status action buttons: PENDING → "Accept" and "Decline"; ACCEPTED → "Mark Fulfilled"; other states read-only.
- Buttons call new API routes that update the Order status and trigger dotell analytics event.

**Status transition API routes:**
- `POST /api/orders/[id]/accept` — sets status to `ACCEPTED`, fires `order.accepted` dotell event.
- `POST /api/orders/[id]/decline` — sets status to `DECLINED`, fires `order.declined` dotell event.
- `POST /api/orders/[id]/fulfill` — sets status to `FULFILLED`, no dotell event (not in analytics spec).
- All three routes: Clerk-authenticated, seller-scoped (verify `sellerId` matches), validate current status before transition (accept/decline only from PENDING, fulfill only from ACCEPTED), return 403 on mismatch, 409 on invalid transition.

**Services:**
- `notification.service.ts` — Telegram message send + seller notification email via Resend. Called from webhook route after order creation. Both fire-and-forget.
- `order.service.ts` — extend with `getOrdersForSeller(sellerId)`, `getOrderById(orderId, sellerId)`, `updateOrderStatus(orderId, sellerId, newStatus)`.

---

### 3. Why This Comes Next

M3 created the checkout, webhook, and Order/OrderItem records. Those records have no UI and sellers have no visibility into new orders. M4 closes that gap. The Telegram notification depends on the webhook completing successfully (M3). The dashboard order list and detail page depend on `Order` and `OrderItem` existing in the schema (M3). No other milestones are blocked by M4 — M5 (QR/postcard/FAQ) is independent. M4 must complete before any seller can operate the store end-to-end.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/services/notification.service.ts` | Telegram message to seller + seller notification email via Resend. Fire-and-forget. Never throws. |
| `src/app/dashboard/orders/page.tsx` | Authenticated dashboard page — seller orders list, status badges, sorted by date, empty state. |
| `src/app/dashboard/orders/[id]/page.tsx` | Authenticated dashboard order detail page — line items, status, action buttons, 404 on wrong seller. |
| `src/app/api/orders/[id]/accept/route.ts` | POST — authenticated, seller-scoped, transitions PENDING → ACCEPTED, fires dotell `order.accepted`. |
| `src/app/api/orders/[id]/decline/route.ts` | POST — authenticated, seller-scoped, transitions PENDING → DECLINED, fires dotell `order.declined`. |
| `src/app/api/orders/[id]/fulfill/route.ts` | POST — authenticated, seller-scoped, transitions ACCEPTED → FULFILLED. |

---

### 5. Files to Modify

| Path | What Changes | Why |
|------|--------------|-----|
| `src/app/api/webhooks/stripe/route.ts` | After successful `order.service.ts` call, call `notification.service.ts` for Telegram + seller email. Import and call fire-and-forget — `void notifySellerNewOrder(order, seller)`. | M4 adds seller notification to the webhook flow. |
| `src/services/order.service.ts` | Add `getOrdersForSeller(sellerId)`, `getOrderById(orderId, sellerId)`, `updateOrderStatus(orderId, sellerId, newStatus, allowedFrom)`. Existing `createOrder` untouched. | Dashboard and status API routes require read + update operations. |
| `src/app/dashboard/page.tsx` | Add "Orders" link/card pointing to `/dashboard/orders`. | Navigation entry point for sellers to reach new order management. |

---

### 6. Files to Leave Untouched

- `prisma/schema.prisma` — no schema changes in M4
- Any migration files under `prisma/migrations/`
- `src/services/checkout.service.ts`
- `src/services/email.service.ts`
- `src/lib/stripe.ts`
- `src/lib/shop-product.ts`
- `src/app/[slug]/page.tsx`
- `src/app/[slug]/success/page.tsx`
- `src/app/[slug]/cancel/page.tsx`
- `src/components/shop/` — all storefront components
- `src/app/api/checkout/session/route.ts`
- `src/app/api/webhooks/stripe/route.ts` (except the single addition described in §5)
- All onboarding routes and components
- All Stripe Connect onboarding routes (`/dashboard/stripe/return`, `/dashboard/stripe/refresh`)
- All product CRUD dashboard routes and actions
- `src/app/api/products/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/hero/route.ts`
- Middleware (`src/middleware.ts`)
- `.cursorrules`

---

### 7. Layer Rules Reminder

1. **Tenant scoping is absolute.** Every Prisma query in `order.service.ts` that touches Order or OrderItem data MUST include `where: { sellerId }` or validate `order.sellerId === authenticatedSellerId`. A 403 must be returned — not a 404 — when an order exists but belongs to a different seller.

2. **Notification is fire-and-forget.** `notification.service.ts` must never throw. All Telegram API calls and Resend calls are wrapped in try/catch. Failure is logged (`console.error`) only. The webhook route calls `void notifySellerNewOrder(...)` — no `await` that could block order completion.

3. **Route handlers call services, not Prisma directly.** The three status API routes (`accept`, `decline`, `fulfill`) import and call `order.service.ts` functions only — no `prisma` import in route handler files.

---

### 8. Engineering Rules

**DO:**
- Use Clerk `auth()` in every `/api/orders/[id]/*` route to get `userId`, then look up `Seller` by `clerkUserId` to get `sellerId` before any order operation.
- Return HTTP `409 Conflict` when a status transition is invalid (e.g., trying to accept an already-ACCEPTED order).
- Return HTTP `403 Forbidden` when the authenticated seller does not own the order.
- Return HTTP `404` when the order ID does not exist at all.
- Use `trackSellerEvent` for `order.accepted` and `order.declined` events — same pattern as M2/M3 dotell calls.
- Format all money values (priceSnapshot, order totals) from cents to dollars in the UI layer only — store and pass as cents in service layer.
- Telegram message must include: seller-facing order reference (order ID last 8 chars), buyer email, item list (name × qty), and total in dollars.
- Seller notification email (Resend) must use seller's `notificationEmail` field from the Seller record.

**DO NOT:**
- Do not send Telegram or email notifications from the status transition routes (accept/decline/fulfill) — notification is only on new order creation from webhook. Seller-to-buyer communication on accept/decline is V5+ scope.
- Do not implement pagination on the orders list — all orders for the seller, sorted by date descending, no cursor or offset pagination.
- Do not add REFUNDED status transition UI — REFUNDED is manual DB operation only in V3. Read-only display of REFUNDED status is acceptable.
- Do not expose `stripeConnectAccountId` or any Stripe secret identifiers on any dashboard page.
- Do not put Prisma client imports in route handler files — service layer only.
- Do not send buyer-facing emails from notification.service.ts — buyer email is handled by `email.service.ts` (M3). `notification.service.ts` is seller-facing only.
- Do not use `NEXT_PUBLIC_*` prefixed env vars for Telegram bot token or Resend API key.
- Do not add new Prisma models or modify the schema.

---

### 9. Ambiguity Protocol

If any of the following are unclear, stop and record in §12 Open Questions before writing code:

- The Telegram bot token env var name or chat ID field location on the Seller model (check existing V2 Telegram code or ONBOARDING.md before assuming).
- Whether `src/app/dashboard/page.tsx` already has an orders navigation entry — check before modifying.
- Whether `notificationEmail` is nullable on the Seller model — if null, skip Resend call silently.
- Whether the existing `trackSellerEvent` utility signature matches intended usage — do not change the signature, adapt the call.
- If `src/lib/resend.ts` (V2, noted broken in M3 review) conflicts with `email.service.ts` — do not modify `resend.ts`; `notification.service.ts` must import from `email.service.ts` or instantiate Resend directly with the same pattern.

If no safe assumption exists for any of the above — stop, do not guess, record in Open Questions.

---

### 10. What Is NOT in This Milestone

- Buyer-facing order status page or email updates on accept/decline
- Seller-to-buyer communication of any kind from dashboard
- Order refund initiation UI (REFUNDED is manual DB only in V3)
- Pagination or filtering on the orders list
- Order search
- Bulk order status actions
- Shippo label generation on fulfillment
- Any analytics beyond `order.accepted` and `order.declined` dotell events
- Seller email notification on order acceptance/decline/fulfillment (only on new order — `checkout.session.completed`)
- Telegram notifications on order state changes (accept/decline/fulfill) — only on new order creation
- Admin order view
- Dashboard product CRUD fixes
- Stripe Connect onboarding changes
- Any new Prisma models or schema migrations
- FAQ page, QR code, or postcard (M5)
- Settings page changes

---

### 11. Assumptions Made

- **Assumption 1:** Telegram uses platform `TELEGRAM_BOT_TOKEN` + `SELLER_CHAT_ID` (Option A, user-approved) — no Seller schema fields. Skipped silently when env vars unset.
- **Assumption 2:** Seller notification email in `notification.service.ts` — separate from M3 buyer `email.service.ts` and broken V2 `lib/resend.ts`.
- **Assumption 3:** Order totals computed from line items (`priceSnapshot × quantity`); no Order.total column.
- **Assumption 4:** Dashboard detail page uses `notFound()` for missing and wrong-seller orders; API routes use 404/403/409 per spec.
- **Assumption 5:** Orders link on `/dashboard` home card only — header unchanged.
- **Assumption 6:** Supporting components `order-actions.tsx` and `order-status-badge.tsx` added for dashboard UI.

---

### 12. Open Questions

- **Question 1 (resolved):** Telegram without schema — Option A implemented.
- **Question 2 (resolved):** Dashboard home card for Orders navigation.
- **Question 3 (resolved):** Detail page `notFound()` for access denial.
- **Question 4:** Per-seller `telegramChatId` on Seller + onboarding — deferred to later milestone (BuildPlanV3).
- **Question 5:** Full project build still fails on V2 legacy routes; M4 paths typecheck clean.
- **Question 6:** Manual product insert still required for checkout testing until dashboard CRUD restored.