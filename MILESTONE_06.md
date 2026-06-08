# MILESTONE_06 — Deploy to Vercel
## QRS

This prompt begins Milestone 6. Read it fully before writing any code.

---

## Goal

QRS is live on Vercel. Production Neon database is migrated. All env vars are configured. End-to-end smoke test passes on the live URL.

---

## Before You Write Any Code

### Step 1 — Confirm M5 state

Verify the following before starting:
- `monthlyOrderCount` increments on every successful order
- Cron endpoint resets counts and returns 200 with correct secret
- `vercel.json` has the cron schedule

If any of these are broken, stop and report.

### Step 2 — Read the relevant existing files

- `vercel.json` — confirm cron config is present
- `.env.local` — full list of env vars needed
- `prisma/schema.prisma` — confirm schema is final
- `package.json` — confirm build script

### Step 3 — Describe your deployment plan

Before doing anything, list:
- Every env var that needs to be added to Vercel
- Any build configuration changes needed
- Any schema changes that need to run against production DB

**Wait for approval before proceeding.**

---

## What to Do

### 1. Production Neon database

- Create a new Neon database for production (separate from dev)
- Name it `qrs-production`
- Copy the production connection string

### 2. Vercel project setup

- Go to vercel.com → New Project → Import `JoeFuentes-WebDev/QRS`
- Framework: Next.js (auto-detected)
- Do NOT deploy yet — configure env vars first

### 3. Configure all env vars in Vercel

Add every variable from `.env.local` to Vercel project settings:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Production Neon connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/onboarding` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` (until domain is set up) |
| `CRON_SECRET` | Same value as local |

**Do NOT add Stripe keys here** — those are per-seller, stored in the DB.

### 4. Run production migration

After Vercel project is created and DATABASE_URL is set:

```bash
DATABASE_URL=your-production-neon-url npx prisma migrate deploy
```

This runs all migrations against the production database. Do not run `migrate dev` — use `migrate deploy` for production.

### 5. Deploy

- Trigger deploy from Vercel dashboard or push to main
- Watch build logs for errors
- First deploy will likely succeed if build passes locally

### 6. Configure Clerk for production

- Go to Clerk dashboard → your app
- Add production domain to allowed origins: `qrs.vercel.app` (or `get-qrs.com` if domain is connected)
- Verify sign-up and sign-in work on the live URL

### 7. Configure Stripe webhook for production

- Go to Stripe dashboard → Developers → Webhooks
- Add endpoint: `https://qrs.vercel.app/api/webhooks/stripe`
- Select event: `checkout.session.completed`
- Copy the signing secret
- Each seller will need to add this webhook secret to their Settings

### 8. Smoke test on live URL

Test the full flow on the production URL:

1. Visit `qrs.vercel.app` — landing page loads
2. Sign up as a new seller — onboarding completes, Seller record created in production DB
3. Add a product via dashboard — AI tagging works, product saved
4. Upload a hero image — Cloudinary upload works
5. Visit `qrs.vercel.app/[your-slug]` — shop loads, product visible
6. Add Stripe test keys in Settings
7. Complete a test checkout with card `4242 4242 4242 4242`
8. Verify order in production DB
9. Verify email notification received
10. Verify `monthlyOrderCount` incremented in DB

---

## Custom Domain (Optional — do if get-qrs.com is purchased)

- Go to Vercel project → Settings → Domains
- Add `get-qrs.com`
- Vercel provides DNS records — add them to your domain registrar
- SSL cert is automatic
- Update `RESEND_FROM_EMAIL` to `orders@get-qrs.com` after DNS verifies with Resend

---

## Done When

- QRS live on Vercel at `qrs.vercel.app` (or custom domain)
- Production DB migrated and connected
- Full smoke test passes end to end
- New seller can sign up, add products, and receive orders on the live URL

---

## Stop Here

Report when M6 is complete:
1. Vercel deploy successful, no build errors (yes/no)
2. Production DB migrated (yes/no)
3. All 10 smoke test steps pass (yes/no — note any failures)
4. Any issues encountered

---

## Post-Launch — Immediate Next Steps

These are not part of M6 but do them right after launch:

- Add `telegramChatId` field to onboarding form for Telegram sellers
- Add help tooltip in Settings explaining where to find Stripe webhook secret
- Buy `get-qrs.com` and connect to Vercel
- Verify domain with Resend, update `RESEND_FROM_EMAIL`
- Share with 2-3 real sellers and get feedback

---

*MILESTONE_06.md — QRS — June 2026*
