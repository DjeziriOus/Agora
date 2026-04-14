/**
 * Migration script: Move from embedded variants to separate Variant collection.
 *
 * Usage: node scripts/migrate-to-variants.js
 *
 * This script:
 * 1. For each Product with embedded variants[] → creates Variant documents
 * 2. For each Product with no variants → creates a "default" Variant from product.price/stock
 * 3. Updates Cart items: resolves variantId strings to Variant ObjectIds
 * 4. Unsets the old price/stock/variants fields from Product documents
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
	console.error("No MONGODB_URI or MONGO_URI found in .env");
	process.exit(1);
}

async function migrate() {
	console.log("Connecting to MongoDB...");
	await mongoose.connect(MONGO_URI);
	console.log("Connected.\n");

	const db = mongoose.connection.db;
	const productsCol = db.collection("products");
	const variantsCol = db.collection("variants");
	const cartsCol = db.collection("carts");

	// Check if migration already ran
	const existingVariants = await variantsCol.countDocuments();
	if (existingVariants > 0) {
		console.log(`⚠️  Found ${existingVariants} existing variants. Migration may have already run.`);
		console.log("   Proceeding anyway (will skip products that already have variants in the new collection).\n");
	}

	const products = await productsCol.find({}).toArray();
	console.log(`Found ${products.length} products to migrate.\n`);

	let created = 0;
	let defaultCreated = 0;

	for (const product of products) {
		const productId = product._id;

		// Check if this product already has variants in the new collection
		const existing = await variantsCol.countDocuments({ product: productId });
		if (existing > 0) {
			console.log(`  Skipping ${product.name} (already has ${existing} variants)`);
			continue;
		}

		const embeddedVariants = product.variants || [];

		if (embeddedVariants.length > 0) {
			// Migrate embedded variants to separate collection
			const docs = embeddedVariants.map((v) => ({
				product: productId,
				code: v.code || "default",
				name: v.name || "Standard",
				sku: v.sku || "",
				price: v.price ?? product.price ?? 0,
				stock: v.stock ?? 0,
				attributes: {},
				isActive: v.isActive !== false,
				createdAt: new Date(),
				updatedAt: new Date(),
			}));

			await variantsCol.insertMany(docs);
			created += docs.length;
			console.log(`  ✅ ${product.name}: migrated ${docs.length} embedded variants`);
		} else {
			// Create a default variant from product-level price/stock
			await variantsCol.insertOne({
				product: productId,
				code: "default",
				name: "Standard",
				sku: "",
				price: product.price ?? 0,
				stock: product.stock ?? 0,
				attributes: {},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			defaultCreated++;
			console.log(`  ✅ ${product.name}: created default variant (price: ${product.price}, stock: ${product.stock})`);
		}

		// Unset old fields from the product document
		await productsCol.updateOne(
			{ _id: productId },
			{ $unset: { price: "", stock: "", variants: "" } },
		);
	}

	console.log(`\n📦 Variant migration complete: ${created} migrated, ${defaultCreated} defaults created.\n`);

	// ── Migrate Cart items ──────────────────────────────────────────────────
	console.log("Migrating cart items...");
	const carts = await cartsCol.find({}).toArray();
	let cartUpdates = 0;

	for (const cart of carts) {
		let needsUpdate = false;

		for (const item of cart.items || []) {
			// If variantId is a string (old format), resolve it
			if (typeof item.variantId === "string" || item.variantId === null) {
				const query = { product: item.productId };

				if (item.variantId && item.variantId !== "null") {
					query.code = item.variantId;
				}

				const variant = await variantsCol.findOne(query);
				if (variant) {
					item.variantId = variant._id;
					needsUpdate = true;
				} else {
					// Fallback: find any variant for this product
					const fallback = await variantsCol.findOne({ product: item.productId });
					if (fallback) {
						item.variantId = fallback._id;
						needsUpdate = true;
					} else {
						console.log(`  ⚠️  No variant found for cart item (product: ${item.productId})`);
					}
				}
			}
		}

		if (needsUpdate) {
			await cartsCol.updateOne({ _id: cart._id }, { $set: { items: cart.items } });
			cartUpdates++;
		}
	}

	console.log(`🛒 Cart migration complete: ${cartUpdates} carts updated.\n`);

	await mongoose.disconnect();
	console.log("Done! Disconnected from MongoDB.");
}

migrate().catch((err) => {
	console.error("Migration failed:", err);
	process.exit(1);
});
