"use client";

import { useState, useEffect, useMemo, type ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShoppingBag,
  Store,
  Shield,
  Truck,
  CreditCard,
  Sparkles,
  TrendingUp,
  Users,
  Package,
  Zap,
  Globe,
  BarChart3,
  Layers,
  CheckCircle2,
  Star,
  ChevronRight,
  Play,
  Gem,
  Palette,
  Shirt,
  Home,
  PenTool,
  UtensilsCrossed,
  Flower2,
  Puzzle,
  BookOpen,
  Music,
  Camera,
  Coffee,
  Headphones,
  Watch,
  Smartphone,
  Laptop,
  Dumbbell,
  Car,
} from "lucide-react";
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
import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";

type LucideIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

interface CategoryStyle {
  icon: LucideIcon;
  gradient: string;
}

// Universal category styles for a marketplace
const categoryStyles: Record<string, CategoryStyle> = {
  Electronique: { icon: Smartphone, gradient: "from-blue-500 to-cyan-500" },
  Mode: { icon: Shirt, gradient: "from-pink-500 to-rose-500" },
  Maison: { icon: Home, gradient: "from-amber-500 to-orange-500" },
  Bijoux: { icon: Gem, gradient: "from-purple-500 to-violet-500" },
  Art: { icon: Palette, gradient: "from-indigo-500 to-blue-500" },
  Alimentation: { icon: UtensilsCrossed, gradient: "from-green-500 to-emerald-500" },
  Beaute: { icon: Flower2, gradient: "from-fuchsia-500 to-pink-500" },
  Jouets: { icon: Puzzle, gradient: "from-yellow-500 to-amber-500" },
  Livres: { icon: BookOpen, gradient: "from-sky-500 to-blue-500" },
  Musique: { icon: Music, gradient: "from-violet-500 to-purple-500" },
  Photo: { icon: Camera, gradient: "from-slate-500 to-gray-600" },
  Sport: { icon: Dumbbell, gradient: "from-red-500 to-orange-500" },
  Auto: { icon: Car, gradient: "from-zinc-600 to-slate-700" },
  Montres: { icon: Watch, gradient: "from-amber-600 to-yellow-600" },
  Audio: { icon: Headphones, gradient: "from-teal-500 to-cyan-500" },
  Informatique: { icon: Laptop, gradient: "from-gray-600 to-slate-700" },
  Papeterie: { icon: PenTool, gradient: "from-indigo-400 to-blue-500" },
  "Cafe & The": { icon: Coffee, gradient: "from-amber-700 to-orange-700" },
};

const fallbackCategoryStyle: CategoryStyle = {
  icon: ShoppingBag,
  gradient: "from-[var(--agora-primary)] to-indigo-600",
};

const features = [
  {
    icon: Zap,
    title: "Lancement rapide",
    description: "Creez votre boutique en moins de 5 minutes et commencez a vendre immediatement.",
  },
  {
    icon: Globe,
    title: "Visibilite maximale",
    description: "Acces a des milliers de clients potentiels des le premier jour.",
  },
  {
    icon: BarChart3,
    title: "Analytics avances",
    description: "Suivez vos ventes, clients et performances en temps reel.",
  },
  {
    icon: Shield,
    title: "Paiements securises",
    description: "Transactions protegees et versements rapides sur votre compte.",
  },
];

const sellerBenefits = [
  "Aucun frais d'inscription",
  "Commission reduite de 5%",
  "Support client 7j/7",
  "Outils marketing inclus",
  "Gestion de stock simplifiee",
  "Livraison facilitee",
];

const stats = [
  { value: 250, suffix: "+", label: "Boutiques actives" },
  { value: 15000, suffix: "+", label: "Produits disponibles" },
  { value: 50000, suffix: "+", label: "Clients satisfaits" },
  { value: 98, suffix: "%", label: "Taux de satisfaction" },
];

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
  const trendingProducts = allProducts.slice(0, 4);
  const featuredCategories = useMemo(
    () => buildCategoriesFromProducts(allProducts, 8),
    [allProducts],
  );

  const authReady = !isAuthLoading;
  const isCheckingShop = authReady && isAuthenticated && isSeller && hasShop === null;
  const showBoutiqueButton =
    authReady &&
    !isCheckingShop &&
    (!isAuthenticated || (isSeller && hasShop === false));
  const boutiqueHref = !isAuthenticated ? "/register" : "/vendeur/boutique";
  const boutiqueLabel = !isAuthenticated
    ? "Ouvrir ma boutique"
    : "Creer ma boutique";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* ============================================ */}
        {/* HERO - Clean, modern marketplace style       */}
        {/* ============================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          {/* Animated gradient orbs */}
          <div
            aria-hidden
            className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 animate-pulse"
            style={{ background: "radial-gradient(circle, #5c6bc0 0%, transparent 70%)" }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-25 animate-pulse"
            style={{ background: "radial-gradient(circle, #ffa726 0%, transparent 70%)", animationDelay: "1s" }}
          />
          
          {/* Grid pattern overlay */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <Reveal>
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--agora-gold)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--agora-gold)]"></span>
                    </span>
                    <span className="text-sm text-white/90 font-medium">
                      La marketplace qui fait la difference
                    </span>
                  </div>
                </Reveal>

                {/* Headline */}
                <Reveal delay={100}>
                  <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
                    Vendez partout.
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--agora-gold)] via-amber-400 to-[var(--agora-gold)]">
                      Grandissez sans limites.
                    </span>
                  </h1>
                </Reveal>

                <Reveal delay={200}>
                  <p className="text-lg sm:text-xl text-white/70 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                    Agora connecte les vendeurs de toutes tailles avec des millions d'acheteurs. 
                    Lancez votre boutique en ligne en quelques minutes, gerez vos ventes simplement.
                  </p>
                </Reveal>

                {/* CTAs */}
                <Reveal delay={300}>
                  <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4 mb-12">
                    <Link
                      href="/catalogue"
                      className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] text-white px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-[0_8px_30px_-4px_rgba(92,107,192,0.5)] hover:-translate-y-0.5"
                    >
                      Explorer le catalogue
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                    {showBoutiqueButton && (
                      <Link
                        href={boutiqueHref}
                        className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 backdrop-blur-sm border border-white/30 hover:border-[var(--agora-gold)] hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold transition-all"
                      >
                        <Store className="w-5 h-5" />
                        {boutiqueLabel}
                      </Link>
                    )}
                  </div>
                </Reveal>

                {/* Trust badges */}
                <Reveal delay={400}>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-white/60 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Paiement securise</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span>Livraison rapide</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Garantie acheteur</span>
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Right side - Stats cards */}
              <div className="relative">
                <Reveal delay={200}>
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, idx) => (
                      <div
                        key={stat.label}
                        className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="font-display text-3xl sm:text-4xl font-bold text-white mb-1">
                          <CountUp end={stat.value} suffix={stat.suffix} />
                        </div>
                        <div className="text-sm text-white/60">{stat.label}</div>
                        
                        {/* Decorative gradient */}
                        <div
                          aria-hidden
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                          style={{
                            background: idx % 2 === 0 
                              ? "radial-gradient(circle at top right, rgba(92,107,192,0.15) 0%, transparent 60%)"
                              : "radial-gradient(circle at bottom left, rgba(255,167,38,0.15) 0%, transparent 60%)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </Reveal>

                {/* Floating elements */}
                <div
                  aria-hidden
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-[var(--agora-gold)] to-amber-500 opacity-20 blur-2xl animate-pulse"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--agora-primary)] to-indigo-400 opacity-20 blur-2xl animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>
            </div>
          </div>

          {/* Wave transition */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" className="w-full h-12 sm:h-16">
              <path d="M0 60V30C360 0 720 60 1080 30C1260 15 1380 30 1440 30V60H0Z" fill="var(--background)" />
            </svg>
          </div>
        </section>

        {/* ============================================ */}
        {/* CATEGORIES - Modern card grid                */}
        {/* ============================================ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
                <div>
                  <span className="inline-block text-sm font-semibold text-[var(--agora-primary)] mb-2">
                    Categories populaires
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                    Explorez par categorie
                  </h2>
                </div>
                <Link
                  href="/catalogue"
                  className="group flex items-center gap-1 text-sm font-medium text-[var(--agora-primary)] hover:text-[var(--agora-primary-hover)] transition-colors"
                >
                  Toutes les categories
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>

            {featuredCategories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                {featuredCategories.map((cat, idx) => {
                  const style = categoryStyles[cat.name] ?? fallbackCategoryStyle;
                  const Icon = style.icon;
                  return (
                    <Reveal key={cat.id} delay={idx * 50}>
                      <Link
                        href={`/catalogue?category=${encodeURIComponent(cat.name)}`}
                        className="group relative block bg-card border border-border rounded-2xl p-6 overflow-hidden hover:border-[var(--agora-primary)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Gradient background on hover */}
                        <div
                          aria-hidden
                          className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                        />
                        
                        <div
                          className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-4 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-[-3deg]`}
                        >
                          <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
                        </div>

                        <div className="relative">
                          <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-[var(--agora-primary)] transition-colors">
                            {cat.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {cat.productCount} produit{cat.productCount > 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="relative mt-4 flex items-center gap-1 text-sm font-medium text-[var(--agora-primary)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                          Decouvrir
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            ) : isProductsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[180px] rounded-2xl border border-border bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {isProductsError
                  ? "Impossible de charger les categories."
                  : "Aucune categorie disponible."}
              </p>
            )}
          </div>
        </section>

        {/* ============================================ */}
        {/* TRENDING PRODUCTS - Horizontal scroll        */}
        {/* ============================================ */}
        <section className="py-16 lg:py-24 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--agora-gold)] mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Tendances
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                    Produits populaires
                  </h2>
                </div>
                <Link
                  href="/catalogue"
                  className="group flex items-center gap-1 text-sm font-medium text-[var(--agora-primary)] hover:text-[var(--agora-primary-hover)] transition-colors"
                >
                  Voir tout
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>

            {trendingProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {trendingProducts.map((product, idx) => (
                  <Reveal key={product.id} delay={idx * 80}>
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            ) : isProductsLoading ? (
              <SkeletonProductGrid count={4} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" />
            ) : null}
          </div>
        </section>

        {/* ============================================ */}
        {/* SELLER CTA - Why sell on Agora               */}
        {/* ============================================ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left - Features */}
              <div>
                <Reveal>
                  <span className="inline-block text-sm font-semibold text-[var(--agora-primary)] mb-2">
                    Pour les vendeurs
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                    Developpez votre activite avec Agora
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Que vous soyez un petit entrepreneur ou une entreprise etablie, 
                    Agora vous fournit tous les outils pour reussir en ligne.
                  </p>
                </Reveal>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {features.map((feature, idx) => (
                    <Reveal key={feature.title} delay={idx * 100}>
                      <div className="group p-5 rounded-xl border border-border bg-card hover:border-[var(--agora-primary)]/30 hover:shadow-md transition-all">
                        <div className="w-10 h-10 rounded-lg bg-[var(--agora-primary)]/10 flex items-center justify-center mb-3 group-hover:bg-[var(--agora-primary)]/20 transition-colors">
                          <feature.icon className="w-5 h-5 text-[var(--agora-primary)]" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>

                {showBoutiqueButton && (
                  <Reveal delay={400}>
                    <Link
                      href={boutiqueHref}
                      className="group inline-flex items-center gap-2 bg-[var(--agora-gold)] hover:bg-amber-500 text-[var(--agora-ink)] px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      Commencer gratuitement
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Reveal>
                )}
              </div>

              {/* Right - Benefits checklist */}
              <Reveal delay={200}>
                <div className="relative bg-gradient-to-br from-[var(--agora-ink)] to-[#16213e] rounded-3xl p-8 lg:p-10">
                  {/* Decorative elements */}
                  <div
                    aria-hidden
                    className="absolute top-6 right-6 w-20 h-20 rounded-full bg-[var(--agora-gold)]/20 blur-2xl"
                  />
                  <div
                    aria-hidden
                    className="absolute bottom-6 left-6 w-24 h-24 rounded-full bg-[var(--agora-primary)]/20 blur-2xl"
                  />

                  <div className="relative">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
                      <Sparkles className="w-4 h-4 text-[var(--agora-gold)]" />
                      <span className="text-sm text-white/90 font-medium">Avantages vendeurs</span>
                    </div>

                    <h3 className="font-display text-2xl font-bold text-white mb-6">
                      Tout ce dont vous avez besoin pour reussir
                    </h3>

                    <ul className="space-y-4">
                      {sellerBenefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-white/90">
                          <div className="w-6 h-6 rounded-full bg-[var(--agora-green)]/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-[var(--agora-green)]" />
                          </div>
                          {benefit}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--agora-primary)] to-indigo-400 border-2 border-[var(--agora-ink)] flex items-center justify-center text-xs text-white font-medium"
                            >
                              {String.fromCharCode(64 + i)}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-white/70">
                          <span className="text-white font-medium">+250</span> vendeurs nous font confiance
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* ALL FEATURED PRODUCTS                        */}
        {/* ============================================ */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
                <div>
                  <span className="inline-block text-sm font-semibold text-[var(--agora-primary)] mb-2">
                    Selection du moment
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                    Produits en vedette
                  </h2>
                </div>
                <Link
                  href="/catalogue"
                  className="group flex items-center gap-1 text-sm font-medium text-[var(--agora-primary)] hover:text-[var(--agora-primary-hover)] transition-colors"
                >
                  Voir tout le catalogue
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {featuredProducts.map((product, idx) => (
                  <Reveal key={product.id} delay={idx * 60}>
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            ) : isProductsLoading ? (
              <SkeletonProductGrid count={8} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" />
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {isProductsError
                  ? "Impossible de charger les produits."
                  : "Aucun produit disponible."}
              </p>
            )}
          </div>
        </section>

        {/* ============================================ */}
        {/* HOW IT WORKS                                 */}
        {/* ============================================ */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-16">
              <span className="inline-block text-sm font-semibold text-[var(--agora-primary)] mb-2">
                Comment ca marche
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Commencez en 3 etapes simples
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Que vous souhaitiez acheter ou vendre, Agora rend tout simple et rapide.
              </p>
            </Reveal>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
              {/* Connector line - desktop */}
              <div
                aria-hidden
                className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent"
              />

              {[
                {
                  step: 1,
                  icon: Users,
                  title: "Creez votre compte",
                  desc: "Inscription gratuite en quelques secondes. Aucune carte requise.",
                  color: "from-[var(--agora-primary)] to-indigo-500",
                },
                {
                  step: 2,
                  icon: Store,
                  title: "Configurez votre boutique",
                  desc: "Ajoutez vos produits, personnalisez votre page, fixez vos prix.",
                  color: "from-[var(--agora-gold)] to-amber-500",
                },
                {
                  step: 3,
                  icon: TrendingUp,
                  title: "Vendez et developpez",
                  desc: "Recevez des commandes, gerez vos ventes, grandissez.",
                  color: "from-[var(--agora-green)] to-emerald-500",
                },
              ].map(({ step, icon: Icon, title, desc, color }, idx) => (
                <Reveal key={step} delay={idx * 150} className="relative">
                  <div className="text-center">
                    {/* Step number with icon */}
                    <div className="relative inline-flex mb-6">
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-9 h-9 text-white" strokeWidth={1.75} />
                      </div>
                      <span
                        className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-display font-bold text-white text-sm shadow-md`}
                      >
                        {step}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                      {title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      {desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* FINAL CTA                                    */}
        {/* ============================================ */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[var(--agora-ink)] via-[#16213e] to-[#0f3460] relative overflow-hidden">
          {/* Animated background elements */}
          <div
            aria-hidden
            className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 animate-pulse"
            style={{ background: "var(--agora-primary)" }}
          />
          <div
            aria-hidden
            className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full blur-[80px] opacity-15 animate-pulse"
            style={{ background: "var(--agora-gold)", animationDelay: "1.5s" }}
          />

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <Reveal>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Pret a rejoindre la marketplace ?
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
                Des milliers de vendeurs ont deja fait le choix d'Agora. 
                Rejoignez-les et commencez a vendre des aujourd'hui.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/catalogue"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[var(--agora-ink)] px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Decouvrir les produits
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
                {showBoutiqueButton && (
                  <Link
                    href={boutiqueHref}
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[var(--agora-gold)] hover:bg-amber-500 text-[var(--agora-ink)] px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Store className="w-5 h-5" />
                    {boutiqueLabel}
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
