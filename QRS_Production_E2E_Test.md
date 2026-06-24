# QRS Production E2E Test Script
**URL:** https://my-qrs.co  
**Date:** Run after every production deploy  
**Cost:** ~$0.30 (Stripe fee on $1 test purchase, refunded immediately after)

---

## SETUP — Before You Start

- [ ] Have your real credit card ready (or a prepaid card)
- [ ] Open two browser windows: one normal, one incognito
- [ ] Have Stripe dashboard open in a third tab (dashboard.stripe.com)
- [ ] Have Telegram open on your phone
- [ ] Have access to your notification email (soccer@joefuentes.com)

---

## PHASE 1 — Seller Signup

In the **normal browser window:**

- [ ] Go to https://my-qrs.co
- [ ] Click "Get Started" or sign up
- [ ] Create a new account with a real email
- [ ] Complete onboarding:
  - [ ] Store name: `E2E Test Shop`
  - [ ] Slug: `e2e-test-shop`
  - [ ] Notification email: your email
- [ ] Confirm you land on `/dashboard`
- [ ] Confirm welcome message shows store name (not hardcoded "Laura's Pots")

---

## PHASE 2 — Stripe Connect

- [ ] Click "Connect Stripe" on dashboard
- [ ] Confirm Stripe opens in a new tab
- [ ] Complete Stripe Express onboarding (use real info — this is live mode)
- [ ] Return to dashboard
- [ ] Click refresh icon — confirm status changes to "Connected — ready to accept payments"
- [ ] If still showing "Onboarding incomplete" — check Stripe dashboard for account status

---

## PHASE 3 — Hero Images

- [ ] Go to dashboard
- [ ] Upload 2-3 hero images
- [ ] Confirm images appear in the list with delete buttons
- [ ] Go to https://my-qrs.co/e2e-test-shop in incognito
- [ ] Confirm hero images rotate as background
- [ ] Confirm fallback (stone gradient) if no images uploaded

---

## PHASE 4 — Add a Product

- [ ] Go to Dashboard → Products → Add product
- [ ] Upload one product image
- [ ] Confirm AI tagging runs automatically ("Analyzing photo…" appears)
- [ ] Confirm name, description, tags, category populate from AI
- [ ] Set price: `1.00` (one dollar)
- [ ] Set stock: `5`
- [ ] Click "Create product"
- [ ] Confirm product appears in product list
- [ ] Confirm product is published (auto-publish on Stripe Connect complete)

---

## PHASE 5 — Connect Telegram

- [ ] On dashboard, find "Connect Telegram" button
- [ ] Tap it — Telegram should open with the bot
- [ ] Tap "Start" in Telegram
- [ ] Confirm bot sends a confirmation message
- [ ] Return to dashboard — confirm Telegram shows as connected

---

## PHASE 6 — Buyer Storefront

In the **incognito window:**

- [ ] Go to https://my-qrs.co/e2e-test-shop
- [ ] Confirm product is visible
- [ ] Confirm buy button is active (not "Not accepting payments yet")
- [ ] Confirm hero images display as rotating background
- [ ] Add product to cart
- [ ] Tap checkout

---

## PHASE 7 — Checkout (Real $1 Purchase)

- [ ] Confirm Stripe checkout page loads
- [ ] Confirm store name "E2E Test Shop" appears
- [ ] Enter real credit card details
- [ ] Complete purchase
- [ ] Confirm success page loads
- [ ] Confirm buyer receives order confirmation email

---

## PHASE 8 — Seller Notifications

- [ ] Check notification email — confirm "New order" email arrived from orders@my-qrs.co (or onboarding@resend.dev if Resend domain not yet set up)
- [ ] Check Telegram — confirm order notification received with product name, total, and Accept/Decline buttons
- [ ] Tap Accept in Telegram — confirm order status updates

---

## PHASE 9 — Order Management

Back in the **normal browser window (seller dashboard):**

- [ ] Go to Dashboard → Orders
- [ ] Confirm order appears as ACCEPTED (or PENDING if Telegram not used)
- [ ] Open order detail
- [ ] Click "Mark as fulfilled"
- [ ] Confirm status changes to FULFILLED

---

## PHASE 10 — Postcard

- [ ] Go to dashboard home
- [ ] Find Postcard section
- [ ] Select hero image from dropdown
- [ ] Click "Download postcard"
- [ ] Confirm 4x6 PDF downloads with QR code, store name, and hero image

---

## PHASE 11 — QR Code

- [ ] Go to https://my-qrs.co/api/qr?slug=e2e-test-shop
- [ ] Confirm QR code PNG loads
- [ ] Scan QR code with phone — confirm it opens the storefront

---

## PHASE 12 — Settings

- [ ] Go to Dashboard → Settings
- [ ] Confirm store name and slug show correctly (read-only)
- [ ] Confirm shop URL shows https://my-qrs.co/e2e-test-shop
- [ ] Confirm notification email is editable
- [ ] Confirm Stripe Connect status shows connected
- [ ] Confirm shipping section shows BAKED_IN copy

---

## PHASE 13 — Refund

In **Stripe dashboard (live mode):**

- [ ] Go to Payments
- [ ] Find the $1 test payment
- [ ] Click Refund
- [ ] Confirm refund processed

---

## PHASE 14 — Cleanup

- [ ] Delete the test product from dashboard
- [ ] Optionally delete the E2E Test Shop seller account from Clerk dashboard
- [ ] Note any issues in the log below

---

## Issues Found

| Step | Issue | Severity | Status |
|------|-------|----------|--------|
| | | | |

---

## Sign-off

- **Date tested:**
- **Tester:**
- **Result:** PASS / FAIL
- **Notes:**
