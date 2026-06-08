# MILESTONE_05 — Freemium Tracking
## QRS

This prompt begins Milestone 5. Read it fully before writing any code.

---

## Goal

Monthly order count is tracked per seller. When a seller crosses the free tier threshold, it is logged. Stripe Connect fee activation is stubbed but not live — that is V3. A Vercel cron job resets counts on the 1st of each month.

---

## Before You Write Any Code

### Step 1 — Confirm M4 state

Verify the following before starting:
- End-to-end checkout works with test card
- Order saved to DB correctly after checkout
- Email fulfillment fires on successful order
- Product quantity and inStock updated after purchase

If any of these are broken, stop and report.

### Step 2 — Read the relevant existing files

- `prisma/schema.prisma` — Seller model, check for `monthlyOrderCount` and `billingPeriodStart` fields
- `src/app/api/webhooks/stripe/route.ts` — where order is saved, this is where count increment goes
- `src/app/api/cron/` — check if cron route exists already

### Step 3 — Describe your implementation plan

Before writing anything, describe in plain English:
- Where in the webhook handler you will increment the count
- How the cron job will be structured
- How threshold detection will work

**Wait for approval before writing any code.**

---

## What to Build

### 1. Increment order count on purchase

In the Stripe webhook handler, after the order is saved to DB:

```typescript
await prisma.seller.update({
  where: { id: seller.id },
  data: {
    monthlyOrderCount: { increment: 1 }
  }
})
```

### 2. Threshold detection

After incrementing, check if the seller has crossed the free tier threshold:

- Free tier threshold: **20 orders/month**
- If `monthlyOrderCount` equals 21 (first order over threshold):
  - Log to console: `[FREEMIUM] Seller ${seller.id} (${seller.storeName}) crossed threshold — Connect fee activation pending (V3)`
  - Do NOT charge anything — Connect is V3
  - Do NOT block the order — it goes through normally

### 3. Cron job — monthly reset

Create `src/app/api/cron/reset-order-counts/route.ts`:

```typescript
// Resets all seller monthlyOrderCount to 0 on the 1st of each month
// Protected by CRON_SECRET env var
```

- Check `Authorization: Bearer ${CRON_SECRET}` header — return 401 if missing or wrong
- Reset all sellers: `prisma.seller.updateMany({ data: { monthlyOrderCount: 0, billingPeriodStart: new Date() } })`
- Return count of sellers reset

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/reset-order-counts",
    "schedule": "0 0 1 * *"
  }]
}
```

Add to `.env.local` and Vercel env vars:
```
CRON_SECRET=your-random-secret-here
```

### 4. Dashboard indicator (optional but nice)

In `/dashboard`, show the seller their current month usage:
- "X of 20 free orders used this month"
- If over threshold: "You've exceeded the free tier. Paid tier coming soon."
- Simple text, no fancy UI needed

---

## What NOT to Build

- Stripe Connect fee activation (V3)
- Billing page or payment collection from sellers
- Email notifications to sellers about threshold (post-MVP)
- Usage analytics beyond the simple count

---

## Done When

- `monthlyOrderCount` increments on every successful order
- Threshold crossing is logged at order 21
- Cron endpoint exists, is protected, resets counts correctly
- `vercel.json` has the cron schedule
- Dashboard shows current month order count

---

## Stop Here

Report when M5 is complete:
1. Order count increments after checkout (yes/no — check DB)
2. Threshold log fires at order 21 (yes/no)
3. Cron endpoint returns 200 and resets counts when called with correct secret (yes/no)
4. Dashboard shows order count (yes/no)
5. Any issues encountered

Do not start Milestone 6 without explicit instruction.

---

*MILESTONE_05.md — QRS — June 2026*
