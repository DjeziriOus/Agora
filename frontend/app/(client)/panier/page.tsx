"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Store } from "lucide-react";
import { useCart, CartItem as CartItemType } from "@/context/CartContext";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const total = subtotal;
  
  // Group items by store
  const groupedItems = items.reduce((acc, item) => {
    const storeId = item.storeId;
    if (!acc[storeId]) {
      acc[storeId] = {
        storeName: item.storeName,
        items: [],
      };
    }
    acc[storeId].items.push(item);
    return acc;
  }, {} as Record<string, { storeName: string; items: CartItemType[] }>);

  const storeIds = Object.keys(groupedItems);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="font-display text-3xl font-bold text-[var(--agora-ink)] mb-8">
            Mon panier
          </h1>
          <EmptyState
            type="cart"
            title="Votre panier est vide"
            description="Découvrez nos produits et commencez vos achats."
            action={{
              label: "Voir le catalogue",
              href: "/catalogue",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--agora-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--agora-ink)]">
            Mon panier
          </h1>
          <button
            onClick={clearCart}
            className="text-sm text-[var(--agora-danger)] hover:underline"
          >
            Vider le panier
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {storeIds.map((storeId) => (
              <div
                key={storeId}
                className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] overflow-hidden"
              >
                {/* Store Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[var(--agora-accent)] border-b border-[var(--agora-line)]">
                  <Store className="w-4 h-4 text-[var(--agora-mid)]" />
                  <Link
                    href={`/boutique/${storeId}`}
                    className="text-sm font-medium text-[var(--agora-ink)] hover:text-[var(--agora-primary)]"
                  >
                    {groupedItems[storeId].storeName}
                  </Link>
                </div>

                {/* Items */}
                <div className="divide-y divide-[var(--agora-line)]">
                  {groupedItems[storeId].items.map((item) => (
                    <CartItemRow
                      key={item.productId}
                      item={item}
                      onUpdateQuantity={(qty) =>
                        updateQuantity(item.productId, qty)
                      }
                      onRemove={() => removeFromCart(item.productId)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-6 sticky top-24">
              <h2 className="font-display font-semibold text-lg text-[var(--agora-ink)] mb-4">
                Récapitulatif
              </h2>

              {/* Items Count */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--agora-mid)]">
                  {items.reduce((sum, item) => sum + item.quantity, 0)} article
                  {items.reduce((sum, item) => sum + item.quantity, 0) > 1
                    ? "s"
                    : ""}
                </span>
                <span className="text-[var(--agora-ink)]">
                  {total.toFixed(2).replace(".", ",")} €
                </span>
              </div>

              {/* Shipping */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--agora-mid)]">Livraison</span>
                <span className="text-[var(--agora-green)] text-sm font-medium">
                  Gratuite
                </span>
              </div>

              <hr className="my-4 border-[var(--agora-line)]" />

              {/* Total */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold text-[var(--agora-ink)]">
                  Total
                </span>
                <span className="font-display text-2xl font-bold text-[var(--agora-ink)]">
                  {total.toFixed(2).replace(".", ",")} €
                </span>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="w-full py-4 px-6 bg-[var(--agora-primary)] text-white rounded-[var(--radius-md)] font-medium text-center flex items-center justify-center gap-2 hover:bg-[var(--agora-primary-hover)] transition-colors"
              >
                Passer la commande
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Continue Shopping */}
              <Link
                href="/catalogue"
                className="w-full mt-3 py-3 px-6 border border-[var(--agora-line)] text-[var(--agora-mid)] rounded-[var(--radius-md)] font-medium text-center flex items-center justify-center gap-2 hover:border-[var(--agora-primary)] hover:text-[var(--agora-primary)] transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart Item Row Component
function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    onRemove();
  };

  return (
    <div
      className={cn(
        "p-4 flex gap-4 transition-opacity",
        isRemoving && "opacity-50"
      )}
    >
      {/* Product Image */}
      <Link
        href={`/produit/${item.productId}`}
        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-[var(--radius-md)] overflow-hidden shrink-0 bg-[var(--agora-accent)]"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/produit/${item.productId}`}
          className="font-medium text-[var(--agora-ink)] hover:text-[var(--agora-primary)] line-clamp-1"
        >
          {item.name}
        </Link>
        <p className="text-sm text-[var(--agora-mid)] mt-1">
          {item.price.toFixed(2).replace(".", ",")} € / unité
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-4 mt-3">
          <div className="inline-flex items-center border border-[var(--agora-line)] rounded-[var(--radius-md)]">
            <button
              onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="p-2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-[var(--agora-ink)]">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="p-2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="p-2 text-[var(--agora-mid)] hover:text-[var(--agora-danger)] transition-colors"
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Item Total */}
      <div className="text-right">
        <p className="font-semibold text-[var(--agora-ink)]">
          {(item.price * item.quantity).toFixed(2).replace(".", ",")} €
        </p>
      </div>
    </div>
  );
}
