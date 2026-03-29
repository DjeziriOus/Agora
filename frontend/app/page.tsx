"use client";

import Link from "next/link";
import { Diamond, ArrowRight, ShoppingBag, Store, Shield } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { mockProducts, mockCategories } from "@/lib/mockData";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
  const featuredProducts = mockProducts.slice(0, 8);
  const featuredCategories = mockCategories.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col">
            <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#0d1a44] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.88))]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1580281657527-0d8eae13aa96?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-20" />
          <div className="absolute inset-0 bg-grid-pattern opacity-25" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <p className="mb-4 inline-flex items-center justify-center gap-2 rounded-full bg-[rgba(255,255,255,0.15)] px-4 py-1 text-xs uppercase tracking-wider text-white/90">
              <Diamond className="w-4 h-4" />
              La marketplace française
            </p>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)]">
              Bienvenue sur Agora
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base text-white/75 sm:text-lg lg:text-xl">
              La marketplace multi-boutiques française. Découvrez des créateurs passionnés et des produits artisanaux uniques.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/catalogue"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--agora-primary)] px-8 py-3 text-base font-semibold text-white transition hover:bg-[var(--agora-primary-hover)]"
              >
                Découvrir les produits
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vendeur"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-white/30 bg-white/10 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/20"
              >
                Ouvrir ma boutique
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--agora-ink)]">Catégories populaires</h2>
            <Link href="/catalogue" className="text-[var(--agora-primary)] hover:underline">Voir tout</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                href={`/catalogue?q=&category=${encodeURIComponent(category.name)}`}
                className="group rounded-[var(--radius-lg)] border border-[var(--agora-line)] bg-[var(--agora-surface)] p-5 transition hover:border-[var(--agora-primary)]"
              >
                <div className="text-3xl mb-2">{categoryIcons[category.name] || "📦"}</div>
                <h3 className="font-semibold text-[var(--agora-ink)]">{category.name}</h3>
                <p className="text-sm text-[var(--agora-mid)]">{category.productCount} produits</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="bg-[var(--agora-accent)] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[var(--agora-ink)]">Produits en vedette</h2>
              <Link href="/catalogue" className="text-[var(--agora-primary)] hover:underline">Voir tout</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-[#f4f6fd] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold text-[var(--agora-ink)] mb-8">Comment ça marche</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[var(--radius-lg)] border border-[var(--agora-line)] bg-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--agora-primary)] text-white">1</div>
                <h3 className="font-semibold text-lg">Créez votre compte</h3>
                <p className="mt-2 text-sm text-[var(--agora-mid)]">Inscrivez-vous gratuitement en quelques secondes pour commencer vos achats.</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--agora-line)] bg-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--agora-primary)] text-white">2</div>
                <h3 className="font-semibold text-lg">Parcourez le catalogue</h3>
                <p className="mt-2 text-sm text-[var(--agora-mid)]">Explorez des centaines de boutiques et trouvez des produits uniques.</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--agora-line)] bg-white p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--agora-primary)] text-white">3</div>
                <h3 className="font-semibold text-lg">Commandez en toute sécurité</h3>
                <p className="mt-2 text-sm text-[var(--agora-mid)]">Paiement sécurisé et suivi de livraison pour chaque commande.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Creator CTA */}
        <section className="bg-[var(--agora-primary)] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-3">Vous êtes artisan ou créateur ?</h2>
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/90 mb-6">
              Rejoignez Agora et vendez vos créations à des milliers de clients. inscription gratuite, commissions réduites.
            </p>
            <Link
              href="/vendeur/produits"
              className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-white px-8 py-3 text-[var(--agora-primary)] font-semibold hover:bg-white/90 transition"
            >
              Ouvrir ma boutique gratuitement
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
