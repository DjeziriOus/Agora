"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AgoraBadge } from "./AgoraBadge";
import { StarRating } from "./StarRating";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  viewMode: "grid" | "list";
  className?: string;
}

export function ProductCard({
  product,
  viewMode = "grid",
  className,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const router = useRouter();
  const { isSeller } = useAuth();
  const { addToCart, isAdding } = useCart();
  const productId =
    product.id || ((product as unknown as { _id?: string })._id ?? "");
  const mainImage =
    typeof product.images?.[0] === "string" &&
    product.images[0].trim().length > 0
      ? product.images[0]
      : "/placeholder-product.png";

  const isOutOfStock = !product.inStock;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock || !productId) return;

    // Auto-select first active variant for quick-add from card
    const firstVariant = product.variants?.find((v) => v.isActive);
    if (!firstVariant) return;

    addToCart(product, 1, firstVariant.id);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleNavigate = () => {
    if (!productId) return;
    router.push(`/produit/${productId}`);
  };
  if (viewMode === "list") {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            // Ouvre dans un nouvel onglet
            e.preventDefault();
            window.open(`/produit/${productId}`, "_blank");
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNavigate();
          }
        }}
        className={cn(
          "group flex flex-col sm:flex-row bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] overflow-hidden card-hover hover:border-[var(--agora-primary)] transition-colors cursor-pointer",
          className,
        )}
      >
        {/* Image Container */}
        <div className="relative w-full sm:w-[240px] aspect-[4/3] sm:aspect-auto sm:h-[200px] shrink-0 bg-[var(--agora-accent)] overflow-hidden">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 240px"
          />

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-[var(--agora-ink)]/60 flex items-center justify-center">
              <AgoraBadge variant="danger" className="text-sm px-4 py-1.5">
                Rupture de stock
              </AgoraBadge>
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex flex-1 flex-col sm:flex-row p-4 gap-4 sm:gap-6">
          {/* Left side: Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <AgoraBadge variant="default" className="mb-3">
                {product.category}
              </AgoraBadge>
              <h3 className="font-display font-semibold text-[var(--agora-ink)] text-lg leading-tight line-clamp-2 mb-2 group-hover:text-[var(--agora-primary)] transition-colors">
                {product.name}
              </h3>

              <StarRating
                rating={product.rating}
                size="sm"
                showValue
                reviewCount={product.reviewCount}
                className="mb-3"
              />

              <Link
                href={`/boutique/${product.storeSlug}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-[var(--agora-primary)] hover:underline mb-2 block w-fit"
              >
                Vendu par {product.storeName} →
              </Link>
            </div>
          </div>

          {/* Right side: Price and Action */}
          <div className="flex flex-col items-end justify-between sm:w-[200px] shrink-0 border-t sm:border-t-0 sm:border-l border-[var(--agora-line)] pt-4 sm:pt-0 sm:pl-6">
            <div className="text-right w-full mb-4">
              <p className="font-display font-bold text-2xl text-[var(--agora-ink)] mb-1">
                {product.hasMultiplePrices && (
                  <span className="text-sm font-normal text-[var(--agora-mid)] mr-1 block">
                    À partir de
                  </span>
                )}
                {product.displayPrice.toFixed(2).replace(".", ",")} €
              </p>
              <p className="text-sm text-[var(--agora-green)] font-medium">
                Livraison disponible
              </p>
            </div>

            {!isSeller && (
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
                className={cn(
                  "w-full py-2.5 px-4 rounded-[var(--radius-md)] font-medium text-sm transition-all flex items-center justify-center gap-2",
                  isOutOfStock
                    ? "bg-[var(--agora-line)] text-[var(--agora-mid)] cursor-not-allowed"
                    : justAdded
                      ? "bg-[var(--agora-green)] text-white"
                      : "bg-[var(--agora-primary)] text-white hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]",
                )}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 animate-checkmark" />
                    Ajouté
                  </>
                ) : isAdding ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter au panier
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  } else if (viewMode === "grid") {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={handleNavigate}
        onKeyDown={(e) => {
          if (e.ctrlKey || e.metaKey) {
            // Ouvre dans un nouvel onglet
            e.preventDefault();
            window.open(`/produit/${productId}`, "_blank");
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleNavigate();
          }
        }}
        className={cn(
          "group block bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] overflow-hidden card-hover hover:border-[var(--agora-primary)] transition-colors cursor-pointer ",
          className,
        )}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--agora-accent)]">
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-[var(--agora-ink)]/60 flex items-center justify-center">
              <AgoraBadge variant="danger" className="text-sm px-4 py-1.5">
                Rupture de stock
              </AgoraBadge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <AgoraBadge variant="default" className="mb-2">
            {product.category}
          </AgoraBadge>

          {/* Product Name */}
          <h3 className="font-display font-semibold text-[var(--agora-ink)] text-[15px] leading-tight line-clamp-2 mb-2 group-hover:text-[var(--agora-primary)] transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <StarRating
            rating={product.rating}
            size="sm"
            showValue
            reviewCount={product.reviewCount}
            className="mb-2"
          />

          {/* Store Link */}
          <Link
            href={`/boutique/${product.storeSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-[var(--agora-primary)] hover:underline mb-3 block"
          >
            Vendu par {product.storeName} →
          </Link>

          {/* Price */}
          <p className="font-display font-bold text-xl text-[var(--agora-ink)] mb-3">
            {product.hasMultiplePrices && (
              <span className="text-sm font-normal text-[var(--agora-mid)] mr-1">
                À partir de
              </span>
            )}
            {product.displayPrice.toFixed(2).replace(".", ",")} €
          </p>

          {!isSeller && (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isAdding}
              className={cn(
                "w-full py-2.5 px-4 rounded-[var(--radius-md)] font-medium text-sm transition-all flex items-center justify-center gap-2",
                isOutOfStock
                  ? "bg-[var(--agora-line)] text-[var(--agora-mid)] cursor-not-allowed"
                  : justAdded
                    ? "bg-[var(--agora-green)] text-white"
                    : "bg-[var(--agora-primary)] text-white hover:bg-[var(--agora-primary-hover)] active:scale-[0.98]",
              )}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 animate-checkmark" />
                  Ajouté
                </>
              ) : isAdding ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Ajouter au panier
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }
}
