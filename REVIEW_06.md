# REVIEW_06.md

## SECTION 1 — HUMAN SUMMARY

M6 adds dashboard product CRUD — the feature that was blocking every real seller workflow. The new `/dashboard/products` routes are wired correctly against the V3 schema, tenant-scoped, and typecheck clean. **`npm run build` still fails** because legacy V2 files were left in the tree untouched. Nothing in M6 was manually tested against a live Cloudinary account or Anthropic API in this session. Before calling V3 shippable, run the manual test checklist at the bottom and decide when to delete or fix the dead V2 code.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Completed
- **Title:** Product CRUD and Publish Flow
- **Number:** 6

---

### 2. Files Created

| File | Description |
|------|-------------|
| `src/services/product.service.ts` | All product Prisma queries — create, read, update, delete, setPublished. Every function requires `sellerId`. |
| `src/app/dashboard/products/actions.ts` | Server actions: createProduct, updateProduct, deleteProduct, togglePublish, generateAiTags. Stripe publish gate. Analytics on publish. |
| `src/app/dashboard/products/page.tsx` | Product list — published and draft, stock, edit/delete entry points. |
| `src/app/dashboard/products/new/page.tsx` | Create product page shell. |
| `src/app/dashboard/products/[id]/page.tsx` | Edit product page. `notFound()` for missing or wrong-seller products. |
| `src/components/dashboard/product-form.tsx` | Shared create/edit form — name, description, price, stock, tags, category, images, AI tag button. |
| `src/components/dashboard/product-list.tsx` | List UI — publish checkbox with optimistic update, edit link, delete with confirm. |
| `src/components/dashboard/image-uploader.tsx` | Client-side Cloudinary direct upload via sign route. Max 5 images. |
| `src/app/api/cloudinary/sign/route.ts` | Clerk-authenticated GET. Returns `{ signature, timestamp, cloudName, apiKey, folder }`. |

---

### 3. Files Modified

| File | What Changed | Why |
|------|-------------|-----|
| `src/lib/ai-analysis.ts` | Added `generateProductTags()` — fetches first image URL, calls Claude Vision with name + description. Stub when no API key. | M6 AI tagging. |
| `src/lib/cloudinary.ts` | Added `createUploadSignature()`. | Sign route helper. |
| `src/components/dashboard/dashboard-header.tsx` | Added Products link → `/dashboard/products`. | M6 nav. |
| `src/app/dashboard/page.tsx` | Removed "Product management temporarily unavailable" message. | User directive — nav link is enough, no Products card. |
| `.env.example` | Marked `CLOUDINARY_API_SECRET` and `ANTHROPIC_API_KEY` as server-only. | Documentation. |
| `MILESTONE_06.md` | Filled §11 and §12. | Milestone handoff. |

**Left untouched (intentionally):** storefront, landing, FAQ, QR, postcard, orders, webhooks, onboarding, schema, and all legacy V2 dashboard/API files. That last choice keeps the repo in a split state: new product flow works; old dead code still compiles against a schema that no longer exists.

---

### 4. Assumptions Made

- **Publish on create:** `published: true` if `seller.stripeConnectOnboarded`; otherwise `published: false`. User-approved override of M6 §2/§8 contradiction.
- **Publish on edit:** `updateProduct` keeps existing `published` value. Editing a draft does not auto-publish even after Stripe Connect — seller must use the list toggle.
- **Analytics:** `product.published` fires on every `false → true` transition in both `createProduct` and `togglePublish`. User-approved override of M6 §8 "togglePublish only" rule.
- **No HeroImage model:** Images are Cloudinary URLs on `Product.images[]`. Same model M5 postcard picker already depends on.
- **Price:** Form shows USD dollars; DB stores integer cents.
- **Delete:** Hard delete. Cloudinary assets are not deleted from Cloudinary on product delete — orphaned images will accumulate unless cleaned up later.
- **AI tags:** Only the first image URL is sent to Claude. Failure or missing key returns stub tags; save is never blocked.
- **Stripe gate source:** `getCurrentSeller()` reads the Seller row from DB on each action call. That satisfies the server-side gate requirement; it is not a separate re-fetch inside `togglePublish` but the data is fresh per request.

---

### 5. Open Questions

- **When do we delete legacy V2 code?** `src/app/dashboard/actions.ts`, `add-tab.tsx`, `edit-tab.tsx`, `hero-tab.tsx`, `/api/products/[id]`, `/api/dashboard/hero`, `/api/hero`, cron/fulfill/twilio/telegram webhooks — all reference V2 schema fields (`inStock`, `imageUrl`, `heroImage`, `orderItems`, etc.). They cause **40+ TypeScript errors** and block `npm run build`. M6 did not touch them. This needs a dedicated cleanup milestone or delete pass before production deploy.
- **Dotell `product.published` payload:** Sends `{ productId }` only. Confirm with dotell provider before relying on it in production.
- **Cloudinary folder signing:** Uploads go to `qrs/{sellerId}/products`. Untested against your Cloudinary account in this session.
- **Draft → published on edit:** Create auto-publishes when Stripe is connected; edit does not. Is that the long-term UX, or should edit save also promote drafts once Stripe is connected?

---

### 6. Risks

| Risk | Severity | What happens | Developer action |
|------|----------|--------------|------------------|
| `npm run build` fails on legacy V2 files | **High** | Vercel deploy fails until V2 code is removed or fixed | Delete or rewrite dead routes before production |
| Cloudinary env not set | **High** | Sign route 500; no images upload | Set all three Cloudinary vars in `.env` |
| Cloudinary upload untested | **High** | Sign/upload flow may fail on first real attempt | Test add-product with images locally |
| Postcard/storefront E2E untested | **Medium** | M6 unblocks the path but nobody ran it in this session | Create product → publish → check `/[slug]` and postcard download |
| AI tags stub in dev | **Low** | Without `ANTHROPIC_API_KEY`, tags are always `handmade` / `artisan` / `General` | Set key for real tagging |
| Orphaned Cloudinary images on delete | **Low** | DB row gone; Cloudinary file remains | Accept for V3 or add cleanup later |
| Edit-save does not publish drafts | **Low** | Seller connects Stripe, edits existing draft, saves — still draft until toggle | Document or change UX |
| `ONBOARDING.md` still says M1 | **Low** | Stale project doc | Regenerate when convenient |

---

### 7. Layer Violations

**One pre-existing violation, unchanged by M6:**

- `src/app/dashboard/page.tsx` queries `prisma.product` directly for postcard image options instead of going through `product.service.ts`. M6 did not fix this.

**M6-specific notes (not violations):**

- Product list page calls `listProductsForSeller()` from the service — correct.
- All mutations go through `products/actions.ts` — correct.
- `image-uploader.tsx` duplicates `MAX_PRODUCT_IMAGES = 5` locally to avoid importing the service (which pulls Prisma) into a client component — correct tradeoff.

---

### 8. Engineering Rule Violations

| Rule | Status | Notes |
|------|--------|-------|
| Tenant-scoped Prisma (`where: { sellerId }`) | **Pass** | All queries in `product.service.ts` |
| Mutations via server actions, not Prisma in components | **Pass** | |
| Publish gate enforced server-side | **Pass** | create + togglePublish |
| `product.published` fire-and-forget | **Pass** | `void trackSellerEvent` |
| Max 5 images (client + server) | **Pass** | |
| Price in cents, stock ≥ 0 | **Pass** | |
| No schema changes | **Pass** | |
| No storefront/landing changes | **Pass** | |
| Secrets server-only | **Pass** | |
| `product.published` only in `togglePublish` (M6 §8 DON'T) | **Bent — user-approved** | Also fires in `createProduct` on auto-publish |
| M6 §2 "auto-published on save" vs §4 "no publish toggle" | **Bent — user-approved** | Both create auto-publish and list toggle exist |
| Pages call services, not Prisma | **Bent — pre-existing** | Dashboard home still queries Prisma for postcard |

---

### 9. Ready to Proceed

- **Ready:** yes — for M6 scope
- **Ready for production deploy:** no — `npm run build` fails on legacy V2 code; Cloudinary and E2E flows are unverified

**Reasoning:** M6 deliverables are complete. Sellers can list, create, edit, delete, and publish products through `/dashboard/products` with Stripe gating and `product.published` analytics. The new code is tenant-scoped, layered correctly, and typechecks. The repo is not deploy-clean until V2 dead code is removed. Run this checklist before sign-off:

1. Set Cloudinary + Anthropic env vars
2. Create product with images at `/dashboard/products/new`
3. Without Stripe Connect → confirm draft + notice
4. Connect Stripe → create or toggle publish → confirm product on `/[slug]`
5. Download postcard → confirm image appears in picker
6. Check console for `[dotell] … event=product.published`
7. Delete or fix legacy V2 files so `npm run build` passes
