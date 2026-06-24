# MILESTONE_06.md

## SECTION 1 — HUMAN SUMMARY

Milestone 6 is the product CRUD and publish flow — the last major feature gap blocking real seller use of V3. Sellers currently have no way to create, edit, or publish products through the UI, which means the postcard and storefront are untestable end-to-end. This milestone adds the dashboard product management pages, Cloudinary upload wiring, AI tag/category generation, stock management, and the publish gate (Stripe Connect must be complete). Estimated complexity: high. One session, tightly scoped to product management only — no storefront changes, no order changes.

---

## SECTION 2 — CURSOR DIRECTIVE

### 1. Milestone Title and Number

**Milestone 6 — Product CRUD and Publish Flow**

---

### 2. What This Milestone Builds

A complete product management experience inside the seller dashboard:

- **Product list page** at `/dashboard/products` — shows all seller's products (published and draft), with edit and delete actions, and stock display.
- **New product page** at `/dashboard/products/new` — form with name, description, price, stock quantity, Cloudinary image upload (multi-image), AI tag/category generation on submit, and products are auto-published on save, published defaults to true on create.
- **Edit product page** at `/dashboard/products/[id]` — pre-populated form, same fields as new, allows image removal/addition, re-run AI tags, update stock, delete product.
- **Product service layer** at `src/services/product.service.ts` — all Prisma queries for product CRUD, scoped by `sellerId` on every query, no exceptions.
- **AI tagging action** at `src/app/dashboard/products/actions.ts` — server action calling Anthropic (Claude Vision) (or stub if no key) to return `tags[]` and `category` from product name + description + image URLs.
- **Publish gate enforcement** — publish toggle calls a server action that checks `seller.stripeConnectOnboarded === true` before setting `published: true`; returns a clear error message if not.
- **`product.published` analytics event** — product.published analytics event — fire trackSellerEvent('product.published', ...) inside createProduct on successful save. Fire-and-forget, never block the save response.
- **Dashboard nav link** — add "Products" link to the existing dashboard navigation so sellers can reach `/dashboard/products`.

---

### 3. Why This Comes Next

M1–M5 built schema, auth, Stripe Connect, orders, notifications, postcard, QR, FAQ, and analytics. The single remaining gap that blocks real seller use is product management. Without it:
- Sellers cannot create or publish products — the storefront is empty for every new seller.
- The postcard PDF cannot be tested end-to-end (requires published products with images, per M5 Review §4 Assumption 7).
- The `product.published` analytics event (deferred in M5) has no call site.

Product CRUD is the dependency for all remaining production verification work.

---

### 4. Files to Create

| Path | Purpose |
|------|---------|
| `src/services/product.service.ts` | All Prisma product queries — create, update, delete, list by seller, get by id+seller. Every function takes sellerId as required parameter. published defaults to true on create. No publish/unpublish toggle. |
| `src/app/dashboard/products/page.tsx` | Server component — product list for authenticated seller; renders product cards with publish toggle, edit link, delete action, stock count. |
| `src/app/dashboard/products/new/page.tsx` | Server component shell — renders `ProductForm` in create mode. |
| `src/app/dashboard/products/[id]/page.tsx` | Server component — fetches product by id+sellerId, renders `ProductForm` in edit mode; 404 if not found or wrong seller. |
| `src/app/dashboard/products/actions.ts` | Server actions: `createProduct`, `updateProduct`, `deleteProduct`, `togglePublish`, `generateAiTags`. All validate seller ownership. `togglePublish` enforces Stripe Connect gate. `generateAiTags` calls Anthropic (Claude Vision) or returns stub. |
| `src/components/dashboard/product-form.tsx` | Client component — shared form for create and edit modes. Fields: name, description, price (in pence/cents), stock, images (Cloudinary upload), tags (editable chip list), category (text). Includes "Generate Tags" button wired to `generateAiTags`. |
| `src/components/dashboard/product-list.tsx` | Client component — renders product cards list with publish toggle (calls `togglePublish`), edit/delete buttons, stock display. Handles optimistic UI for publish toggle. |
| `src/components/dashboard/image-uploader.tsx` | Client component — multi-image Cloudinary direct upload using signed preset. Calls `/api/cloudinary/sign` for signature. Displays upload progress and image previews. Allows image removal. Max 5 images per product. |
| `src/app/api/cloudinary/sign/route.ts` | Server GET — returns signed Cloudinary upload signature. Uses `CLOUDINARY_API_SECRET` (server-only). Returns `{ signature, timestamp, cloudName, apiKey }`. |

---

### 5. Files to Modify

| Path | What changes | Why |
|------|-------------|-----|
| `src/app/dashboard/layout.tsx` (or equivalent dashboard nav component) | Add "Products" nav link pointing to `/dashboard/products`. | Sellers need navigation to reach the product management section. |
| `src/services/analytics.service.ts` | No logic change — confirm `trackSellerEvent` signature accepts `'product.published'` event string. If the event enum/union type is defined, add `'product.published'` if missing. | M5 deferred this event; M6 adds the call site in `togglePublish` action. |
| `.env.example` | Add `ANTHROPIC_API_KEY` (server-only) and `CLOUDINARY_API_SECRET` (server-only) if not already present. Add comments marking both as server-only. | Document new env vars required by AI tagging and Cloudinary signing. |

---

### 6. Files to Leave Untouched

- `src/app/page.tsx` — landing page, no changes.
- `src/app/[slug]/` — storefront routes, no changes.
- `src/app/faq/page.tsx` — FAQ page, no changes.
- `src/app/api/qr/route.ts` — QR route, no changes.
- `src/app/api/postcard/route.ts` — postcard route, no changes.
- `src/app/api/webhooks/stripe/route.ts` — webhook handler, no changes.
- `src/app/api/orders/` — order routes, no changes.
- `src/app/onboarding/` — onboarding routes, no changes.
- `src/lib/postcard-pdf.ts` — no changes.
- `src/lib/qr.ts` — no changes.
- `src/lib/faq-data.ts` — no changes.
- `src/services/analytics.service.ts` — no logic changes (type-only addition if needed).
- `src/services/stripeConnect.service.ts` — no changes.
- `vercel.json` — no changes.
- `prisma/schema.prisma` — no changes. The `Product` model already exists from M1.
- Any migration files — no new migrations. M1 schema is the source of truth.

---

### 7. Layer Rules Reminder

1. **Tenant scoping is absolute.** Every function in `product.service.ts` must include `where: { sellerId }` (or `where: { id, sellerId }` for single-record fetches). No query may fetch products without a `sellerId` constraint. No exceptions.
2. **Server-only secrets stay server-only.** `CLOUDINARY_API_SECRET` and `ANTHROPIC_API_KEY` must never appear in client components or `NEXT_PUBLIC_*` env vars. The Cloudinary signing route is the only place `CLOUDINARY_API_SECRET` is used. The AI tagging server action is the only place `ANTHROPIC_API_KEY` is used.
3. **Publish gate is enforced in the service/action layer, not only in the UI.** `togglePublish` server action must re-fetch the seller's `stripeConnectOnboarded` status from the DB before allowing `published: true` — never trust client-side state for this check.

---

### 8. Engineering Rules

**DO:**
- Scope every Prisma product query with `sellerId` as a required parameter in the service function signature.
- Use server actions (`actions.ts`) for all mutations — no direct Prisma calls in page or component files.
- Fire `trackSellerEvent('product.published', { sellerId, productId })` inside `togglePublish` when transitioning from `published: false` → `published: true`. Use `void` (fire-and-forget). Never let it throw or block the publish response.
- Return structured error objects from server actions (not thrown exceptions) so client components can render inline error messages.
- For AI tagging: if `ANTHROPIC_API_KEY` is not set, return a hardcoded stub `{ tags: ['handmade', 'artisan'], category: 'General' }` and log a warning. Never block the form submit flow on AI tag failure.
- For Cloudinary signing: use `CLOUDINARY_API_SECRET` server-side only. Return `{ signature, timestamp, cloudName, apiKey }` where `apiKey` is `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`'s corresponding API key — check existing env var names already in use in the project before adding new ones.
- Limit image upload to 5 images per product. Enforce in both client UI and server action validation.
- Price must be stored in the smallest currency unit (pence/cents as integer) consistent with existing Order/Product schema from M1.
- Stock must be a non-negative integer. Validate server-side.
- On delete: allow deletion of any product with a confirmation prompt. No unpublish-first requirement.

**DON'T:**
- Do not add any new Prisma migrations or schema changes. The M1 schema is complete.
- Do not expose `CLOUDINARY_API_SECRET` or `ANTHROPIC_API_KEY` to the client bundle under any circumstances.
- Do not implement per-product QR codes or per-product shipping overrides — these are explicitly V4.
- Do not add storefront-facing changes — product discovery on the buyer side already works via existing slug routes.
- Do not implement bulk operations (bulk publish, bulk delete) — single-product actions only.
- Do not add pagination to the product list in M6 — render all seller products (reasonable count for a craft vendor).
- Do not add a seller-facing analytics surface — `product.published` fires to dotell only, no UI display.
- Do not wire the `product.published` event anywhere other than the `togglePublish` action.
- Do not implement image reordering — array order from upload is accepted as-is.
- Do not use `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` as a server secret — it is already client-permitted and safe to include in the sign route response.

---

### 9. Ambiguity Protocol

If any of the following are unclear, **stop and record in §12 Open Questions** before proceeding:

- The exact field names on the existing `Product` Prisma model (check `prisma/schema.prisma` from M1 before writing any service layer code).
- Whether a Cloudinary signing route already exists in the codebase (check `src/app/api/cloudinary/` before creating a new one).
- Whether a dashboard layout or nav component already exists (check `src/app/dashboard/layout.tsx` and any shared nav component before modifying).
- The exact env var name for Cloudinary API key already used in the project (check `.env.example` and existing upload code before adding new vars).
- Whether `trackSellerEvent` accepts an arbitrary string or a typed enum — inspect `src/services/analytics.service.ts` before adding the call site.

If the M1 schema does not include a field referenced in this directive (e.g., `tags`, `category`, `images` as array), do not add a migration — stop and record in §12.

---

### 10. What Is NOT in This Milestone

- New Prisma migrations or schema changes.
- Per-product shipping overrides or per-product QR codes.
- Storefront changes (`/[slug]` routes).
- Bulk product operations.
- Product search or filtering in the dashboard list.
- Pagination on the product list.
- Seller-facing analytics display.
- Image reordering.
- Seller-configurable AI tag editing beyond a simple editable chip list (no drag-and-drop, no taxonomy enforcement).
- Admin product management.
- Any changes to the landing page, FAQ, QR, postcard, orders, onboarding, or webhook routes.
- V4 features: auto-unpublish at zero stock, manual publish/unpublish toggle, per-product analytics granularity, per-event QR.

---

### 11. Assumptions Made

- **Publish on create:** Auto-publish if `stripeConnectOnboarded`; otherwise save as draft with inline notice (user-approved resolution of M6 §2/§8 contradiction).
- **Publish on edit:** Update preserves `published` state; draft → published via list **togglePublish** only.
- **Analytics:** `product.published` on any `false → true` in `createProduct` (auto-publish) and `togglePublish` (user-approved).
- **No HeroImage model:** Product images via Cloudinary direct upload; picker feeds postcard (M5).
- **AI tagging:** `generateProductTags` in `lib/ai-analysis.ts`; stub when `ANTHROPIC_API_KEY` unset.
- **Dashboard home:** Removed unavailable message only — no Products card (user-approved).

---

### 12. Open Questions

- **Legacy V2 dashboard/API routes** still reference removed schema fields — full build may fail until cleanup milestone.
- **Cloudinary signed upload** folder param must match account configuration in production.
- **Draft → published on edit save** intentionally not auto-promoted — toggle required for existing drafts.