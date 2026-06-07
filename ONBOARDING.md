# ONBOARDING — QRS
## Milestone 0: Foundation

This is the first prompt for a new Cursor session on the QRS project. Read it fully before writing any code.

---

## What This Project Is

QRS is a multi-tenant storefront platform. Any seller signs up, gets a public shop at `/[slug]`, and starts selling physical goods. Customers browse via a swipe UI and check out with Stripe.

This codebase is a fork of the lauras-pots repo — a single-tenant pottery shop. QRS converts it to multi-tenant. The existing swipe UI, Cloudinary integration, Stripe checkout, and Claude Vision AI tagging are all preserved. The core change is adding a `Seller` table and scoping everything to a seller.

---

## Before You Write a Single Line of Code

Do these steps in order. Do not skip ahead.

### Step 1 — Read the existing codebase

Read these files and understand what they do:
- `prisma/schema.prisma` — current data model
- `src/app/page.tsx` — splash/landing page
- `src/app/shop/page.tsx` — swipe UI
- `src/app/admin/page.tsx` — seller admin
- `src/app/api/webhooks/stripe/route.ts` — order flow
- `src/middleware.ts` (if it exists) — current route protection

### Step 2 — Read all the docs in the repo root

- `ProductVision.md`
- `Architecture.md`
- `Schema.md`
- `TechnicalDecisions.md`
- `DesignPrinciples.md`
- `BuildPlan.md`
- `.cursorrules`

### Step 3 — Audit for conflicts

Based on what you read in Steps 1 and 2, answer these questions:
- Does anything in the existing code conflict with the plan in `BuildPlan.md`?
- Are there patterns in the codebase that would make any milestone harder or easier than described?
- Are there dependencies, gotchas, or assumptions in the current code worth flagging?

### Step 4 — Describe the current architecture

In your own words, summarize what you found. Include:
- Current auth model
- Current product model
- Current order flow
- Current admin flow

This summary should demonstrate understanding of the codebase. Do not copy-paste code — describe it in plain English.

### Step 5 — Report back

List any conflicts or concerns you found. Be specific — file name, line number, what the issue is, why it matters.

If everything looks clean, say so explicitly.

**Wait for approval before proceeding.**

### Step 6 — Propose Milestone 0 steps

Once approved, propose the specific steps for Milestone 0 based on what you found in the codebase. Do not copy-paste a generic plan — base it on the actual code.

**Wait for approval before writing any code.**

---

## Milestone 0 Goal

Main branch ready. Clerk installed. Schema migrated. Seed data in place. App runs. All existing functionality preserved.

---

## Stop Here

Do not start Milestone 1 without explicit instruction.

After Milestone 0 is complete, report:
1. Migration ran successfully (yes/no)
2. Seed seller and product count confirmed
3. Any issues encountered

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
