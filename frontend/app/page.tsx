"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Diamond, ArrowRight, ShoppingBag, Store, Shield } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonProductGrid } from "@/components/SkeletonCard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { shopsApi } from "@/lib/api";
import { useProducts } from "@/hooks/useApi";
import {
  buildCategoriesFromProducts,
  PUBLIC_PRODUCTS_LIMIT,
} from "@/lib/productBrowse";

const categoryIcons: Record<string, string> = {
  Papeterie: "📝",
  Maison: "🏠",
  Mode: "👜",
  Bijoux: "💎",
  Art: "🎨",
  Alimentation: "🍯",
  Beauté: "✨",
  Jouets: "🧸",
};

export default function HomePage() {
  const { isAuthenticated, isSeller, isLoading: isAuthLoading } = useAuth();
  const [hasShop, setHasShop] = useState<boolean | null>(null);
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    isError: isProductsError,
  } = useProducts({ limit: String(PUBLIC_PRODUCTS_LIMIT) });

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated || !isSeller) {
      setHasShop(null);
      return;
    }

    let isCancelled = false;
    setHasShop(null);

    shopsApi
      .getMyStore()
      .then((shop) => {
        if (!isCancelled) {
          setHasShop(!!shop);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasShop(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isAuthLoading, isSeller]);

  const allProducts = productsResponse?.products ?? [];
  const featuredProducts = allProducts.slice(0, 8);
  const featuredCategories = useMemo(
    () => buildCategoriesFromProducts(allProducts, 8),
    [allProducts],
  );

  // Determine the boutique CTA destination and label
  // Buyers should NOT see it — they already have an account.
  // Sellers with a shop don't need it — they use the navbar dashboard link.
  const authReady = !isAuthLoading;
  const isCheckingShop = authReady && isAuthenticated && isSeller && hasShop === null;
  const showBoutiqueButton =
    authReady &&
    !isCheckingShop &&
    (!isAuthenticated || (isSeller && hasShop === false));
  const boutiqueHref = !isAuthenticated ? "/register" : "/vendeur/boutique";
  const boutiqueLabel = !isAuthenticated
    ? "Ouvrir ma boutique"
    : "Créer ma boutique";
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative bg-[var(--agora-ink)] text-white overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(var(--agora-line) 1px, transparent 1px), linear-gradient(90deg, var(--agora-line) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8">
              <svg
                width="16"
                height="16"
                viewBox="0 0 28 28"
                fill="none"
                aria-hidden="true"
              >
                <path d="M14 3L27 25H1L14 3Z" fill="var(--agora-gold)" />
                <path d="M14 10L23 25H5L14 10Z" fill="var(--agora-primary)" />
              </svg>
              <span className="text-sm text-white/80">
                La marketplace française
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
              Bienvenue sur{" "}
              <span className="relative inline-block">
                Agora
                <span
                  className="absolute left-0 -bottom-1 w-full h-1 rounded-full"
                  style={{ background: "var(--agora-gold)" }}
                />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
              La marketplace multi-boutiques française. Découvrez des créateurs
              passionnés et des produits artisanaux uniques.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/catalogue"
                className="flex items-center gap-2 bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Découvrir les produits
                <ArrowRight className="w-4 h-4" />
              </Link>
              {showBoutiqueButton && (
                <Link
                  href={boutiqueHref}
                  className="flex items-center gap-2 border border-white/30 hover:border-white/60 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {boutiqueLabel}
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Catégories */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-[var(--agora-ink)] text-center mb-10">
              Parcourir par catégorie
            </h2>
            {featuredCategories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {featuredCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/catalogue?category=${encodeURIComponent(cat.name)}`}
                    className="flex flex-col items-center gap-2 p-4 border border-[var(--agora-line)] rounded-xl hover:border-[var(--agora-primary)] hover:shadow-[var(--shadow-sm)] transition-all group"
                  >
                    <span className="text-3xl">
                      {categoryIcons[cat.name] ?? "🛍️"}
                    </span>
                    <span className="text-xs font-medium text-[var(--agora-ink)] group-hover:text-[var(--agora-primary)] transition-colors text-center">
                      {cat.name}
                    </span>
                    <span className="text-xs text-[var(--agora-mid)]">
                      {cat.productCount} produits
                    </span>
                  </Link>
                ))}
              </div>
            ) : isProductsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[118px] rounded-xl border border-[var(--agora-line)] bg-[var(--agora-bg)] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--agora-mid)]">
                {isProductsError
                  ? "Impossible de charger les categories pour le moment."
                  : "Aucune categorie disponible pour le moment."}
              </p>
            )}
          </div>
        </section>

        {/* Produits en vedette */}
        <section className="bg-[var(--agora-bg)] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[var(--agora-ink)]">
                Produits en vedette
              </h2>
              <Link
                href="/catalogue"
                className="flex items-center gap-1 text-sm text-[var(--agora-primary)] hover:underline font-medium"
              >
                Voir tout
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : isProductsLoading ? (
              <SkeletonProductGrid
                count={8}
                className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              />
            ) : (
              <p className="text-center text-[var(--agora-mid)] py-6">
                {isProductsError
                  ? "Impossible de charger les produits en vedette."
                  : "Aucun produit disponible pour le moment."}
              </p>
            )}
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="bg-[var(--agora-accent)] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-[var(--agora-ink)] text-center mb-12">
              Comment ça marche
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
              {[
                {
                  step: 1,
                  icon: ShoppingBag,
                  title: "Créez votre compte",
                  desc: "Inscrivez-vous gratuitement en quelques secondes pour commencer vos achats.",
                },
                {
                  step: 2,
                  icon: Store,
                  title: "Parcourez le catalogue",
                  desc: "Explorez des centaines de boutiques et trouvez des produits uniques.",
                },
                {
                  step: 3,
                  icon: Shield,
                  title: "Commandez en toute sécurité",
                  desc: "Paiement sécurisé et suivi de livraison pour chaque commande.",
                },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div
                  key={step}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--agora-primary)] text-white font-bold text-lg flex items-center justify-center mb-4">
                    {step}
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-[var(--agora-line)] bg-white flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[var(--agora-mid)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--agora-ink)] mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-[var(--agora-text-secondary)] leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA vendeur — only show if user is not already a seller with a shop */}
        {showBoutiqueButton && (
          <section className="bg-[var(--agora-primary)] py-16 text-white text-center">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
              <h2 className="text-3xl font-bold mb-4">
                Vous êtes artisan ou créateur ?
              </h2>
              <p className="text-white/80 mb-8 leading-relaxed">
                Rejoignez Agora et vendez vos créations à des milliers de clients.
                Inscription gratuite, commissions réduites.
              </p>
              <Link
                href={boutiqueHref}
                className="inline-flex items-center gap-2 border border-white/60 hover:border-white text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {boutiqueLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
