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
