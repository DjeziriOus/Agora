import { createAuthClient } from "better-auth/react";
import { API_URL } from "@/config";

export const authClient = createAuthClient({
  // baseURL: "http://localhost:5001",
  baseURL: process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : API_URL,
  fetchOptions: {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  },
});
