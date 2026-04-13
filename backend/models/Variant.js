import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: [true, "Product reference is required"],
			index: true,
		},
		code: {
			type: String,
			required: [true, "Variant code is required"],
			trim: true,
		},
		name: {
			type: String,
			required: [true, "Variant name is required"],
			trim: true,
		},
		sku: {
			type: String,
			default: "",
			trim: true,
		},
		price: {
			type: Number,
			required: [true, "Variant price is required"],
			min: [0, "Variant price must be a positive number"],
		},
		stock: {
			type: Number,
			required: true,
			default: 0,
			min: [0, "Variant stock cannot be negative"],
			validate: {
				validator: Number.isInteger,
				message: "Variant stock must be an integer",
			},
		},
		attributes: {
			type: Map,
			of: String,
			default: {},
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		collection: "variants",
	},
);

// Ensure unique code per product
variantSchema.index({ product: 1, code: 1 }, { unique: true });

// Map the MongoDB _id to id for frontend access
variantSchema.set("toJSON", {
	virtuals: true,
	transform: (_, ret) => {
		ret.id = ret._id.toString();
		return ret;
	},
});

export default mongoose.model("Variant", variantSchema);
