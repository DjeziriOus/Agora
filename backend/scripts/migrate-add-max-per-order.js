/**
 * Migration: backfill `maxPerOrder` on existing variants.
 *
 * Sets each variant's `maxPerOrder` to max(1, ceil(stock * 0.10)).
 * Skips variants that already have a `maxPerOrder` value persisted.
 *
 * Usage:
 *   node scripts/migrate-add-max-per-order.js
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

  const variantsCol = mongoose.connection.db.collection("variants");

  // Only touch variants without a maxPerOrder value yet.
  const cursor = variantsCol.find({
    $or: [{ maxPerOrder: { $exists: false } }, { maxPerOrder: null }],
  });

  let updated = 0;
  let skipped = 0;

  while (await cursor.hasNext()) {
    const variant = await cursor.next();
    const stock = Number(variant.stock ?? 0);
    const computed = Math.max(1, Math.ceil(stock * 0.1));

    await variantsCol.updateOne(
      { _id: variant._id },
      { $set: { maxPerOrder: computed, updatedAt: new Date() } },
    );

    updated++;
    if (updated % 100 === 0) {
      console.log(`  ...processed ${updated} variants`);
    }
  }

  // Sanity report on variants that already had a value.
  skipped = await variantsCol.countDocuments({
    maxPerOrder: { $exists: true, $ne: null },
  });

  console.log(`\nDone. Updated ${updated} variants. ${skipped} variants already had maxPerOrder.`);

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
