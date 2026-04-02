"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  Check,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { AgoraBadge } from "@/components/AgoraBadge";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { mockProducts, mockStores, mockReviews } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();

  const product = mockProducts.find((p) => p.id === id);
  const store = product ? mockStores.find((s) => s.id === product.storeId) : null;
  const reviews = mockReviews.filter((r) => r.productId === id);
  const relatedProducts = mockProducts
    .filter((p) => p.category === product?.category && p.id !== id)
    .slice(0, 4);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--agora-ink)] mb-4">
            Produit non trouvé
          </h1>
          <Link
            href="/catalogue"
            className="text-[var(--agora-primary)] hover:underline"
          >
            Retour au catalogue
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = async () => {
    if (product.stock === 0) return;

    setIsAdding(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    addToCart(product.id, quantity);
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= product.stockThreshold;

  return (
    <div className="min-h-screen bg-[var(--agora-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--agora-mid)] mb-8">
          <Link href="/catalogue" className="hover:text-[var(--agora-primary)]">
            Catalogue
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link
            href={`/catalogue?category=${encodeURIComponent(product.category)}`}
            className="hover:text-[var(--agora-primary)]"
          >
            {product.category}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[var(--agora-ink)] truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Images - 3 columns */}
          <div className="lg:col-span-3">
            {/* Main Image */}
            <div className="relative aspect-square bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-xl)] overflow-hidden mb-4">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {/* Wishlist Button */}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={cn(
                  "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isWishlisted
                    ? "bg-[var(--agora-danger)] text-white"
                    : "bg-white/90 text-[var(--agora-mid)] hover:text-[var(--agora-danger)]"
                )}
                aria-label={isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
              </button>
              {/* Out of Stock Overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-[var(--agora-ink)]/60 flex items-center justify-center">
                  <AgoraBadge variant="danger" className="text-base px-6 py-2">
                    Rupture de stock
                  </AgoraBadge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "relative w-20 h-20 shrink-0 rounded-[var(--radius-md)] overflow-hidden border-2 transition-colors",
                    selectedImage === index
                      ? "border-[var(--agora-primary)]"
                      : "border-[var(--agora-line)] hover:border-[var(--agora-primary)]/50"
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info - 2 columns */}
          <div className="lg:col-span-2">
            {/* Category Badge */}
            <AgoraBadge variant="default" className="mb-3">
              {product.category}
            </AgoraBadge>

            {/* Title */}
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--agora-ink)] mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <StarRating
                rating={product.rating}
                showValue
                reviewCount={product.reviewCount}
              />
            </div>

            {/* Price */}
            <p className="font-display text-3xl font-bold text-[var(--agora-ink)] mb-6">
              {product.price.toFixed(2).replace(".", ",")} €
            </p>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--agora-ink)] mb-2">
                Quantité
              </label>
              <div className="inline-flex items-center border border-[var(--agora-line)] rounded-[var(--radius-md)]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="p-3 text-[var(--agora-mid)] hover:text-[var(--agora-ink)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium text-[var(--agora-ink)]">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  disabled={quantity >= product.stock}
                  className="p-3 text-[var(--agora-mid)] hover:text-[var(--agora-ink)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className={cn(
                "w-full py-4 px-6 rounded-[var(--radius-md)] font-medium text-lg transition-all flex items-center justify-center gap-2",
                isOutOfStock
                  ? "bg-[var(--agora-line)] text-[var(--agora-mid)] cursor-not-allowed"
                  : justAdded
                  ? "bg-[var(--agora-green)] text-white"
                  : "bg-[var(--agora-primary)] text-white hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]"
              )}
            >
              {justAdded ? (
                <>
                  <Check className="w-5 h-5 animate-checkmark" />
                  Ajouté au panier
                </>
              ) : isAdding ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                </>
              )}
            </button>

            {/* Store Card */}
            {store && (
              <Link
                href={`/boutique/${store.id}`}
                className="mt-6 p-4 bg-[var(--agora-accent)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] flex items-center gap-4 hover:border-[var(--agora-primary)] transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--agora-surface)] border border-[var(--agora-line)] overflow-hidden relative">
                  {store.logo ? (
                    <Image
                      src={store.logo}
                      alt={store.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-[var(--agora-mid)]" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--agora-mid)]">Vendu par</p>
                  <p className="font-medium text-[var(--agora-ink)]">
                    {store.name}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[var(--agora-mid)]" />
              </Link>
            )}

            {/* Divider */}
            <hr className="my-6 border-[var(--agora-line)]" />

            {/* Description */}
            <div>
              <h2 className="font-display font-semibold text-lg text-[var(--agora-ink)] mb-3">
                Description
              </h2>
              <div className="relative">
                <p
                  className={cn(
                    "text-[var(--agora-mid)] leading-relaxed",
                    !isDescriptionExpanded && "line-clamp-3"
                  )}
                >
                  {product.description}
                </p>
                {product.description.length > 200 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 text-sm text-[var(--agora-primary)] font-medium hover:underline flex items-center gap-1"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Voir moins
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Lire plus
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stock Indicator */}
            <div className="mt-6 flex items-center gap-2">
              {isOutOfStock ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[var(--agora-danger)]" />
                  <span className="text-sm text-[var(--agora-danger)]">
                    Rupture de stock
                  </span>
                </>
              ) : isLowStock ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[var(--agora-warning)]" />
                  <span className="text-sm text-[var(--agora-warning)]">
                    Stock faible ({product.stock} restants)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[var(--agora-green)]" />
                  <span className="text-sm text-[var(--agora-green)]">
                    En stock ({product.stock} disponibles)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-[var(--agora-ink)] mb-6">
            Avis clients
          </h2>

          {/* Rating Summary */}
          <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-[var(--agora-ink)]">
                  {product.rating.toFixed(1)}
                </p>
                <StarRating rating={product.rating} size="md" className="mt-1" />
                <p className="text-sm text-[var(--agora-mid)] mt-1">
                  {product.reviewCount} avis
                </p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviews.filter((r) => Math.floor(r.rating) === stars).length;
                  const percentage = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs text-[var(--agora-mid)] w-3">
                        {stars}
                      </span>
                      <div className="flex-1 h-2 bg-[var(--agora-accent)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--agora-gold)] rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Review List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--agora-accent)] flex items-center justify-center font-medium text-[var(--agora-primary)]">
                        {review.userName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--agora-ink)]">
                          {review.userName}
                        </p>
                        <p className="text-xs text-[var(--agora-mid)]">
                          {new Date(review.date).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="text-[var(--agora-mid)]">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[var(--agora-mid)] py-8">
              Aucun avis pour le moment.
            </p>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-[var(--agora-ink)] mb-6">
              Produits similaires
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
