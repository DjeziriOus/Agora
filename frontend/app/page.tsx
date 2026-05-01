"use client";

import { useState, useEffect, useMemo, type ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Store,
  Shield,
  Truck,
  HeartHandshake,
  Sparkles,
  Award,
  Leaf,
  Quote,
  Star,
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
  Briefcase,
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
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import { Reveal } from "@/components/landing/Reveal";
import { CountUp } from "@/components/landing/CountUp";

type LucideIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

interface CategoryStyle {
  icon: LucideIcon;
  bg: string;
  fg: string;
}

// Map known category names to a real Lucide icon and a brand-aligned tone.
// Falls back to a generic shopping bag for anything unexpected.
const categoryStyles: Record<string, CategoryStyle> = {
  Papeterie: { icon: PenTool, bg: "#e8eaf6", fg: "#5c6bc0" },
  Maison: { icon: Home, bg: "#FFF3E0", fg: "#E65100" },
  Mode: { icon: Shirt, bg: "#FCE4EC", fg: "#C2185B" },
  Bijoux: { icon: Gem, bg: "#E0F7FA", fg: "#00838F" },
  Art: { icon: Palette, bg: "#FFF8E1", fg: "#F57F17" },
  Alimentation: { icon: UtensilsCrossed, bg: "#FFEBEE", fg: "#C62828" },
  Beauté: { icon: Flower2, bg: "#F3E5F5", fg: "#7B1FA2" },
  Jouets: { icon: Puzzle, bg: "#E0F2F1", fg: "#00796B" },
  Livres: { icon: BookOpen, bg: "#E3F2FD", fg: "#1565C0" },
  Musique: { icon: Music, bg: "#EDE7F6", fg: "#4527A0" },
  Photo: { icon: Camera, bg: "#ECEFF1", fg: "#37474F" },
  "Café & Thé": { icon: Coffee, bg: "#EFEBE9", fg: "#5D4037" },
};

const fallbackCategoryStyle: CategoryStyle = {
  icon: ShoppingBag,
  bg: "#e8eaf6",
  fg: "#5c6bc0",
};

const valueProps = [
  { icon: Truck, label: "Livraison rapide" },
  { icon: Shield, label: "Paiement sécurisé" },
  { icon: HeartHandshake, label: "Service client 7j/7" },
  // { icon: Sparkles, label: "Fait main en France" },
  { icon: Leaf, label: "Éco-responsable" },
  { icon: Award, label: "Qualité vérifiée" },
];

const testimonials = [
  {
    name: "Camille D.",
    role: "Cliente fidèle",
    quote:
      "J'ai trouvé des bijoux artisanaux que je ne voyais nulle part ailleurs. Service parfait, livraison rapide.",
    rating: 5,
    accent: "#ffa726",
  },
  {
    name: "Thomas L.",
    role: "Créateur de bougies",
    quote:
      "Ouvrir ma boutique sur Agora m'a fait gagner des centaines de clients en quelques mois. L'interface est limpide.",
    rating: 5,
    accent: "#5c6bc0",
  },
  {
    name: "Inès B.",
    role: "Cliente",
    quote:
      "Une vraie place de marché à la française : on sent l'humain derrière chaque commande.",
    rating: 5,
    accent: "#26a69a",
  },
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
  const featuredCategories = useMemo(
    () => buildCategoriesFromProducts(allProducts, 8),
    [allProducts],
  );

  const authReady = !isAuthLoading;
  const isCheckingShop =
    authReady && isAuthenticated && isSeller && hasShop === null;
  const showBoutiqueButton =
    authReady &&
    !isCheckingShop &&
    (!isAuthenticated || (isSeller && hasShop === false));
  const boutiqueHref = !isAuthenticated ? "/register" : "/vendeur/boutique";
  const boutiqueLabel = !isAuthenticated
    ? "Ouvrir ma boutique"
    : "Créer ma boutique";

  const totalProductsCount = productsResponse?.products?.length ?? 0;
  const uniqueShops = new Set(allProducts.map((p) => p.storeId)).size;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* ============================================ */}
        {/* HERO                                          */}
        {/* ============================================ */}
        <section
          className="relative overflow-hidden text-white"
          style={{
            background:
              "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          }}
        >
          {/* Animated mesh blobs */}
          <div
            aria-hidden
            className="agora-blob absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, #5c6bc0 0%, transparent 65%)",
            }}
          />
          <div
            aria-hidden
            className="agora-blob absolute top-40 -right-20 w-[380px] h-[380px] rounded-full blur-3xl opacity-35"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, #ffa726 0%, transparent 65%)",
              animationDelay: "4s",
            }}
          />
          <div
            aria-hidden
            className="agora-blob absolute bottom-0 left-1/3 w-[320px] h-[320px] rounded-full blur-3xl opacity-25"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, #26a69a 0%, transparent 70%)",
              animationDelay: "8s",
            }}
          />

          {/* Grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(var(--agora-line) 1px, transparent 1px), linear-gradient(90deg, var(--agora-line) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(circle at center, black 40%, transparent 80%)",
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
              {/* Copy */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                {/* <div
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8 agora-pulse-glow"
                >
                  <span className="w-2 h-2 rounded-full bg-[var(--agora-gold)]" />
                  <span className="text-xs uppercase tracking-widest text-white/80">
                    Marketplace française · Édition 2026
                  </span>
                </div> */}

                {/* Title */}
                <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] font-bold mb-6 leading-[1.05] text-white">
                  Vendez partout.
                  <br />
                  <span className="relative inline-block">
                    <span className="agora-gradient-text">
                      Grandissez sans limites.
                    </span>
                    {/* <span
                      className="absolute left-0 -bottom-1 h-1 w-full rounded-full agora-underline-draw"
                      style={{ background: "var(--agora-gold)" }}
                    /> */}
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-white/75 max-w-xl lg:max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                  Agora connecte les vendeurs de toutes tailles avec des
                  millions d'acheteurs. Lancez votre boutique en ligne en
                  quelques minutes, gerez vos ventes simplement.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4 mb-12">
                  <Link
                    href="/catalogue"
                    className="agora-shine relative overflow-hidden flex items-center gap-2 bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)] text-white px-7 py-3.5 rounded-xl font-medium transition-all hover:shadow-[0_8px_30px_-4px_rgba(92,107,192,0.6)]"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Découvrir les produits
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                  {showBoutiqueButton && (
                    <Link
                      href={boutiqueHref}
                      className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/30 hover:border-[var(--agora-gold)] hover:bg-white/10 text-white px-7 py-3.5 rounded-xl font-medium transition-all"
                    >
                      <Store className="w-4 h-4" />
                      {boutiqueLabel}
                    </Link>
                  )}
                </div>

                {/* Animated stats row */}
                <div className="grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0 pt-8 border-t border-white/10">
                  <div>
                    <div className="font-display text-3xl font-bold text-white">
                      <CountUp end={Math.max(uniqueShops, 250)} suffix="+" />
                    </div>
                    <div className="text-xs uppercase tracking-wider text-white/60 mt-1">
                      Boutiques
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-3xl font-bold text-white">
                      <CountUp
                        end={Math.max(totalProductsCount * 12, 1500)}
                        suffix="+"
                      />
                    </div>
                    <div className="text-xs uppercase tracking-wider text-white/60 mt-1">
                      Produits
                    </div>
                  </div>
                  {/* <div>
                    <div className="font-display text-3xl font-bold text-white">
                      <CountUp end={98} suffix="%" />
                    </div>
                    <div className="text-xs uppercase tracking-wider text-white/60 mt-1">
                      Satisfaction
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Illustration */}
              <div className="relative flex items-center justify-center">
                <div className="relative w-full max-w-[520px] agora-drift">
                  <HeroIllustration className="w-full h-auto" />
                </div>
              </div>
            </div>
          </div>

          {/* Wave separator */}
          <svg
            aria-hidden
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            className="absolute bottom-0 left-0 w-full h-12 sm:h-16"
          >
            <path
              fill="#ffffff"
              d="M0,80 L0,40 Q360,0 720,40 T1440,40 L1440,80 Z"
            />
          </svg>
        </section>

        {/* ============================================ */}
        {/* VALUE PROPS — marquee                         */}
        {/* ============================================ */}
        {/* <section className="bg-white border-b border-[var(--agora-line)] py-6 overflow-hidden">
          <div className="agora-marquee-track gap-12">
            {[...valueProps, ...valueProps].map((vp, i) => {
              const Icon = vp.icon;
              return (
                <div
                  key={`${vp.label}-${i}`}
                  className="flex items-center gap-3 shrink-0 px-4"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--agora-accent)] flex items-center justify-center text-[var(--agora-primary)]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-[var(--agora-ink)] whitespace-nowrap">
                    {vp.label}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--agora-gold)]" />
                </div>
              );
            })}
          </div>
        </section> */}

        {/* ============================================ */}
        {/* CATEGORIES — Lucide icons, no emoji          */}
        {/* ============================================ */}
        <section className="bg-white py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-12">
              <span className="inline-block text-xs uppercase tracking-[0.2em] text-[var(--agora-primary)] font-semibold mb-3">
                Catégories
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--agora-ink)] mb-3">
                Explorez par univers
              </h2>
              <p className="text-[var(--agora-mid)] max-w-xl mx-auto">
                Du fait-main au design contemporain — chaque catégorie cache des
                trouvailles uniques.
              </p>
            </Reveal>

            {featuredCategories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                {featuredCategories.map((cat, idx) => {
                  const style =
                    categoryStyles[cat.name] ?? fallbackCategoryStyle;
                  const Icon = style.icon;
                  return (
                    <Reveal key={cat.id} delay={idx * 70}>
                      <Link
                        href={`/catalogue?category=${encodeURIComponent(cat.name)}`}
                        className="agora-lift group relative block bg-white border border-[var(--agora-line)] rounded-2xl p-6 overflow-hidden hover:border-[var(--agora-primary)]"
                      >
                        {/* Decorative corner gradient */}
                        <div
                          aria-hidden
                          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                          style={{ background: style.fg }}
                        />

                        <div
                          className="relative w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-[-6deg]"
                          style={{ background: style.bg, color: style.fg }}
                        >
                          <Icon className="w-7 h-7" strokeWidth={1.75} />
                        </div>

                        <div className="relative">
                          <h3 className="font-display font-semibold text-[var(--agora-ink)] mb-1 group-hover:text-[var(--agora-primary)] transition-colors">
                            {cat.name}
                          </h3>
                          <p className="text-sm text-[var(--agora-mid)]">
                            {cat.productCount} produit
                            {cat.productCount > 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="relative mt-4 flex items-center gap-1 text-sm font-medium text-[var(--agora-primary)] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                          Découvrir
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            ) : isProductsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[170px] rounded-2xl border border-[var(--agora-line)] bg-[var(--agora-bg)] animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--agora-mid)]">
                {isProductsError
                  ? "Impossible de charger les catégories pour le moment."
                  : "Aucune catégorie disponible pour le moment."}
              </p>
            )}
          </div>
        </section>

        {/* ============================================ */}
        {/* FEATURED PRODUCTS                            */}
        {/* ============================================ */}
        <section className="bg-[var(--agora-bg)] py-20 relative overflow-hidden">
          {/* Decorative dots */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--agora-line) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              maskImage:
                "linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)",
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal>
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
                <div>
                  <span className="inline-block text-xs uppercase tracking-[0.2em] text-[var(--agora-primary)] font-semibold mb-3">
                    Sélection du moment
                  </span>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--agora-ink)]">
                    Produits en vedette
                  </h2>
                </div>
                <Link
                  href="/catalogue"
                  className="group flex items-center gap-1 text-sm text-[var(--agora-primary)] hover:text-[var(--agora-primary-hover)] font-medium"
                >
                  Voir tout le catalogue
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
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
              <SkeletonProductGrid
                count={8}
                className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
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

        {/* ============================================ */}
        {/* HOW IT WORKS — illustrated steps              */}
        {/* ============================================ */}
        <section className="bg-white py-20 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-16">
              <span className="inline-block text-xs uppercase tracking-[0.2em] text-[var(--agora-primary)] font-semibold mb-3">
                Comment ça marche
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--agora-ink)]">
                Trois étapes pour commencer
              </h2>
            </Reveal>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6">
              {/* Animated dotted connector — desktop only */}
              <svg
                aria-hidden
                viewBox="0 0 800 60"
                preserveAspectRatio="none"
                className="hidden md:block absolute top-[80px] left-[16%] right-[16%] w-[68%] h-12 pointer-events-none"
              >
                <path
                  d="M0 30 Q200 0 400 30 T800 30"
                  fill="none"
                  stroke="var(--agora-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="agora-draw-line"
                  opacity="0.5"
                />
              </svg>

              {[
                {
                  step: 1,
                  icon: ShoppingBag,
                  title: "Créez votre compte",
                  desc: "Inscription gratuite en moins d'une minute.",
                  color: "#5c6bc0",
                },
                {
                  step: 2,
                  icon: Store,
                  title: "Explorez les boutiques",
                  desc: "Parcourez des centaines de créateurs français.",
                  color: "#ffa726",
                },
                {
                  step: 3,
                  icon: Shield,
                  title: "Commandez sereinement",
                  desc: "Paiement sécurisé et suivi colis sur chaque achat.",
                  color: "#26a69a",
                },
              ].map(({ step, icon: Icon, title, desc, color }, idx) => (
                <Reveal
                  key={step}
                  delay={idx * 200}
                  className="flex flex-col items-center text-center relative"
                >
                  {/* Numbered illustrated circle */}
                  <div className="relative mb-6">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center border-2 bg-white relative z-10"
                      style={{
                        borderColor: color,
                        boxShadow: `0 12px 30px -10px ${color}66`,
                      }}
                    >
                      <Icon
                        className="w-9 h-9"
                        style={{ color }}
                        strokeWidth={1.75}
                      />
                    </div>
                    <span
                      className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-white text-sm z-20"
                      style={{ background: color }}
                    >
                      {step}
                    </span>
                    {/* Soft halo */}
                    <div
                      aria-hidden
                      className="absolute inset-0 rounded-full blur-2xl opacity-30"
                      style={{ background: color }}
                    />
                  </div>

                  <h3 className="font-display font-semibold text-lg text-[var(--agora-ink)] mb-2">
                    {title}
                  </h3>
                  <p className="text-[var(--agora-text-secondary)] leading-relaxed max-w-xs">
                    {desc}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* TESTIMONIALS                                  */}
        {/* ============================================ */}
        {/* <section className="bg-[var(--agora-accent)] py-20 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ background: "var(--agora-primary)" }}
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ background: "var(--agora-gold)" }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <Reveal className="text-center mb-14">
              <span className="inline-block text-xs uppercase tracking-[0.2em] text-[var(--agora-primary)] font-semibold mb-3">
                Témoignages
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[var(--agora-ink)]">
                Ils en parlent mieux que nous
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <Reveal key={t.name} delay={idx * 120}>
                  <div className="agora-lift relative bg-white rounded-2xl p-7 border border-[var(--agora-line)] h-full flex flex-col">
                    <Quote
                      className="absolute top-5 right-5 w-10 h-10 opacity-10"
                      style={{ color: t.accent }}
                    />
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-current"
                          style={{ color: t.accent }}
                        />
                      ))}
                    </div>
                    <p className="text-[var(--agora-ink)] leading-relaxed mb-6 flex-1">
                      “{t.quote}”
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-[var(--agora-line)]">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-white"
                        style={{ background: t.accent }}
                      >
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--agora-ink)] text-sm">
                          {t.name}
                        </div>
                        <div className="text-xs text-[var(--agora-mid)]">
                          {t.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section> */}

        {/* ============================================ */}
        {/* SELLER CTA                                    */}
        {/* ============================================ */}
        {showBoutiqueButton && (
          <section className="relative bg-[var(--agora-ink)] py-20 overflow-hidden">
            {/* Mesh */}
            <div
              aria-hidden
              className="agora-blob absolute top-0 left-10 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
              style={{
                background:
                  "radial-gradient(circle, #5c6bc0 0%, transparent 65%)",
              }}
            />
            <div
              aria-hidden
              className="agora-blob absolute bottom-0 right-10 w-[380px] h-[380px] rounded-full blur-3xl opacity-30"
              style={{
                background:
                  "radial-gradient(circle, #ffa726 0%, transparent 65%)",
                animationDelay: "5s",
              }}
            />

            <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
              <Reveal>
                <div className="bg-gradient-to-br from-[#5c6bc0] to-[#3949ab] rounded-3xl px-8 sm:px-14 py-14 relative overflow-hidden">
                  {/* Sparkle decorations */}
                  <div
                    aria-hidden
                    className="absolute top-8 right-12 w-2 h-2 rounded-full bg-[var(--agora-gold)] agora-twinkle"
                  />
                  <div
                    aria-hidden
                    className="absolute bottom-12 right-32 w-1.5 h-1.5 rounded-full bg-white agora-twinkle"
                    style={{ animationDelay: "1s" }}
                  />
                  <div
                    aria-hidden
                    className="absolute top-20 right-48 w-1 h-1 rounded-full bg-white agora-twinkle"
                    style={{ animationDelay: "1.6s" }}
                  />

                  <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
                        <Briefcase className="w-3.5 h-3.5 text-[var(--agora-gold)]" />
                        <span className="text-xs uppercase tracking-widest text-white/90">
                          Espace créateur
                        </span>
                      </div>
                      <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                        Vous êtes artisan ou créateur ?
                      </h2>
                      <p className="text-white/80 mb-8 leading-relaxed text-lg">
                        Rejoignez Agora et faites rayonner vos créations auprès
                        de milliers de clients passionnés. Inscription gratuite,
                        commissions réduites, support dédié.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                          href={boutiqueHref}
                          className="agora-shine relative overflow-hidden inline-flex items-center justify-center gap-2 bg-[var(--agora-gold)] hover:bg-[#fb8c00] text-[var(--agora-ink)] px-7 py-3.5 rounded-xl font-semibold transition-colors"
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {boutiqueLabel}
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        </Link>
                        <Link
                          href="/catalogue"
                          className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/30 text-white px-7 py-3.5 rounded-xl font-medium transition-colors"
                        >
                          Voir les boutiques
                        </Link>
                      </div>
                    </div>

                    {/* Mini illustration — animated package */}
                    <div className="hidden md:flex items-center justify-center">
                      <svg
                        viewBox="0 0 240 240"
                        className="w-full max-w-[240px] agora-float-mid"
                        aria-hidden
                      >
                        <defs>
                          <linearGradient
                            id="ctaBoxGrad"
                            x1="0"
                            x2="1"
                            y1="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#ffa726" />
                            <stop offset="100%" stopColor="#fb8c00" />
                          </linearGradient>
                        </defs>
                        <ellipse
                          cx="120"
                          cy="210"
                          rx="80"
                          ry="8"
                          fill="#000"
                          opacity="0.25"
                        />
                        <rect
                          x="50"
                          y="80"
                          width="140"
                          height="120"
                          rx="10"
                          fill="url(#ctaBoxGrad)"
                        />
                        <rect
                          x="50"
                          y="80"
                          width="140"
                          height="28"
                          rx="10"
                          fill="#fb8c00"
                        />
                        <rect
                          x="112"
                          y="80"
                          width="16"
                          height="120"
                          fill="#ffffff"
                          opacity="0.9"
                        />
                        <path
                          d="M120 80 q-14 -16 0 -32 q14 16 0 32 z"
                          fill="#ffffff"
                          opacity="0.95"
                        />
                        <path
                          d="M120 80 q14 -16 0 -32 q-14 16 0 32 z"
                          fill="#e8eaf6"
                        />
                        {/* Sparkles */}
                        <circle
                          cx="40"
                          cy="60"
                          r="3"
                          fill="#ffa726"
                          className="agora-twinkle"
                        />
                        <circle
                          cx="200"
                          cy="50"
                          r="3"
                          fill="#ffffff"
                          className="agora-twinkle"
                          style={{ animationDelay: "0.7s" }}
                        />
                        <circle
                          cx="210"
                          cy="160"
                          r="3"
                          fill="#ffa726"
                          className="agora-twinkle"
                          style={{ animationDelay: "1.3s" }}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
