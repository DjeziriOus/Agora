import mongoose from "mongoose";
import "../models/Shop.js";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
            minlength: [3, "Product name must be at least 3 characters long"],
            maxlength: [100, "Product name must be at most 100 characters long"],
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: [1000, "Product description must be at most 1000 characters long"],
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Product price must be a positive number"],
        },
        stock: {
            type: Number,
            required: [true, "Product stock is required"],
            default: 0,
            min: [0, "Product stock cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Product stock must be an integer",
            },
        },
        stockThreshold: {
            type: Number,
            default: 5,
            min: [0, "Stock threshold cannot be negative"],
            validate: {
                validator: Number.isInteger,
                message: "Stock threshold must be an integer",
            },
        },
        images: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        shop: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: [true, "Shop is required"],
        },
    },
    {
        timestamps: true,
        collection: "products",
    },
);

productSchema.index({ shop: 1, isDeleted: 1, stock: 1 });

export default mongoose.model("Product", productSchema);



