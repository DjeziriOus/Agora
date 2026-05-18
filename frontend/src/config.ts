// src/config.ts
// In the browser, hit /api/* on the current origin so requests go through the
// Next.js rewrite to the backend. That keeps the session cookie first-party for
// the user's browser — Brave/Chrome 3PCD block it otherwise and authenticated
// calls return 401. On the server (SSR), fall back to the explicit backend URL.
export const API_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
