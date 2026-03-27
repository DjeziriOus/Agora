"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AgoraBadge } from "./AgoraBadge";
import { StarRating } from "./StarRating";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0) return;

    setIsAdding(true);

    // Simulate slight delay for feedback
    await new Promise((resolve) => setTimeout(resolve, 300));

    addToCart(product.id, 1);
    setIsAdding(false);
    setJustAdded(true);

    // Reset after animation
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const isOutOfStock = product.stock === 0;

  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/produit/${product.id}`;
  };

  return (
    <div
      // type="button"
      onClick={handleNavigate}
      className={cn(
        "group block bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] overflow-hidden card-hover hover:border-[var(--agora-primary)] transition-colors cursor-pointer ",
        className,
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--agora-accent)]">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            isWishlisted
              ? "bg-[var(--agora-danger)] text-white"
              : "bg-white/90 text-[var(--agora-mid)] hover:text-[var(--agora-danger)]",
          )}
          aria-label={
            isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"
          }
        >
          <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
        </button>

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
          href={`/boutique/${product.storeId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-[var(--agora-primary)] hover:underline mb-3 block"
        >
          Vendu par {product.storeName} →
        </Link>

        {/* Price */}
        <p className="font-display font-bold text-xl text-[var(--agora-ink)] mb-3">
          {product.price.toFixed(2).replace(".", ",")} €
        </p>

        {/* Add to Cart Button */}
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
      </div>
    </div>
  );
}
