# MILESTONE_01 — Seller Onboarding
## QRS

This prompt begins Milestone 1. Read it fully before writing any code.

---

## Goal

A new seller can sign up, complete onboarding, and land in a working (empty) dashboard. A Seller record is created in the DB linked to their Clerk user ID.

---

## Before You Write Any Code

### Step 1 — Review M0 state

Confirm the following are true before starting:
- Clerk is installed and `ClerkProvider` wraps the app
- `/dashboard` redirects to Clerk sign-in when unauthenticated
- Seller table exists in the DB
- Seed test seller is present and visible in DB

If any of these are not true, stop and report. Do not proceed until M0 is confirmed complete.

### Step 2 — Read the relevant existing files

- `src/app/layout.tsx` — ClerkProvider location
- `src/middleware.ts` — current route protection
- `prisma/schema.prisma` — Seller model fields
- `src/app/dashboard/` (if it exists) — current dashboard state

### Step 3 — Describe your implementation plan

Before writing anything, describe in plain English:
- How you will link a Clerk user to a Seller record
- How you will detect a new user who has no Seller record yet
- How the onboarding wizard will be structured (steps, state management)
- How you will handle slug uniqueness validation

**Wait for approval before writing any code.**

---

## What to Build

### 1. Marketing landing page (`/`)

- Logo (text placeholder is fine for now)
- One line: "Your shop. Anywhere. Just a QR code."
- "Get Started" button → `/sign-up`
- "Already have a shop? Sign in" link → `/sign-in`
- Mobile-first. No marketing essay.

### 2. Clerk sign-up and sign-in routes

- `/sign-up` — Clerk hosted UI or embedded component
- `/sign-in` — Clerk hosted UI or embedded component
- After sign-up → redirect to `/onboarding`
- After sign-in → redirect to `/dashboard`

### 3. Onboarding wizard (`/onboarding`)

Protected route — must be authenticated. If authenticated user already has a Seller record, redirect to `/dashboard`.

Four steps:

**Step 1 — Store name**
- Text input: store name
- Auto-suggest slug from store name (lowercase, hyphenated, URL-safe)
- Slug input: editable, validate uniqueness against DB on blur
- Show live preview: `qrs.app/[slug]`

**Step 2 — Phone**
- Phone number input
- Basic format validation

**Step 3 — Notification preference**
- Two options: Email or Telegram + Shippo
- If Email: confirm notification email address
- If Telegram + Shippo: fields for Bot token, Shippo API key, origin address (name, street, city, state, zip, email, phone)

**Step 4 — Done**
- Create Seller record in DB with all collected data + `clerkUserId` from session
- Redirect to `/dashboard`

### 4. Middleware update

- If authenticated user has no Seller record → redirect to `/onboarding`
- If authenticated user has Seller record → allow `/dashboard`
- `/onboarding` is accessible to authenticated users only
- `/` `/sign-up` `/sign-in` are public

### 5. Empty dashboard (`/dashboard`)

- Seller name in header: "Welcome, [storeName]"
- Placeholder tabs: Add / Edit / Hero (not functional yet — that's M2)
- Settings link (not functional yet — that's M2)
- "Your shop is live at: qrs.app/[slug]" with a link

---

## What NOT to Build in This Milestone

- Functional dashboard tabs (M2)
- Settings page (M2)
- Any shop UI changes (M3)
- Stripe keys input (M2)

---

## Done When

- New user can sign up via Clerk
- Onboarding wizard completes all 4 steps
- Seller record created in DB with correct fields
- Authenticated user with no Seller record is redirected to `/onboarding`
- Authenticated user with Seller record lands in `/dashboard`
- `/dashboard` shows seller name and shop URL

---

## Stop Here

Report when M1 is complete:
1. Onboarding flow works end to end (yes/no)
2. Seller record created in DB with correct fields (list the fields populated)
3. Middleware redirects working correctly (yes/no)
4. Any issues encountered

Do not start Milestone 2 without explicit instruction.

---

*MILESTONE_01.md — QRS — June 2026*
