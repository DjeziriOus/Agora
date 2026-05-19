/**
 * @file Configuration de Better Auth — point d'entrée d'authentification.
 *
 * Particularités :
 *   - Connexion MongoDB NATIVE via `MongoClient` (Better Auth) en parallèle de
 *     la connexion Mongoose utilisée par le reste de l'app. C'est voulu :
 *     Better Auth gère ses propres collections (`user`, `session`, `account`,
 *     `verification`) directement, sans passer par Mongoose.
 *   - Charge `.env` AVANT tout — importé tôt par `server.js`, on ne peut pas
 *     compter sur le chargement par défaut.
 *   - Hooks `before` + `after` pour intercepter signup/signin/delete-user
 *     (validation rôle, nettoyage cascade, refus si commandes en cours).
 *   - Champs additionnels sur `user` : `role`, `phoneNumber`, `dateOfBirth`,
 *     etc. — propagés automatiquement par Better Auth.
 *
 * Voir aussi : docs/modules/backend/auth.md
 */

// Load .env FIRST — this file is imported before connectDB() runs in server.js,
// so we must load the env vars here to have MONGO_URI available.
import "dotenv/config";

import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "./services/emailService.js";
import {
  cleanupDeletedUserData,
  getAccountDeletionBlockReason,
} from "./services/accountDeletionService.js";

// BetterAuth gets its own direct MongoClient connection.
// This avoids the timing issue where mongoose.connection.getClient() is undefined
// at module evaluation time (before connectDB() runs).
const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const db = client.db();

// Derive the email verification policy once so every auth entry point uses the same flag.
export const requireEmailVerification =
  process.env.REQUIRE_EMAIL_VERIFICATION === "true";
const isProduction = process.env.NODE_ENV === "production";

console.log("IS EMAIL VERIFICATION REQUIRED?", requireEmailVerification);
console.log("[auth] NODE_ENV:", process.env.NODE_ENV);
console.log("[auth] BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.log("[auth] FRONTEND_URL:", process.env.FRONTEND_URL);
console.log(
  "[auth] Google OAuth redirect_uri:",
  `${process.env.FRONTEND_URL}/api/auth/callback/google`,
);

// Resolve a hostname from a URL env var without crashing if it's missing/invalid.
function hostOf(url) {
  try {
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
}

// Dynamic baseURL: when a request arrives via the Vercel /api/auth/* rewrite,
// Vercel forwards `x-forwarded-host: <vercel-domain>`. Better Auth uses this to
// build the OAuth redirect URI, error redirect URLs, and cookie attributes so
// they all live on the frontend domain. That keeps the OAuth state cookie
// first-party for the user's browser (no Brave/3PCD blocking → no state_mismatch).
// `fallback` covers cases without proxy headers (direct backend access, scripts).
const allowedHosts = [
  hostOf(process.env.FRONTEND_URL),
  hostOf(process.env.BETTER_AUTH_URL),
  "localhost:3000",
  "localhost:5000",
  "localhost:5001",
].filter(Boolean);

export const auth = betterAuth({
  baseURL: isProduction
    ? {
        allowedHosts,
        fallback: process.env.BETTER_AUTH_URL,
        protocol: "https",
      }
    : process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(db, {
    // Collection names must match Mongoose schema collection options
    collectionNames: {
      user: "user",
      session: "sessions",
      account: "accounts",
      verification: "verifications",
    },
  }),

  ...(isProduction
    ? {
        advanced: {
          defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
          },
        },
      }
    : {}),

  // ── Email + Password ──────────────────────────────────
  // NOTE: requireEmailVerification is NOT set here so that unverified users
  // can still log in and browse. Checkout is blocked by our own middleware
  // (requireVerifiedEmail) and frontend guards instead.
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },

  // ── Email Verification ────────────────────────────────
  emailVerification: {
    sendOnSignUp: requireEmailVerification,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const modifiedUrl = new URL(url);
      modifiedUrl.searchParams.set(
        "callbackURL",
        `${process.env.FRONTEND_URL}/email-verified`,
      );
      await sendVerificationEmail(user.email, modifiedUrl);
    },
  },

  // ── Google OAuth ──────────────────────────────────────
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Send Google back to the FRONTEND domain so the callback hits our Next.js
      // /api/auth/* rewrite. That keeps the state cookie first-party for the user's
      // browser (Brave/Chrome 3PCD block it otherwise → state_mismatch).
      redirectURI: `${process.env.FRONTEND_URL}/api/auth/callback/google`,
      errorCallbackURL: `${process.env.FRONTEND_URL}/login?oauthError=1`,
      mapProfileToUser: async (profile) => {
        console.log(profile);
        return {
          // Map Google's response to your custom fields
          // Note: Better Auth's built-in 'image' field is automatically
          // populated from profile.picture, so we don't set it here.
          firstName: profile.given_name || "",
          lastName: profile.family_name || "",
        };
      },
    },
  },

  // ── Extended profile fields on the user document ──────
  user: {
    changeEmail: {
      enabled: true,
      // Keep email-change verification aligned with the global auth policy.
      updateEmailWithoutVerification: !requireEmailVerification,
    },
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        const blockReason = await getAccountDeletionBlockReason({
          userId: user.id,
          role: typeof user.role === "string" ? user.role : "buyer",
        });

        if (blockReason) {
          throw new APIError("BAD_REQUEST", {
            code: blockReason.code,
            message: blockReason.message,
          });
        }

        await cleanupDeletedUserData({
          userId: user.id,
          role: typeof user.role === "string" ? user.role : "buyer",
        });
      },
    },
    additionalFields: {
      firstName: { type: "string", input: true, defaultValue: "" },
      lastName: { type: "string", input: true, defaultValue: "" },
      age: { type: "number", input: true, defaultValue: null },
      gender: { type: "string", input: true, defaultValue: "" },
      role: { type: "string", input: true, defaultValue: "unassigned" },
      imagePublicId: { type: "string", input: true, defaultValue: "" },
    },
  },

  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "http://localhost:5001",
    "http://localhost:5001",
    "http://localhost:3000",
  ],

  // ── Hooks ─────────────────────────────────────────────
  hooks: {
    before: async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const role = ctx.body?.role;
        const VALID_ROLES = ["buyer", "seller"];
        if (role && !VALID_ROLES.includes(role)) {
          throw new APIError("BAD_REQUEST", {
            message: `Invalid role "${role}". Accepted values: buyer, seller.`,
          });
        }
      }
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Google OAuth users arrive with emailVerified already true —
          // preserve that. Only force false for email/password signups
          // when verification is required.
          return {
            data: {
              ...user,
              emailVerified: user.emailVerified || !requireEmailVerification,
            },
          };
        },
      },
    },
  },
});
