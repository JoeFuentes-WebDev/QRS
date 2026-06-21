# PREFLIGHT — QRS V3

## Bug Fixes Before V3 M1 Starts

This prompt must be completed before any V3 milestone work begins. Read it fully before writing any code.

---

## Rules

- Fix one item at a time
- After each fix, report what was changed and wait for approval before moving to the next
- Never commit or push without explicit approval
- Never use the GitHub API to edit files
- Edit local filesystem only
- Diagnose before acting — explain the problem and proposed fix, wait for approval

---

## Step 1 — Laura's Pots String Audit

Before fixing anything, search the entire codebase for all references to Laura's Pots.

Search for these terms:

- `Laura's Pots`
- `Laura's`
- `lauras`
- `laura`
- `Laura`
- `LAURA`

For each match, report:

- File path
- Line number
- The full line of code
- Whether it's hardcoded UI copy, an env var, a comment, or a variable name

**Do not fix anything yet. Just report.**

Wait for approval before proceeding.

---

## Step 2 — Fix Laura's Pots References

Based on the audit, fix each reference:

- UI copy referencing "Laura's Pots" → replace with `seller.storeName` if dynamic, or "QRS" if platform-level
- Env var names containing "LAURA" → rename to generic equivalents
- Comments → update to reflect QRS
- Variable names → rename where practical

Fix in batches by file. Report each file changed. Wait for approval between files.

---

## Step 3 — Fix `/admin` Route

Current behavior: `/admin` renders the old Laura's Pots admin UI.

Expected behavior: same auth flow, but on success renders a placeholder "Sellers" page instead of the Laura's Pots admin.

Task: update `admin/page.tsx` only — replace the Laura's Pots admin UI with a simple placeholder. "Sellers dashboard coming soon." Do not touch `admin/layout.tsx`.

Add a logout button to the admin page that effetively logges out the admin. i.e remove the storage key.

Report the fix and wait for approval.

---

## Step 4 — Fix Dashboard Store Name

Current behavior: dashboard shows "Laura's Pots" instead of the logged-in seller's store name.

Expected behavior: dashboard pulls `seller.storeName` from the Seller record linked to the Clerk session.

Find where the dashboard fetches seller data. Verify it's using `getCurrentSeller()` from `src/lib/seller.ts` and that the Seller record lookup is correct.

If the store name is hardcoded anywhere in the dashboard, replace it with the dynamic value.

Report the fix and wait for approval.

---

## Step 5 — Add Logout Button to Dashboard

Current behavior: no logout button exists in the dashboard.

Expected behavior: a logout button in the dashboard header or nav that calls Clerk's `signOut()` and redirects to `/`.

Add a logout button using Clerk's `<SignOutButton>` component or `useClerk().signOut()`. Place it in the dashboard header, top right.

Report the fix and wait for approval.

---

## Step 6 — Fix Privacy/Terms 404

Current behavior: `/privacy` and `/terms` return 404.

Expected behavior: both pages exist and render basic placeholder content.

Create:

- `src/app/privacy/page.tsx` — Privacy Policy placeholder
- `src/app/terms/page.tsx` — Terms of Service placeholder

Both pages should have:

- QRS header/nav
- "Last updated: June 2026"
- A brief placeholder paragraph: "This page is being updated. Please check back soon."
- Link back to `/`

Report the fix and wait for approval.

---

## Done When

All six steps are complete and confirmed:

1. Laura's Pots audit complete, all references cleaned up
2. `/admin` redirects correctly
3. Dashboard shows correct seller store name
4. Logout button present and working
5. Privacy and Terms pages render without 404

**Only after all five are confirmed: proceed to V3 M1.**

---

*PREFLIGHT.md — QRS V3 — June 2026*