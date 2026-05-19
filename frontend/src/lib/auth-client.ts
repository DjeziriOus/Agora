/**
 * @file Client Better Auth pour React (signin, signup, signout, useSession).
 *
 * SUBTILITÉ COOKIE FIRST-PARTY (lire avant de toucher) :
 *   Dans le navigateur, on cible toujours `window.location.origin` (et non
 *   l'URL directe du backend). La requête passe alors par les rewrites de
 *   `next.config.mjs` (Next.js proxy → backend). Conséquence : le cookie
 *   de session est posé sur la MÊME ORIGINE que le frontend → first-party.
 *   Si on appelait le backend en direct, Brave/Chrome 3PCD bloqueraient
 *   le cookie OAuth state et on aurait `state_mismatch` au callback.
 *
 *   Côté serveur (SSR Next.js), pas de window → on utilise `API_URL` direct.
 *
 * Voir aussi : docs/modules/frontend/lib-auth-client.md
 */

import { createAuthClient } from "better-auth/react";
import { API_URL } from "@/config";

// In the browser, always call /api/auth/* on the current origin so the request
// goes through next.config.mjs rewrites. That makes auth cookies first-party
// for the user's browser — Brave/Chrome 3PCD block them otherwise and the
// OAuth state cookie disappears between sign-in and callback (state_mismatch).
const baseURL = typeof window !== "undefined" ? window.location.origin : API_URL;

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  },
});
