/**
 * Seed script — creates demo shops and products for local/dev testing.
 *
 * Usage:
 *   node backend/scripts/seed.js
 *
 * Requirements:
 *   - MONGO_URI set in backend/.env
 *   - At least one user with role "seller" must exist in the database
 *     (create one via the app's /register endpoint, then set role to "seller" in MongoDB)
 *
 * The script is idempotent: if shops/products with the same slugs/names
 * already exist it will skip them.
 */

import "dotenv/config";
import mongoose from "mongoose";

// ── Connect ──────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Error: MONGO_URI is not set in .env");
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");

// ── Minimal inline schemas (avoids importing full model tree) ─────────────────

const shopSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    description: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    contactAddress: { type: String, default: "" },
    status: { type: String, default: "active" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    logo: { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
    banner: { url: { type: String, default: "" }, publicId: { type: String, default: "" } },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "shops" }
);

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: { type: String, default: "" },
    category: String,
    price: Number,
    stock: Number,
    stockThreshold: { type: Number, default: 5 },
    images: [{ url: String, publicId: { type: String, default: "" } }],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
  },
  { timestamps: true, collection: "products" }
);

const userSchema = new mongoose.Schema(
  { name: String, email: String, role: String },
  { collection: "user" }
);

const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ── Find available sellers ────────────────────────────────────────────────────

const sellers = await User.find({ role: "seller" }).limit(4).lean();

if (sellers.length === 0) {
  console.error(
    "Error: No seller accounts found.\n" +
    "Create at least one account via /api/auth/register, then set its role to 'seller' in MongoDB."
  );
  await mongoose.disconnect();
  process.exit(1);
}

// Find sellers that don't already own a shop
const existingShopOwners = (await Shop.find({ isDeleted: false }, { owner: 1 }).lean())
  .map((s) => s.owner.toString());

const availableSellers = sellers.filter(
  (s) => !existingShopOwners.includes(s._id.toString())
);

if (availableSellers.length === 0) {
  console.log("All seller accounts already have a shop. Nothing to seed.");
  await mongoose.disconnect();
  process.exit(0);
}

// ── Shop and product data ─────────────────────────────────────────────────────

const SHOP_TEMPLATES = [
  {
    name: "Atelier Dumas",
    slug: "atelier-dumas",
    description: "Creations artisanales en cuir et accessoires faits main.",
    products: [
      {
        name: "Carnet artisanal en cuir",
        description: "Carnet cousu main en cuir veritable, pages en papier recycle.",
        price: 34.99, category: "Accessoires", stock: 15, stockThreshold: 3,
        images: [{ url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400", publicId: "" }],
      },
      {
        name: "Sac cabas en toile",
        description: "Sac cabas spacieux en toile robuste, coutures renforcees.",
        price: 45.00, category: "Accessoires", stock: 8, stockThreshold: 2,
        images: [{ url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400", publicId: "" }],
      },
      {
        name: "Portefeuille en cuir fin",
        description: "Portefeuille minimaliste en cuir pleine fleur, 6 emplacements cartes.",
        price: 28.50, category: "Accessoires", stock: 20, stockThreshold: 5,
        images: [{ url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400", publicId: "" }],
      },
    ],
  },
  {
    name: "La Fabrique",
    slug: "la-fabrique",
    description: "Bougies, savons et cosmetiques naturels artisanaux.",
    products: [
      {
        name: "Bougie parfumee lavande",
        description: "Bougie artisanale a la cire de soja et a l'huile essentielle de lavande.",
        price: 18.00, category: "Maison", stock: 30, stockThreshold: 5,
        images: [{ url: "https://images.unsplash.com/photo-1602178506627-fbfb55a218a4?w=400", publicId: "" }],
      },
      {
        name: "Savon surgras au miel",
        description: "Savon froid surgras enrichi en miel de lavande et beurre de karite.",
        price: 8.50, category: "Maison", stock: 50, stockThreshold: 10,
        images: [{ url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400", publicId: "" }],
      },
      {
        name: "Bougie cire d'abeille pure",
        description: "Bougie torsadee en cire d'abeille 100% naturelle, sans parfum.",
        price: 12.00, category: "Maison", stock: 25, stockThreshold: 5,
        images: [{ url: "https://images.unsplash.com/photo-1603905763553-be1b9dbfe2b4?w=400", publicId: "" }],
      },
    ],
  },
  {
    name: "Papier et Co",
    slug: "papier-et-co",
    description: "Papeterie creative et objets de bureau design.",
    products: [
      {
        name: "Set de cartes de voeux aquarelle",
        description: "Lot de 8 cartes peintes a l'aquarelle, enveloppes incluses.",
        price: 14.99, category: "Papeterie", stock: 40, stockThreshold: 8,
        images: [{ url: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400", publicId: "" }],
      },
      {
        name: "Agenda perpetuel cuir",
        description: "Agenda sans date en couverture rigide cuir vegetalien, papier ivoire 90g.",
        price: 26.00, category: "Papeterie", stock: 18, stockThreshold: 3,
        images: [{ url: "https://images.unsplash.com/photo-1517971129774-8a2b38fa128e?w=400", publicId: "" }],
      },
      {
        name: "Tampons en bois motifs fleurs",
        description: "Set de 6 tampons en bois grave, motifs floraux. Encre non incluse.",
        price: 22.50, category: "Papeterie", stock: 12, stockThreshold: 3,
        images: [{ url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400", publicId: "" }],
      },
    ],
  },
  {
    name: "Bijoux Celeste",
    slug: "bijoux-celeste",
    description: "Bijoux fins inspires de la nature et des astres.",
    products: [
      {
        name: "Collier Lune en argent",
        description: "Collier delicat avec pendentif lune en argent 925, chaine reglable.",
        price: 38.00, category: "Bijoux", stock: 22, stockThreshold: 4,
        images: [{ url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400", publicId: "" }],
      },
      {
        name: "Boucles d'oreilles etoile",
        description: "Boucles d'oreilles puces etoile en argent sterling.",
        price: 24.00, category: "Bijoux", stock: 35, stockThreshold: 5,
        images: [{ url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400", publicId: "" }],
      },
      {
        name: "Bracelet pierres naturelles",
        description: "Bracelet elastique compose d'amethyste, quartz rose et labradorite.",
        price: 19.50, category: "Bijoux", stock: 28, stockThreshold: 5,
        images: [{ url: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400", publicId: "" }],
      },
    ],
  },
];

// ── Seed ──────────────────────────────────────────────────────────────────────

let shopsCreated = 0;
let productsCreated = 0;

for (let i = 0; i < SHOP_TEMPLATES.length; i++) {
  const template = SHOP_TEMPLATES[i];
  const seller = availableSellers[i];

  if (!seller) {
    console.log(`Skipping shop "${template.name}" — no available seller account.`);
    continue;
  }

  // Skip if shop with same slug already exists
  const existing = await Shop.findOne({ slug: template.slug, isDeleted: false }).lean();
  if (existing) {
    console.log(`Shop "${template.name}" already exists, skipping.`);
    continue;
  }

  const shop = await Shop.create({
    name: template.name,
    slug: template.slug,
    description: template.description,
    status: "active",
    owner: seller._id,
    isDeleted: false,
  });

  console.log(`Created shop: ${shop.name} (owner: ${seller.email})`);
  shopsCreated++;

  for (const productData of template.products) {
    await Product.create({ ...productData, shop: shop._id, isActive: true, isDeleted: false });
    productsCreated++;
  }

  console.log(`  → ${template.products.length} products added`);
}

console.log(`\nDone. ${shopsCreated} shop(s) and ${productsCreated} product(s) created.`);
await mongoose.disconnect();
