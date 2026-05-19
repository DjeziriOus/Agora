/**
 * @file Point d'entrée du serveur Express.
 *
 * Particularités :
 *   - `app.set("trust proxy", 1)` pour les déploiements derrière Railway/Vercel
 *     (cookies secure + req.ip correct).
 *   - Better Auth est monté AVANT `express.json()` car il parse lui-même son
 *     body. Le catch-all `/api/auth/*splat` utilise la syntaxe Express v5.
 *   - Swagger UI exposé sur `/api/docs` (UI) et `/api/docs.json` (spec brute).
 *
 * Voir aussi : docs/modules/backend/server.md
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { toNodeHandler } from "better-auth/node";

// Load .env first — before importing auth (which needs env vars)
dotenv.config();

import connectDB from "./config/db.js";
import swaggerSpec from "./config/swagger.js";
import { auth, requireEmailVerification } from "./auth.js";

// Routes
import shopRoutes from "./routes/shopRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import clientAddressRoutes from "./routes/clientAddressRoutes.js";
import accountRoutes from "./routes/authRoutes.js";
// import accountRoutes from "./routes/accountDeletionRoutes.js";

const app = express();
app.set("trust proxy", 1);
// ── CORS ──────────────────────────────────────────────────────────────────────
// credentials: true is required for BetterAuth session cookies
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// ── Request Logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const start = Date.now();
  const { method, path } = req;
  _res.on("finish", () => {
    const ms = Date.now() - start;
    const status = _res.statusCode;
    const color =
      status >= 500 ? "\x1b[31m" : status >= 400 ? "\x1b[33m" : "\x1b[32m";
    console.log(
      `${color}[${new Date().toLocaleTimeString()}] ${method} ${path} → ${status} (${ms}ms)\x1b[0m`,
    );
  });
  next();
});

// ── BetterAuth Handler ────────────────────────────────────────────────────────
// Expose the backend auth policy to the frontend before the Better Auth catch-all.
app.get("/api/auth/config", (_req, res) => {
  res.json({ requireEmailVerification });
});

// MUST be mounted BEFORE express.json() — BetterAuth parses its own body
// Express v5 syntax: /*splat
app.all("/api/auth/*splat", toNodeHandler(auth));

// ── JSON Body Parser ──────────────────────────────────────────────────────────
// Applied only AFTER the BetterAuth catch-all
app.use(express.json());

// ── Application Routes ────────────────────────────────────────────────────────
app.use("/api/shops", shopRoutes);
// Product routes for seller inventory management.
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", clientAddressRoutes);
app.use("/api/account", accountRoutes);

// ── Swagger / OpenAPI documentation ───────────────────────────────────────────
// UI interactive : http://localhost:5001/api/docs
// Spec brute    : http://localhost:5001/api/docs.json
app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Agora API Docs",
    swaggerOptions: { persistAuthorization: true },
  }),
);

// Health-check
app.get("/", (_req, res) => {
  res.json({ message: "Agora Multi-Vendor API is running 🚀" });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI:     http://localhost:${PORT}/api/docs`);
    console.log(`BetterAuth health: http://localhost:${PORT}/api/auth/ok`);
  });
});
