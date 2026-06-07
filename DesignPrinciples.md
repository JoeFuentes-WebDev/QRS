# QRS — Design Principles
## MVP

These are the UX rules for this codebase. Cursor should follow them without being asked.

---

## Mobile-First, Always

Every surface is designed for a phone first. Desktop is a bonus.

- Touch targets minimum 44x44px
- No hover-only interactions
- Admin dashboard must be fully usable on mobile (sellers manage their shop between customers)
- Swipe gestures are primary — tap is secondary

---

## Shop UX: Swipe Card Rules

### Gestures
- Swipe RIGHT → ♥ add to cart (BUY overlay)
- Swipe LEFT → ✕ skip, card goes to back of queue (SKIP overlay)
- Swipe UP → 📌 save/pin (SAVE overlay)
- Tap image → expand/collapse detail panel

### Collapsed State
- Action buttons (✕ ♥ 📌) are always visible in collapsed state
- Buttons fire their action immediately in collapsed state — they do NOT trigger card expand
- `e.stopPropagation()` is required on all action button click handlers
- The tap-to-expand handler lives on the card/image area only, not on the buttons

### Skip Behavior
- ✕ skip pushes the card to the back of the queue. It is not removed.
- On first skip ever, show a one-time hint tooltip on the ✕ button: "Skipped items come back around"
- Hint uses the same pattern as the existing onboarding gesture overlay (shows once, dismissed on interaction)
- Do not change the ✕ icon to ↺. The ✕ accurately communicates "dismiss this card for now."

### Queue
- Cards loop. The queue never empties as long as there are products.
- Out-of-stock products are filtered from the queue entirely.

---

## Onboarding Overlay

- Shows once on first visit (localStorage flag)
- Arrows illustrating swipe directions
- Dismissed on any swipe or tap
- Do not show again after dismissal

---

## Detail Panel

- Collapsed: product photo full-bleed, title overlay, action buttons at bottom
- Expanded: photo, title, tags, description, price, action buttons
- Transition: smooth slide-up animation
- Tap anywhere on the photo area to collapse

---

## Admin / Dashboard UX

- Three tabs: Add / Edit / Hero (same as QRS)
- Add tab: bulk AI upload queue, one card at a time review, thumbnail strip at top
- Edit tab: search products, edit name/price inline, soft delete (sets inStock=false, quantity=0)
- Hero tab: upload/delete rotating splash images
- Settings: separate page/tab — Stripe keys, fulfillment config, custom domain field (disabled)

---

## AI Assistance

- AI pre-fills name, category, description, tags, and suggested price in the Add queue
- Every field is editable before saving
- AI suggestion is a starting point, not a decision
- Show "AI suggested" label next to pre-filled price field

---

## Feedback and Loading States

- Every async action has a loading state (spinner or skeleton)
- Every async action has an error state with a human-readable message
- Never leave the user staring at a blank screen
- Stripe checkout: redirect immediately on button tap, no double-tap

---

## Quantity and Stock Display

- Unlimited quantity: no stock indicator shown
- Limited quantity (1-5 remaining): show "X left" badge on card (subtle, not alarming)
- Out of stock: remove from queue entirely. Do not show sold-out cards in the swipe UI.

---

## Empty States

- Empty shop (no products): friendly message + link to admin
- Empty cart: "Nothing here yet. Keep swiping."
- Empty saved: "Tap 📌 on anything you want to revisit."

---

## Color and Theme

- Shop UI: per-seller theming is V3. In V2, use the existing QRS dark aesthetic as the default.
- Admin/dashboard: clean, neutral. shadcn/ui defaults are acceptable.
- Do not introduce new color systems without explicit instruction.

---

## Copy Rules

- Short. Direct. No marketing fluff in UI copy.
- Action labels are verbs: "Add to Cart", "Skip", "Save", "Upload", "Remove"
- Error messages describe what happened and what to do: "Payment failed. Try a different card."
- Never say "Something went wrong." Always be specific.

---

*DesignPrinciples.md — QRS — June 2026*
