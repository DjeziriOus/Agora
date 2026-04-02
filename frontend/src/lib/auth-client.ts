import { createAuthClient } from "better-auth/react";
import { API_URL } from "@/config";

export const authClient = createAuthClient({
  // baseURL: "http://localhost:5000",
    baseURL: API_URL,
    fetchOptions: {
    headers: {
      "ngrok-skip-browser-warning": "true" 
    }
  }});
