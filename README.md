# Agora Repository Overview

This repository contains the current codebase for **Agora**, a multi-vendor e-commerce project split into two main applications:

- `frontend/`: Next.js application for the user-facing and seller-facing interfaces
- `backend/`: Express + Better Auth + MongoDB backend

The goal of this README is to document the **current repository structure** and explain the purpose of the main directories.

## Repository Tree

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
│   │   ├── productController.js
│   │   └── shopController.js
│   ├── data/
│   │   └── mockData.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── Order.js
│   │   ├── Product.js
│   │   ├── Shop.js
│   │   ├── User.js
│   │   ├── createStore.json
│   │   └── getStore.json
│   ├── postman/
│   │   ├── agora-betterauth.postman_collection.json
│   │   ├── collection copy.json
│   │   └── collection.json
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── productRoutes.js
│   │   └── shopRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── emailService.js
│   │   ├── productService.js
│   │   └── shopService.js
│   ├── test-email.mjs
│   ├── gantt tasks.txt
│   └── startup.log
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-email/
│   │   ├── (client)/
│   │   │   ├── boutique/
│   │   │   │   └── [id]/
│   │   │   ├── catalogue/
│   │   │   ├── checkout/
│   │   │   ├── layout.tsx
│   │   │   ├── compte/
│   │   │   │   ├── adresses/
│   │   │   │   ├── commandes/
│   │   │   │   │   └── [id]/
│   │   │   │   └── parametres/
│   │   │   ├── confirmation/
│   │   │   │   └── [orderId]/
│   │   │   ├── panier/
│   │   │   ├── produit/
│   │   │   │   └── [id]/
│   │   │   └── recherche/
│   │   ├── vendeur/
│   │   │   ├── boutique/
│   │   │   ├── commandes/
│   │   │   │   └── [id]/
│   │   │   ├── layout.tsx
│   │   │   ├── parametres/
│   │   │   ├── page.tsx
│   │   │   └── produits/
│   │   │       ├── [id]/
│   │   │       └── nouveau/
│   │   ├── VendorLayoutClient.tsx
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── icon.jpg
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── hooks/
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── lib/
│   │   └── utils copy.ts
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
│   │   │   └── useApi.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth-client.ts
│   │   │   ├── mockData.ts
│   │   │   ├── productCategories.ts
│   │   │   ├── queryClient.tsx
│   │   │   └── utils.ts
│   │   └── types/
│   │       └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── components.json
│   ├── findHooks.js
│   ├── next.config.mjs
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   ├── package.json
│   ├── package-lock.json
│   └── pnpm-lock.yaml
├── .gitignore
└── README.md
```

## Directory Notes

- `backend/`
  Backend application. It contains the Express server, Better Auth setup, middleware, models, routes, and shared services.

- `backend/server.js`
  Main backend entry point. Loads environment variables, configures CORS, mounts Better Auth, and starts the server.

- `backend/auth.js`
  Authentication configuration file. It connects Better Auth to MongoDB and defines authentication-related behavior such as email verification.

- `backend/config/`
  Backend configuration files such as the database connection.

- `backend/controllers/`
  Route handlers for backend requests.

- `backend/data/`
  Backend mock or seed data used during development.

- `backend/middleware/`
  Shared middleware for session validation, role checks, and verified-email checks.

- `backend/models/`
  Mongoose models used by the backend.

- `backend/routes/`
  Express route declarations.

- `backend/services/`
  Reusable backend services such as email sending helpers.

- `backend/postman/`
  Postman collections for backend route testing, including the Better Auth collection used by the team.

- `frontend/`
  Frontend application built with Next.js App Router.

- `frontend/app/`
  Route segments, layouts, and top-level pages.

- `frontend/app/(auth)/`
  Authentication-related pages such as login, register, and verify-email.

- `frontend/app/(client)/`
  Buyer/client-facing pages.

- `frontend/app/vendeur/`
  Seller-facing dashboard area.

- `frontend/hooks/`
  Root-level frontend hooks kept outside `src/`.

- `frontend/lib/`
  Root-level frontend utility files kept outside `src/`.

- `frontend/app/layout.tsx`
  Root application layout. It wraps the app with shared providers such as auth, cart, and React Query.

- `frontend/app/global-error.tsx`
  Global error boundary page.

- `frontend/app/not-found.tsx`
  Custom 404 page.

- `frontend/src/`
  Shared frontend code that is reused across routes.

- `frontend/src/components/`
  Reusable application-level UI components.

- `frontend/src/components/ui/`
  Shared low-level UI primitives used across the app.

- `frontend/src/context/`
  React context providers such as authentication and cart state.

- `frontend/src/hooks/`
  Shared React hooks.

- `frontend/src/lib/`
  Frontend utility modules such as API helpers, auth client setup, mock data, React Query setup, and fixed product categories.

- `frontend/src/types/`
  Shared TypeScript types for the domain model and API payloads.

## Current Architectural Split

- **Frontend**: Next.js, React, Tailwind-based UI, shared state through React Context and React Query
- **Backend**: Express, Better Auth, MongoDB/Mongoose, email service helpers
- **Communication**: The frontend talks to the backend through API wrappers and Better Auth client calls

This README reflects the repository structure as it exists now in the current codebase.
