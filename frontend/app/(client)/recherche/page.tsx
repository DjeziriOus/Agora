"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/EmptyState";
import { mockProducts, mockCategories } from "@/lib/mockData";
import Link from "next/link";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  
  const [searchInput, setSearchInput] = useState(query);

  // Update search input when URL changes
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== query) {
        if (searchInput.trim()) {
          router.push(`/recherche?q=${encodeURIComponent(searchInput.trim())}`);
        } else if (query) {
          router.push("/recherche");
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, query, router]);

  // Filter products based on search query
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return mockProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.storeName.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const handleClearSearch = () => {
    setSearchInput("");
    router.push("/recherche");
  };

  return (
    <div className="min-h-screen bg-[var(--agora-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--agora-ink)] mb-6">
            Recherche
          </h1>
          
          {/* Search Input */}
          <div className="relative max-w-2xl">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher des produits, boutiques, catégories..."
              className="w-full pl-12 pr-10 py-4 border border-[var(--agora-line)] rounded-[var(--radius-lg)] text-[var(--agora-ink)] placeholder:text-[var(--agora-text-disabled)] focus:outline-none focus:border-[var(--agora-primary)] focus:ring-2 focus:ring-[var(--agora-primary)]/20 transition-colors bg-[var(--agora-surface)]"
              autoFocus
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--agora-mid)]" />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {query.trim() ? (
          <>
            {/* Results Count */}
            <p className="text-[var(--agora-mid)] mb-6">
              {results.length} résultat{results.length !== 1 ? "s" : ""} pour «{" "}
              <span className="font-medium text-[var(--agora-ink)]">{query}</span> »
            </p>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState
                type="search"
                title={`Aucun résultat pour « ${query} »`}
                description="Essayez avec d'autres termes de recherche ou parcourez nos catégories."
              />
            )}

            {/* Suggested Categories when no results */}
            {results.length === 0 && (
              <div className="mt-8">
                <h3 className="font-display font-semibold text-lg text-[var(--agora-ink)] mb-4">
                  Catégories suggérées
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mockCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/catalogue?category=${encodeURIComponent(category.name)}`}
                      className="px-4 py-2 bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-full text-sm text-[var(--agora-mid)] hover:text-[var(--agora-primary)] hover:border-[var(--agora-primary)] transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State - No Search Query */
          <div className="py-12">
            <EmptyState
              type="search"
              title="Commencez votre recherche"
              description="Tapez un mot-clé pour trouver des produits, boutiques ou catégories."
            />

            {/* Popular Categories */}
            <div className="mt-8 max-w-2xl mx-auto">
              <h3 className="font-display font-semibold text-lg text-[var(--agora-ink)] mb-4 text-center">
                Catégories populaires
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {mockCategories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    href={`/catalogue?category=${encodeURIComponent(category.name)}`}
                    className="px-4 py-2 bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-full text-sm text-[var(--agora-mid)] hover:text-[var(--agora-primary)] hover:border-[var(--agora-primary)] transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--agora-bg)]" />}>
      <SearchPageContent />
    </Suspense>
  );
}
