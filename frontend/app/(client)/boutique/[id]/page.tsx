"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store, Calendar, Package } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { mockStores, getProductsByStore } from "@/lib/mockData";

export default function StorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const store = mockStores.find((s) => s.id === id);
  const products = store ? getProductsByStore(store.id) : [];

  if (!store) {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--agora-ink)] mb-4">
            Boutique non trouvée
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

  const memberSince = new Date(store.createdAt).getFullYear();

  return (
    <div className="min-h-screen bg-[var(--agora-bg)]">
      {/* Store Header Banner */}
      <div className="relative h-48 sm:h-64 md:h-80 bg-gradient-to-r from-[var(--agora-primary)] to-[#7986CB]">
        {store.banner && (
          <Image
            src={store.banner}
            alt={`${store.name} banner`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end gap-4 sm:gap-6">
              {/* Store Logo */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--agora-surface)] border-4 border-white shadow-lg overflow-hidden shrink-0">
                {store.logo ? (
                  <Image
                    src={store.logo}
                    alt={store.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-10 h-10 text-[var(--agora-mid)]" />
                  </div>
                )}
              </div>
              
              {/* Store Details */}
              <div className="flex-1 text-white pb-1">
                <h1 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                  {store.name}
                </h1>
                <p className="text-white/80 text-sm sm:text-base line-clamp-2 max-w-2xl">
                  {store.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Stats */}
      <div className="bg-[var(--agora-surface)] border-b border-[var(--agora-line)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[var(--agora-mid)]" />
              <span className="text-sm text-[var(--agora-mid)]">
                {store.productCount} produits
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--agora-mid)]" />
              <span className="text-sm text-[var(--agora-mid)]">
                Membre depuis {memberSince}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={store.rating} size="sm" showValue />
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="font-display text-xl font-bold text-[var(--agora-ink)] mb-6">
          Produits de {store.name}
        </h2>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            type="products"
            title="Aucun produit"
            description="Cette boutique n'a pas encore de produits."
          />
        )}
      </div>
    </div>
  );
}
