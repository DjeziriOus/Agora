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
      // Removed unique: true here; handled by partial index below
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
      // Removed unique: true here; handled by partial index below
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

// Partial Unique Indexes (Enforce uniqueness ONLY for active, non-deleted shops)
shopSchema.index(
  { owner: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

shopSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

shopSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    collation: { locale: "en", strength: 2 },
  },
);

// Auto-generate and verify unique slug from name before validation
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
