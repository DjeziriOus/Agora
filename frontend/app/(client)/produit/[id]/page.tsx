"use client";

import { useState, useEffect, use, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { SkeletonProductGrid } from "@/components/SkeletonCard";
import { useCart } from "@/hooks/useCart";
import { useProduct, useProducts } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import {
  getRelatedProducts,
  PUBLIC_PRODUCTS_LIMIT,
} from "@/lib/productBrowse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Review } from "@/types";
import { cn } from "@/lib/utils";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isSeller } = useAuth();
  const { addToCart, isAdding } = useCart();
  const { data: product, isLoading, error } = useProduct(id);
  const {
    data: productsResponse,
    isLoading: isRelatedProductsLoading,
  } = useProducts({ limit: String(PUBLIC_PRODUCTS_LIMIT) });
  const errorStatus = error instanceof ApiError ? error.status : null;
  const isNotFoundError = errorStatus === 404;
  const allProducts = productsResponse?.products ?? [];
  const store = product?.storeId
    ? { id: product.storeId, name: product.storeName, logo: product.storeLogo }
    : null;
  const reviews: Review[] = [];
  const relatedProducts = useMemo(
    () => (product ? getRelatedProducts(allProducts, product) : []),
    [allProducts, product],
  );

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false);
  const [selectedVariantCode, setSelectedVariantCode] = useState<string | null>(
    null,
  );

  // Auto-select the first active variant when product loads
  useEffect(() => {
    if (!product?.variants?.length) {
      setSelectedVariantCode(null);
      return;
    }

    const hasMatchingActiveVariant = product.variants.some(
      (variant) => variant.isActive && variant.code === selectedVariantCode,
    );

    if (!hasMatchingActiveVariant) {
      const firstActive = product.variants.find((variant) => variant.isActive);
      setSelectedVariantCode(firstActive?.code ?? null);
    }
  }, [product, selectedVariantCode]);

  useEffect(() => {
    setSelectedImage(0);
  }, [product?.id]);

  // Show a loading state while the detail request is still resolving.
  if (isLoading && !product) {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-[var(--agora-line)] border-t-[var(--agora-primary)] animate-spin" />
          <p className="text-[var(--agora-mid)]">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  // Show a generic error state when the request failed for a reason other than a missing product.
  if (error && !product && !isNotFoundError) {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="font-display text-2xl font-bold text-[var(--agora-ink)] mb-4">
            Impossible de charger ce produit
          </h1>
          <p className="text-[var(--agora-mid)] mb-6">
            {error instanceof Error
              ? error.message
              : "Une erreur est survenue pendant le chargement."}
          </p>
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

  // Only render the not-found state once loading is finished and no product was resolved.
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

  const activeVariants = (product.variants ?? []).filter(
    (variant) => variant.isActive,
  );
  const productImages =
    product.images.length > 0 ? product.images : ["/placeholder-product.png"];
  const hasMultipleVariants = activeVariants.length > 1;
  const selectedVariant = activeVariants.find(
    (variant) => variant.code === selectedVariantCode,
  );
  const displayPrice = selectedVariant?.price ?? product.displayPrice;
  const displayStock = selectedVariant?.stock ?? product.totalStock;

  const handleAddToCart = async () => {
    if (isSeller) return;

    // Block the add-to-cart action when the selected product option is out of stock.
    if (displayStock === 0) return;

    // Force the user to pick a variant before adding products with multiple options.
    if (hasMultipleVariants && !selectedVariant) {
      setIsVariantDialogOpen(true);
      return;
    }

    const variantId = selectedVariant?.id ?? activeVariants[0]?.id;
    // Abort if no valid variant identifier can be resolved for the cart payload.
    if (!variantId) return;

    addToCart(product, quantity, variantId);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const isOutOfStock = displayStock === 0;
  const isLowStock = displayStock > 0 && displayStock <= product.stockThreshold;

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
                src={productImages[selectedImage] ?? productImages[0]}
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
              {productImages.map((image, index) => (
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
              {product.hasMultiplePrices && !selectedVariant && (
                <span className="text-base font-normal text-[var(--agora-mid)] mr-1">
                  À partir de
                </span>
              )}
              {displayPrice.toFixed(2).replace(".", ",")} €
            </p>

            {/* Variant selector — only show when multiple variants exist */}
            {hasMultipleVariants && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--agora-ink)] mb-2">
                  Option
                </label>
                <button
                  type="button"
                  onClick={() => setIsVariantDialogOpen(true)}
                  className="w-full text-left px-4 py-3 border border-[var(--agora-line)] rounded-[var(--radius-md)] hover:border-[var(--agora-primary)] transition-colors"
                >
                  {selectedVariant
                    ? `${selectedVariant.name} (${selectedVariant.stock} en stock)`
                    : "Choisir une option"}
                </button>
              </div>
            )}

            {!isSeller ? (
              <>
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
                        setQuantity((q) => Math.min(displayStock, q + 1))
                      }
                      disabled={quantity >= displayStock}
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
              </>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-[var(--agora-line)] bg-[var(--agora-accent)] px-4 py-4 text-sm leading-relaxed text-[var(--agora-mid)]">
                Les comptes vendeurs ne peuvent pas passer commande. Veuillez
                utiliser un compte particulier pour acheter ce produit.
              </div>
            )}

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
                    {store.name || "Boutique"}
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
                    Stock faible ({displayStock} restants)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-[var(--agora-green)]" />
                  <span className="text-sm text-[var(--agora-green)]">
                    En stock ({displayStock} disponibles)
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
        {isRelatedProductsLoading ? (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-[var(--agora-ink)] mb-6">
              Produits similaires
            </h2>
            <SkeletonProductGrid
              count={4}
              className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            />
          </section>
        ) : relatedProducts.length > 0 && (
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

      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir une option</DialogTitle>
            <DialogDescription>
              Selectionnez un variant avant d'ajouter au panier.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-72 overflow-auto">
            {activeVariants.map((variant) => {
              const isSelected = selectedVariantCode === variant.code;
              return (
                <button
                  key={variant.code}
                  type="button"
                  onClick={() => setSelectedVariantCode(variant.code)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-[var(--agora-primary)] bg-[var(--agora-accent)]"
                      : "border-[var(--agora-line)] hover:border-[var(--agora-primary)]",
                  )}
                >
                  <p className="font-medium text-[var(--agora-ink)]">{variant.name}</p>
                  <p className="text-sm text-[var(--agora-mid)]">
                    {variant.price.toFixed(2).replace(".", ",")} € · {variant.stock} en stock
                  </p>
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsVariantDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={!selectedVariant}
              onClick={() => setIsVariantDialogOpen(false)}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
