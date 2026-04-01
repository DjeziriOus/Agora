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
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── postman/
│   ├── test-email.mjs
│   ├── startup.log
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-email/
│   │   ├── (client)/
│   │   │   ├── catalogue/
│   │   │   └── checkout/
│   │   ├── vendeur/
│   │   │   ├── boutique/
│   │   │   ├── commandes/
│   │   │   │   └── [id]/
│   │   │   ├── parametres/
│   │   │   └── produits/
│   │   │       ├── [id]/
│   │   │       └── nouveau/
│   │   ├── components/
│   │   │   └── [slug]/
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   └── page.tsx
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── styles/
│   ├── next.config.mjs
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   ├── package.json
│   ├── package-lock.json
│   └── pnpm-lock.yaml
├── agora-betterauth.postman_collection.json
├── Projet L3Q2.code-workspace
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

- `backend/middleware/`
  Shared middleware for session validation, role checks, and verified-email checks.

- `backend/models/`
  Mongoose models used by the backend.

- `backend/routes/`
  Express route declarations.

- `backend/services/`
  Reusable backend services such as email sending helpers.

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
  Frontend utility modules such as API helpers, auth client setup, mock data, and React Query setup.

- `frontend/src/types/`
  Shared TypeScript types for the domain model and API payloads.

- `agora-betterauth.postman_collection.json`
  Postman collection used to test backend authentication flows.

- `Projet L3Q2.code-workspace`
  Local VS Code workspace file.

## Notes About Generated or Local Files

Some folders and files exist for local development and should not be treated as core source structure:

- `frontend/.next/`
  Next.js build output.

- `frontend/node_modules/`
  Frontend dependencies.

- `backend/node_modules/`
  Backend dependencies.

- `frontend/tsconfig.tsbuildinfo`
  TypeScript incremental build cache.

- `backend/startup.log`
  Local log/debug artifact.

## Current Architectural Split

- **Frontend**: Next.js, React, Tailwind-based UI, shared state through React Context and React Query
- **Backend**: Express, Better Auth, MongoDB/Mongoose, email service helpers
- **Communication**: The frontend talks to the backend through API wrappers and Better Auth client calls

This README reflects the repository structure as it exists now in the current codebase.
