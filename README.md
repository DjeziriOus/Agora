# Agora Repository Overview

This repository contains the current codebase for **Agora**, a multi-vendor e-commerce project split into two main applications:

- `frontend/`: Next.js App Router application for the buyer-facing and seller-facing UI
- `backend/`: Express + Better Auth + MongoDB backend

This README is intended to document the **current maintained repository structure**. It focuses on the source code and main project files. Generated or dependency folders such as `node_modules/` and `frontend/.next/` are intentionally omitted.

It also calls out a few files that still exist in the repo but behave more like legacy/reference artifacts than core application structure.

## Repository Layout

```text
.
├── backend/
│   ├── auth.js
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── cartController.js
│   │   ├── productController.js
│   │   └── shopController.js
│   ├── data/
│   │   └── mockData.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   ├── Shop.js
│   │   ├── User.js
│   │   ├── Variant.js
│   │   ├── createStore.json
│   │   └── getStore.json
│   ├── postman/
│   │   └── Agora API — BetterAuth.postman_collection.json
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   └── shopRoutes.js
│   ├── scripts/
│   │   ├── migrate-to-variants.js
│   │   └── seed.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── cartService.js
│   │   ├── emailService.js
│   │   ├── productService.js
│   │   ├── shopService.js
│   │   └── variantService.js
│   ├── test-email.mjs
│   └── startup.log
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── choose-role/
│   │   │   ├── login/
│   │   │   ├── oauth-callback/
│   │   │   ├── register/
│   │   │   └── verify-email/
│   │   ├── (client)/
│   │   │   ├── boutique/
│   │   │   │   └── [id]/
│   │   │   ├── catalogue/
│   │   │   ├── checkout/
│   │   │   ├── compte/
│   │   │   │   ├── adresses/
│   │   │   │   ├── commandes/
│   │   │   │   │   └── [id]/
│   │   │   │   ├── parametres/
│   │   │   │   ├── AccountLayoutClient.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── confirmation/
│   │   │   │   └── [orderId]/
│   │   │   ├── layout.tsx
│   │   │   ├── panier/
│   │   │   ├── produit/
│   │   │   │   └── [id]/
│   │   │   └── recherche/
│   │   ├── vendeur/
│   │   │   ├── boutique/
│   │   │   ├── commandes/
│   │   │   │   └── [id]/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── parametres/
│   │   │   ├── produits/
│   │   │   │   ├── [id]/
│   │   │   │   └── nouveau/
│   │   │   ├── stock/
│   │   │   └── VendorLayoutClient.tsx
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── icon.jpg
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── AgoraBadge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── OrderStepBar.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── SkeletonCard.tsx
│   │   │   ├── StarRating.tsx
│   │   │   └── VendorSidebar.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── CartContext.tsx
│   │   ├── hooks/
│   │   │   ├── useApi.ts
│   │   │   └── useCart.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth-client.ts
│   │   │   ├── mockData.ts
│   │   │   ├── productCategories.ts
│   │   │   ├── queryClient.tsx
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
│   ├── components.json
│   ├── findHooks.js
│   ├── next.config.mjs
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.mjs
│   └── tsconfig.json
├── PR.md
├── README.md
└── TODO.md
```

## Backend Notes

- `backend/server.js`
  Main backend entry point. It loads environment variables, connects to MongoDB, mounts Better Auth, applies JSON parsing, and mounts the main API route groups.

- `backend/auth.js`
  Better Auth configuration. This is the active authentication integration used by the running backend.

- `backend/routes/`
  Main Express route declarations currently used by the app:
  - `shopRoutes.js`
  - `productRoutes.js`
  - `cartRoutes.js`
  - `orderRoutes.js`

- `backend/controllers/`
  Request handlers for the mounted route groups. These coordinate validation, service calls, and HTTP responses.

- `backend/services/`
  Business logic layer. This is where the main application behavior lives:
  - `productService.js` for public/seller product flows
  - `shopService.js` for shop storefront and seller shop flows
  - `cartService.js` for cart management
  - `variantService.js` for the separate variant model
  - `emailService.js` for mail-related helpers

- `backend/models/`
  Mongoose models for the domain:
  - `User.js`
  - `Shop.js`
  - `Product.js`
  - `Variant.js`
  - `Cart.js`
  - `Order.js`

- `backend/models/createStore.json` and `backend/models/getStore.json`
  These are JSON payload examples, not executable models.

- `backend/scripts/`
  Maintenance and development scripts:
  - `seed.js` for populating development data
  - `migrate-to-variants.js` for the product variant migration

- `backend/postman/`
  Backend API collection. The maintained collection for team testing is `Agora API — BetterAuth.postman_collection.json`.

## Frontend Notes

- `frontend/app/`
  Next.js App Router entrypoint and route tree.

- `frontend/app/(auth)/`
  Authentication-related flows:
  - login
  - register
  - verify email
  - choose role
  - OAuth callback

- `frontend/app/(client)/`
  Buyer-facing application pages:
  - catalogue
  - search
  - boutique storefront
  - product detail
  - cart
  - checkout
  - order confirmation
  - account area (`compte`)

- `frontend/app/vendeur/`
  Seller-facing dashboard pages:
  - dashboard home
  - boutique management
  - product management
  - stock management
  - seller orders
  - seller settings

- `frontend/app/layout.tsx`
  Root frontend layout. It currently wraps the application with shared providers such as React Query and authentication context.

- `frontend/src/components/`
  Shared reusable UI components for the product, storefront, account, and seller dashboard flows.

- `frontend/src/components/ui/`
  Lower-level reusable UI primitives and design-system style components.

- `frontend/src/context/`
  Shared React context modules. The repo currently contains:
  - `AuthContext.tsx`
  - `CartContext.tsx`

- `frontend/src/hooks/`
  Application-specific hooks:
  - `useApi.ts` for React Query wrappers around backend endpoints
  - `useCart.ts` for cart actions and cart-facing UI behavior

- `frontend/src/lib/`
  Shared frontend utilities and integration modules:
  - `api.ts` for backend API wrappers and response mapping
  - `auth-client.ts` for Better Auth client integration
  - `productCategories.ts` for fixed category definitions
  - `queryClient.tsx` for React Query setup
  - `mockData.ts` for mock/demo data still used in some flows
  - `utils.ts` for general utility helpers

- `frontend/hooks/`
  Root-level helper hooks used by some generated UI components. These are distinct from the app-specific hooks inside `frontend/src/hooks/`.

## Authentication Routing Status

The repository currently contains both:

- Better Auth runtime integration through:
  - `backend/auth.js`
  - `backend/server.js` with `app.all("/api/auth/*splat", toNodeHandler(auth))`

- Legacy custom auth route files:
  - `backend/routes/authRoutes.js`
  - `backend/controllers/authController.js`
  - `backend/services/authService.js`

The running backend currently uses the **Better Auth catch-all route**. The legacy custom auth files still exist in the repository, but they are not the active auth path mounted by `server.js`.

## Variants and Product Shape

Products are no longer just a flat `price + stock` model.

- `backend/models/Variant.js` stores per-product variants
- `backend/services/variantService.js` contains variant helpers and aggregate calculations
- `backend/services/productService.js` and `backend/services/shopService.js` enrich product responses with storefront-friendly fields such as:
  - `variants`
  - `totalStock`
  - `displayPrice`
  - `hasMultiplePrices`

This is important when reading both the public storefront pages and the seller product management flows.

## Useful Commands

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Legacy and Reference Files Still Present

A few files in the repository are useful as references or leftovers from earlier iterations, but they are not the main maintained structure:

- some duplicate UI files such as `frontend/src/components/ui/* copy.tsx`
- `frontend/lib/utils copy.ts`
- `frontend/styles/globals.css`
- temporary or environment-specific files such as `backend/startup.log`

These files are still part of the repo today, but the primary architecture is centered around the directories documented above.

## Current Architectural Split

- **Frontend**: Next.js App Router, React, Tailwind-based UI, React Query, shared state/context modules
- **Backend**: Express, Better Auth, MongoDB/Mongoose, Cloudinary upload support, email helpers
- **Communication**: frontend API access is centralized in `frontend/src/lib/api.ts`
- **Authentication**: Better Auth client/server integration is split between `frontend/src/lib/auth-client.ts` and `backend/auth.js`
- **Data Model**: products, shops, carts, orders, and product variants are separated across dedicated models and service layers

This README reflects the current code organization as it exists in the repository now.
