/**
 * @file Modèle Mongoose des boutiques.
 *
 * Un vendeur peut avoir une seule boutique active à la fois — l'unicité est
 * garantie par un index PARTIEL (uniquement sur les boutiques avec
 * `isDeleted: false`) ce qui permet de re-créer une boutique après suppression.
 *
 * Voir aussi : docs/modules/backend/models-Shop.md
 *
 * @swagger
 * components:
 *   schemas:
 *     Shop:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         name: { type: string, minLength: 2, maxLength: 50 }
 *         slug: { type: string, description: "Généré automatiquement depuis name" }
 *         description: { type: string, maxLength: 1000 }
 *         contactEmail: { type: string, format: email }
 *         contactPhone: { type: string }
 *         contactAddress: { type: string, maxLength: 200 }
 *         status: { type: string, enum: [active, inactive, pending] }
 *         owner: { type: string, description: "ObjectId User" }
 *         logo: { $ref: '#/components/schemas/CloudinaryImage' }
 *         banner: { $ref: '#/components/schemas/CloudinaryImage' }
 *         isDeleted: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CloudinaryImage:
 *       type: object
 *       properties:
 *         url: { type: string }
 *         publicId: { type: string }
 */

import mongoose from "mongoose";
import "../models/User.js";

const shopSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      minlength: [2, "Shop name must be at least 2 characters"],
      maxlength: [50, "Shop name must be at most 50 characters"],
    },
    slug: {
      type: String,
      required: [true, "Shop slug is required"],
      lowercase: true,
      trim: true,
      // L'unicité du slug est gérée par un index partiel plus bas — voir l'index.
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Description must be at most 1000 characters"],
    },
    contactEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Invalid email format",
      },
    },
    contactPhone: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: (v) => v === "" || /^[\d\s\+\-\(\)]{7,20}$/.test(v),
        message: "Invalid phone number format",
      },
    },
    contactAddress: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Address must be at most 200 characters"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Unicité gérée par index partiel plus bas — voir l'index.
    },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    banner: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "shops",
  },
);

// Indexes
shopSchema.index({ status: 1 });

// Indexes uniques PARTIELS : appliquent l'unicité UNIQUEMENT aux boutiques
// non-supprimées. Permet à un vendeur de soft-deleter sa boutique puis d'en
// recréer une nouvelle, sans collision avec l'ancien document.
shopSchema.index(
  { owner: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

shopSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

// Comparaison de noms case-insensitive grâce à la collation strength=2.
shopSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    collation: { locale: "en", strength: 2 },
  },
);

/**
 * Hook pré-validation : (re)génère un slug unique à partir du `name`
 * chaque fois que le nom change.
 *
 * Algorithme :
 *   1. Slugifie le nom (minuscules, espaces → tirets, retire les caractères spéciaux).
 *   2. Cherche s'il existe déjà un autre shop actif avec ce slug.
 *   3. Si oui, ajoute un suffixe `-1`, `-2`, ... jusqu'à trouver un slug libre.
 */
shopSchema.pre("validate", async function () {
  if (this.isModified("name")) {
    const baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    let currentSlug = baseSlug;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      const existingShop = await mongoose.models.Shop.findOne({
        slug: currentSlug,
        isDeleted: false,
        _id: { $ne: this._id },
      });

      if (existingShop) {
        currentSlug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        isUnique = true;
      }
    }

    this.slug = currentSlug;
  }
});

export default mongoose.models.Shop || mongoose.model("Shop", shopSchema);
