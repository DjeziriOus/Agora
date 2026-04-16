/**
 * Migrate all collections from the "test" database to "multivendor" on Atlas.
 *
 * Usage:
 *   node backend/scripts/move-test-to-multivendor.js
 *
 * What it does:
 *   1. Connects to Atlas using the URI below.
 *   2. Lists every collection in "test".
 *   3. For each collection, reads all documents and inserts them into the
 *      same-named collection in "multivendor" (skips duplicates by _id).
 *   4. Prints a summary. Does NOT drop the "test" db — you can do that
 *      manually from Atlas once you've verified everything looks good.
 */

import { MongoClient } from "mongodb";

const ATLAS_URI =
  "mongodb+srv://djezirixeedoussama_db_user:ZBDB5QkLUOS3zE3i@cluster0.lcuexom.mongodb.net/?appName=Cluster0";

const SOURCE_DB = "test";
const TARGET_DB = "multivendor";

async function migrate() {
  const client = new MongoClient(ATLAS_URI);

  try {
    await client.connect();
    console.log("✅ Connected to Atlas\n");

    const sourceDb = client.db(SOURCE_DB);
    const targetDb = client.db(TARGET_DB);

    // List all collections in "test"
    const collections = await sourceDb.listCollections().toArray();

    if (collections.length === 0) {
      console.log(`No collections found in "${SOURCE_DB}" — nothing to migrate.`);
      return;
    }

    console.log(
      `Found ${collections.length} collection(s) in "${SOURCE_DB}": ${collections.map((c) => c.name).join(", ")}\n`
    );

    for (const colInfo of collections) {
      const name = colInfo.name;
      const sourceColl = sourceDb.collection(name);
      const targetColl = targetDb.collection(name);

      const docs = await sourceColl.find().toArray();
      console.log(`📦 ${name}: ${docs.length} document(s) found in "${SOURCE_DB}"`);

      if (docs.length === 0) {
        console.log(`   ⏭️  Skipping (empty collection)\n`);
        continue;
      }

      // Check what already exists in the target to avoid duplicate _id errors
      const existingIds = new Set(
        (await targetColl.find({}, { projection: { _id: 1 } }).toArray()).map(
          (d) => d._id.toString()
        )
      );

      const newDocs = docs.filter((d) => !existingIds.has(d._id.toString()));

      if (newDocs.length === 0) {
        console.log(`   ⏭️  All documents already exist in "${TARGET_DB}.${name}" — skipping\n`);
        continue;
      }

      const result = await targetColl.insertMany(newDocs, { ordered: false });
      console.log(
        `   ✅ Inserted ${result.insertedCount}/${docs.length} document(s) into "${TARGET_DB}.${name}"\n`
      );
    }

    console.log("─".repeat(50));
    console.log("🎉 Migration complete!");
    console.log(
      `\nNext steps:\n` +
        `  1. Verify your data in Atlas → "${TARGET_DB}" database.\n` +
        `  2. Update your deployed MONGO_URI to include /multivendor.\n` +
        `  3. Once everything looks good, drop the "${SOURCE_DB}" database from Atlas.\n`
    );
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await client.close();
  }
}

migrate();
