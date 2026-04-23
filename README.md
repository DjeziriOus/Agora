# AGORA

AGORA is a multi-vendor e-commerce platform with separate buyer and seller experiences.
The repository contains a Next.js frontend and an Express + Better Auth + MongoDB backend.

## Project Overview

The platform is organized around three main functional blocks:

- `F1` Authentication and access control
- `F2` Catalogue, boutiques, products, stock, and cart
- `F3` Client and seller order flows

The current product design intentionally separates buyer and seller behaviors:

- buyer accounts can browse, manage addresses, use the cart, and place orders
- seller accounts can manage a shop, products, stock, and seller-side orders
- seller accounts are not allowed to purchase products

## Core Features

### F1. Authentication and access control

- Buyer account registration
- Seller account registration
- Email and password login
- Email verification flow
- Google authentication
- Initial role selection for first-time users
- Session-based frontend/backend auth integration
- Role-based access control for buyer and seller areas

### F2. Catalogue, boutiques, products, and cart

- Seller shop creation and update
- Product creation, update, and soft deactivation
- Stock and variant management
- Image upload for shops and products
- Public catalogue and product detail pages
- Product search and filter flows
- Shop storefront pages
- Persistent buyer cart
- Responsive storefront and dashboard layouts

### F3. Client and seller orders

- Checkout flow from cart to confirmation
- Client order creation and persistence
- Client order history and order detail pages
- Seller order list and order detail pages
- Seller-side order status update
- Order splitting by boutique / sub-order
- Frontend/backend integration for the order flow

## Tech Stack

- Frontend: `Next.js`, `React`, `TypeScript`, `React Query`, `Tailwind CSS`
- Backend: `Node.js`, `Express`, `Better Auth`, `Mongoose`
- Database: `MongoDB`
- Optional integrations: `Cloudinary`, `Google OAuth`, email sending

## Quick Start

### Prerequisites

Make sure the following tools and services are available locally:

- `Node.js`
- `npm`
- `MongoDB`
- optional: `Cloudinary` credentials for image upload
- optional: `Google OAuth` credentials for Google sign-in
- optional: SMTP / mailbox credentials for verification and reset emails

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure the backend

Copy the example file and fill in your local values:

```bash
cd backend
cp .env.example .env
```

Minimum local values:

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/agora
BETTER_AUTH_SECRET=your_generated_secret
BETTER_AUTH_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3000
REQUIRE_EMAIL_VERIFICATION=false
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Configure the frontend

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

If the variable is missing, the frontend falls back to `http://localhost:5001`
through `frontend/src/config.ts`.

### 5. Start the backend

```bash
cd backend
npm run dev
```

Backend default URL:

```text
http://localhost:5001
```

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Frontend default URL:

```text
http://localhost:3000
```

### 7. Optional seed data

If you want development/demo data:

```bash
cd backend
node scripts/seed.js
```

## Environment Variables

### Backend

The example file is:

- `backend/.env.example`

Key variables used by the running backend:

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `FRONTEND_URL`
- `REQUIRE_EMAIL_VERIFICATION`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `EMAIL_APP_PASSWORD`
- `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Frontend

The frontend currently relies on:

- `NEXT_PUBLIC_API_URL`

Recommended local file:

- `frontend/.env.local`

## Role-Based Access Rules

The repository currently enforces the buyer/seller split in both the frontend and the backend.

### Buyer-only backend routes

- `backend/routes/cartRoutes.js`
- `backend/routes/clientAddressRoutes.js`
- buyer endpoints inside `backend/routes/orderRoutes.js`

### Seller-only backend routes

- `backend/routes/shopRoutes.js`
- `backend/routes/productRoutes.js`
- seller endpoints inside `backend/routes/orderRoutes.js`

### Frontend behavior

- seller accounts are redirected away from buyer purchase flows such as cart and checkout
- seller accounts are redirected away from the buyer account area
- buyer accounts do not access seller dashboard management flows

## API and Postman

The maintained Postman collection is:

- `backend/postman/Agora API — BetterAuth.postman_collection.json`

Notes:

- it reflects the current Express route structure
- it injects `Origin: http://localhost:3000` automatically at collection level
- it is the only maintained Postman collection in the repository

## Useful Commands

### Backend

```bash
cd backend
npm run dev
npm test
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
```

## Repository Layout

```text
.
├── backend/
│   ├── auth.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── data/
│   ├── middleware/
│   ├── models/
│   ├── postman/
│   │   └── Agora API — BetterAuth.postman_collection.json
│   ├── routes/
│   ├── scripts/
│   └── services/
├── frontend/
│   ├── app/
│   ├── hooks/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── lib/
│       └── types/
└── README.md
```

## Backend Notes

- `backend/server.js`
  Main backend entry point. It loads environment variables, connects to MongoDB,
  mounts Better Auth, applies middleware, and mounts the API routes.

- `backend/auth.js`
  Better Auth configuration used by the running backend.

- `backend/routes/`
  Main mounted route groups:
  - `accountDeletionRoutes.js`
  - `cartRoutes.js`
  - `clientAddressRoutes.js`
  - `orderRoutes.js`
  - `productRoutes.js`
  - `shopRoutes.js`

- `backend/services/`
  Main business logic modules:
  - `accountDeletionService.js`
  - `cartService.js`
  - `clientAddressService.js`
  - `emailService.js`
  - `orderService.js`
  - `productService.js`
  - `shopService.js`
  - `variantService.js`

## Frontend Notes

- `frontend/app/(auth)/`
  Login, register, choose-role, verify-email, and OAuth callback flows.

- `frontend/app/(client)/`
  Buyer storefront, product detail, cart, checkout, confirmation, and account pages.

- `frontend/app/vendeur/`
  Seller dashboard, shop management, products, stock, seller orders, and settings.

- `frontend/src/lib/api.ts`
  Centralized frontend API wrappers and response mapping.

- `frontend/src/context/`
  Shared application state modules including auth and cart behavior.

- `frontend/src/lib/mockData.ts`
  Legacy/reference helper. The main storefront and product detail pages now use backend product data.

## Authentication Routing Status

The running backend uses Better Auth through:

- `backend/auth.js`
- `backend/server.js` with `app.all("/api/auth/*splat", toNodeHandler(auth))`

The repository still contains legacy custom auth files:

- `backend/routes/authRoutes.js`
- `backend/controllers/authController.js`
- `backend/services/authService.js`

These files remain in the repository, but they are not the active auth path mounted by `server.js`.

## Variants and Product Shape

Products are no longer a flat `price + stock` model.

- `backend/models/Variant.js` stores per-product variants
- `backend/services/variantService.js` handles variant aggregation helpers
- storefront-facing product responses expose fields such as:
  - `variants`
  - `totalStock`
  - `displayPrice`
  - `hasMultiplePrices`

This is important when reading both the public storefront code and the seller product-management code.

## Known Limitations

- Google sign-in depends on valid OAuth configuration.
- Email verification and password reset depend on valid email credentials.
- Image upload depends on valid Cloudinary configuration.
- Some legacy/reference files remain in the repository from earlier iterations.
