/**
 * @file Configuration Swagger / OpenAPI 3.0 pour l'API Agora.
 *
 * Génère la spec à partir des annotations `@swagger` placées dans :
 *   - les modèles (schémas de données — User, Shop, Product, Variant, etc.)
 *   - les routes (endpoints — paths, requestBody, responses)
 *   - la config Cloudinary (schéma `CloudinaryImage`)
 *
 * Servie sur :
 *   - GET /api/docs        → UI interactive (swagger-ui-express)
 *   - GET /api/docs.json   → spec OpenAPI brute (JSON)
 *
 * Voir aussi : docs/api-swagger.md
 */

import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Agora Marketplace API",
      version: "1.0.0",
      description:
        "API REST de la marketplace multi-vendeurs Agora. " +
        "L'authentification est gérée par Better Auth sur `/api/auth/*` " +
        "(non documenté ici — voir la doc Better Auth). Toutes les autres " +
        "routes utilisent un cookie de session Better Auth.",
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Serveur local de développement",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description: "Cookie de session Better Auth posé après signin",
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: [
    "./config/cloudinary.js",
    "./models/*.js",
    "./routes/*.js",
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
