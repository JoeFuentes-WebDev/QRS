# ONBOARDING — QRS
## Milestone 0: Foundation

This is the first prompt for a new Cursor session on the QRS project. Read it fully before writing any code.

---

## What This Project Is

QRS is a multi-tenant storefront platform. Any seller signs up, gets a public shop at `/[slug]`, and starts selling physical goods. Customers browse via a swipe UI and check out with Stripe.

This codebase is a fork of the lauras-pots repo — a single-tenant pottery shop. QRS converts it to multi-tenant. The existing swipe UI, Cloudinary integration, Stripe checkout, and Claude Vision AI tagging are all preserved. The core change is adding a `Seller` table and scoping everything to a seller.

---

## Your Task for This Session

Complete Milestone 0 only. Do not start Milestone 1 until Milestone 0 is fully done and confirmed working.

**Milestone 0 goal:** main branch ready. Clerk installed. Schema migrated. Seed data in place. App runs.

---

## Milestone 0 Steps

### 1. Review the existing codebase
Before writing anything, read:
- `prisma/schema.prisma` — understand the current V1 schema
- `src/app/admin/page.tsx` — understand the existing admin flow
- `src/app/shop/page.tsx` — understand the swipe UI
- `src/app/api/webhooks/stripe/route.ts` — understand the current order flow
- `src/middleware.ts` (if it exists) — understand current route protection

### 2. Create main branch
```bash
# New standalone repo — work on main directly
```

### 3. Install Clerk
```bash
npm install @clerk/nextjs
```

Add to `.env.local`:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### 4. Wrap app in ClerkProvider
In `src/app/layout.tsx`, wrap children with `<ClerkProvider>`.

### 5. Add Clerk middleware
Replace or update `src/middleware.ts`:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}
```

### 6. Update Prisma schema
Replace `prisma/schema.prisma` with the full QRS schema from `Schema.md`. Key additions:
- `Seller` model
- `sellerId` on `Product`, `HeroImage`, `Order`
- `quantity` field on `Product`
- `FulfillmentType` enum

### 7. Create and run migration
```bash
npx prisma migrate dev --name qrs-multi-tenant
```

If migration fails due to required fields with no default, add a migration step to set a default `sellerId` before making the column required.

### 8. Create seed script
Create `prisma/seed.ts`:
- Create a test Seller record for development
- Set `sellerId` on any seeded Products, HeroImages
- Run seed to verify the schema is working

Run:
```bash
npx ts-node prisma/seed.ts
```

### 9. Verify
- `npm run dev` — app starts without errors
- `/` — placeholder landing page loads
- Seed seller visible in DB with products attached
- `/dashboard` — redirects to Clerk sign-in (protected)

---

## Stop Here

When all 9 steps are complete and verified, stop. Report:
1. Migration ran successfully (yes/no)
2. Seed seller and product count confirmed
3. Any issues encountered

Do not start Milestone 1 without explicit instruction.

---

## Reference Documents

All architecture decisions are in:
- `ProductVision.md` — what this is and why
- `Architecture.md` — stack, routes, data flow
- `Schema.md` — full Prisma schema with design notes
- `TechnicalDecisions.md` — locked decisions, do not override
- `DesignPrinciples.md` — UX rules
- `BuildPlan.md` — all milestones in order
- `.cursorrules` — always-active coding rules

---

*ONBOARDING.md — QRS — Milestone 0 — June 2026*
