import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    // Shop name
    // Required, trimmed, length-limited, and must not contain spaces
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      minlength: [2, "Shop name must be at least 2 characters"],
      maxlength: [50, "Shop name must be at most 50 characters"],
      validate: {
        validator: function (value) {
          return !/\s/.test(value);
        },
        message: "Shop name must not contain spaces",
      },
    },

    // Shop description
    // Optional, trimmed, maximum 100 characters
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Description must be at most 100 characters"],
    },

    // Contact email for the shop
    contactEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // Contact phone number for the shop
    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },

    // Contact address for the shop
    contactAddress: {
      type: String,
      default: "",
      trim: true,
    },

    // Shop status
    // Only these values are allowed
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "pending",
    },

    // Owner of the shop
    // References a User document
    // unique: true means one user can own only one shop
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  {
    // Automatically add createdAt and updatedAt
    timestamps: true,

    // Explicit MongoDB collection name
    collection: "shops",
  }
);

export default mongoose.model("Shop", shopSchema);