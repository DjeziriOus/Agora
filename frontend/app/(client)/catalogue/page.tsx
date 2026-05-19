"use client";

import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonProductGrid } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { useProducts } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import type { ProductQuery } from "@/types";

type SortOption = "relevance" | "price_asc" | "price_desc" | "rating";
type ViewMode = "grid" | "list";

const PRODUCTS_PER_PAGE = 12;

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "rating", label: "Meilleures notes" },
];

function CatalogueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get("category") || "";
  const queryParam = searchParams.get("q") || "";
  const pageParam = searchParams.get("page") || "1";
  const sortParam = (searchParams.get("sort") || "relevance") as SortOption;
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    price: true,
    category: true,
    rating: true,
  });

  // Build the API query from URL search params
  const apiQuery: ProductQuery = useMemo(() => {
    const q: ProductQuery = {
      page: pageParam,
      limit: String(PRODUCTS_PER_PAGE),
    };
    if (queryParam) q.q = queryParam;
    if (categoryParam) q.category = categoryParam;
    if (sortParam && sortParam !== "relevance") q.sort = sortParam;
    if (minPriceParam) q.minPrice = minPriceParam;
    if (maxPriceParam) q.maxPrice = maxPriceParam;
    return q;
  }, [
    pageParam,
    queryParam,
    categoryParam,
    sortParam,
    minPriceParam,
    maxPriceParam,
  ]);

  const { data: productsResponse, isLoading, isError } = useProducts(apiQuery);

  // Fetch all products once (no filters) to extract available categories
  const { data: allProductsResponse } = useProducts({ limit: "100" });
  const allProducts = allProductsResponse?.products ?? [];

  const products = productsResponse?.products ?? [];
  const total = productsResponse?.total ?? 0;
  const currentPage = productsResponse?.page ?? 1;
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  // Build categories dynamically from ALL products (not just current page)
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    allProducts.forEach((p) =>
      map.set(p.category, (map.get(p.category) ?? 0) + 1),
    );
    return Array.from(map.entries()).map(([name, count], i) => ({
      id: `${i}`,
      name,
      productCount: count,
    }));
  }, [allProducts]);

  // Update URL params helper
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "" || value === "0") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 when any filter changes (except page itself)
      if (!("page" in updates)) {
        params.delete("page");
      }
      router.push(`/catalogue?${params.toString()}`);
    },
    [searchParams, router],
  );

  const handlePageChange = (page: number) => {
    updateParams({ page: page === 1 ? undefined : String(page) });
  };

  const handleSortChange = (sort: SortOption) => {
    updateParams({ sort: sort === "relevance" ? undefined : sort });
  };

  const handleCategoryToggle = (cat: string) => {
    updateParams({ category: categoryParam === cat ? undefined : cat });
  };

  const handlePriceChange = (min: string, max: string) => {
    updateParams({
      minPrice: min && Number(min) > 0 ? min : undefined,
      maxPrice: max && Number(max) < 10000 ? max : undefined,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const resetFilters = () => {
    router.push("/catalogue");
  };

  const hasActiveFilters =
    !!categoryParam || !!minPriceParam || !!maxPriceParam || !!queryParam;

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--agora-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-[var(--agora-ink)]">
              Catalogue
            </h1>
            <p className="text-[var(--agora-mid)] mt-1">
              Découvrez notre sélection de produits artisanaux
            </p>
          </div>
          <SkeletonProductGrid />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--agora-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-[var(--agora-ink)]">
            Catalogue
          </h1>
          <p className="text-[var(--agora-mid)] mt-1">
            Découvrez notre sélection de produits artisanaux
          </p>
        </div>

        <div className="flex gap-8">
          {/* Filter Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterPanel
              selectedCategory={categoryParam}
              onCategoryToggle={handleCategoryToggle}
              minPrice={minPriceParam}
              maxPrice={maxPriceParam}
              onPriceChange={handlePriceChange}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              resetFilters={resetFilters}
              hasActiveFilters={hasActiveFilters}
              categories={categories}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6 bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-4">
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--agora-mid)] hover:text-[var(--agora-ink)] hover:border-[var(--agora-primary)] transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-[var(--agora-primary)]" />
                  )}
                </button>

                <span className="text-sm text-[var(--agora-mid)]">
                  {total} produit{total !== 1 ? "s" : ""} trouvé
                  {total !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <select
                  value={sortParam}
                  onChange={(e) =>
                    handleSortChange(e.target.value as SortOption)
                  }
                  className="px-3 py-2 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-sm text-[var(--agora-ink)] bg-[var(--agora-surface)] focus:outline-none focus:border-[var(--agora-primary)] cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center border border-[var(--agora-line)] rounded-[var(--radius-md)] overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid"
                        ? "bg-[var(--agora-primary)] text-white"
                        : "text-[var(--agora-mid)] hover:text-[var(--agora-ink)]",
                    )}
                    aria-label="Vue grille"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "list"
                        ? "bg-[var(--agora-primary)] text-white"
                        : "text-[var(--agora-mid)] hover:text-[var(--agora-ink)]",
                    )}
                    aria-label="Vue liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {isError ? (
              <EmptyState
                type="search"
                title="Erreur de chargement"
                description="Impossible de charger les produits pour le moment."
              />
            ) : isLoading ? (
              <SkeletonProductGrid
                count={PRODUCTS_PER_PAGE}
                className={cn(
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "grid-cols-1 gap-6",
                )}
              />
            ) : products.length > 0 ? (
              <>
                <div
                  className={cn(
                    "grid gap-6",
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1",
                  )}
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <EmptyState
                type="search"
                title="Aucun produit trouvé"
                description="Essayez de modifier vos filtres pour trouver ce que vous cherchez."
                action={{
                  label: "Réinitialiser les filtres",
                  onClick: resetFilters,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[var(--agora-surface)] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--agora-line)]">
              <h2 className="font-display font-semibold text-lg text-[var(--agora-ink)]">
                Filtres
              </h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel
                selectedCategory={categoryParam}
                onCategoryToggle={(cat) => {
                  handleCategoryToggle(cat);
                  setIsFilterOpen(false);
                }}
                minPrice={minPriceParam}
                maxPrice={maxPriceParam}
                onPriceChange={(min, max) => {
                  handlePriceChange(min, max);
                  setIsFilterOpen(false);
                }}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                resetFilters={() => {
                  resetFilters();
                  setIsFilterOpen(false);
                }}
                hasActiveFilters={hasActiveFilters}
                categories={categories}
              />
            </div>
            <div className="p-4 border-t border-[var(--agora-line)]">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-3 bg-[var(--agora-primary)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--agora-primary-hover)] transition-colors"
              >
                Voir les résultats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-[var(--agora-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CatalogueContent />
    </Suspense>
  );
}

// Filter Panel Component
function FilterPanel({
  selectedCategory,
  onCategoryToggle,
  minPrice,
  maxPrice,
  onPriceChange,
  expandedSections,
  toggleSection,
  resetFilters,
  hasActiveFilters,
  categories,
}: {
  selectedCategory: string;
  onCategoryToggle: (category: string) => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  categories: { id: string; name: string; productCount: number }[];
}) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  // Sync local state with URL params
  useEffect(() => {
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [minPrice, maxPrice]);

  // Debounced price application
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localMin !== minPrice || localMax !== maxPrice) {
        onPriceChange(localMin, localMax);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localMin, localMax, minPrice, maxPrice, onPriceChange]);

  return (
    <div className="bg-[var(--agora-surface)] border border-[var(--agora-line)] rounded-[var(--radius-lg)] p-4 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-[var(--agora-ink)]">
          Filtres
        </h2>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-[var(--agora-primary)] hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Price Filter */}
      <FilterSection
        title="Prix"
        isExpanded={expandedSections.price}
        onToggle={() => toggleSection("price")}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--agora-mid)] mb-1 block">
                Min (€)
              </label>
              <input
                type="number"
                value={localMin}
                onChange={(e) => {
                  const raw = e.target.value;
                  const sanitized = raw === "" ? "" : String(Math.max(0, Number(raw)));
                  setLocalMin(sanitized);
                  if (localMax !== "" && sanitized !== "" && Number(sanitized) > Number(localMax)) {
                    setLocalMax(sanitized);
                  }
                }}
                onKeyDown={(e) => {
                  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
                }}
                className="w-full px-3 py-2 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-sm"
                min={0}
                placeholder="0"
              />
            </div>
            <span className="text-[var(--agora-mid)] mt-5">—</span>
            <div className="flex-1">
              <label className="text-xs text-[var(--agora-mid)] mb-1 block">
                Max (€)
              </label>
              <input
                type="number"
                value={localMax}
                onChange={(e) => {
                  const raw = e.target.value;
                  const sanitized = raw === "" ? "" : String(Math.max(0, Number(raw)));
                  if (sanitized !== "" && localMin !== "" && Number(sanitized) < Number(localMin)) {
                    setLocalMax(localMin);
                  } else {
                    setLocalMax(sanitized);
                  }
                }}
                onKeyDown={(e) => {
                  if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
                }}
                className="w-full px-3 py-2 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-sm"
                min={0}
                placeholder="10000"
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Category Filter */}
      <FilterSection
        title="Catégorie"
        isExpanded={expandedSections.category}
        onToggle={() => toggleSection("category")}
      >
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 py-1 cursor-pointer group"
            >
              <input
                type="radio"
                name="category"
                checked={selectedCategory === category.name}
                onChange={() => onCategoryToggle(category.name)}
                className="w-4 h-4 border-[var(--agora-line)] text-[var(--agora-primary)] focus:ring-[var(--agora-primary)]"
              />
              <span className="text-sm text-[var(--agora-ink)] group-hover:text-[var(--agora-primary)] transition-colors flex-1">
                {category.name}
              </span>
              <span className="text-xs text-[var(--agora-mid)] bg-[var(--agora-accent)] px-2 py-0.5 rounded-full">
                {category.productCount}
              </span>
            </label>
          ))}
          {selectedCategory && (
            <button
              onClick={() => onCategoryToggle(selectedCategory)}
              className="text-sm text-[var(--agora-primary)] hover:underline mt-2"
            >
              Effacer
            </button>
          )}
        </div>
      </FilterSection>
    </div>
  );
}

// Filter Section Component
function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--agora-line)] py-4 last:border-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-sm text-[var(--agora-ink)]">
          {title}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--agora-mid)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--agora-mid)]" />
        )}
      </button>
      {isExpanded && <div className="mt-3">{children}</div>}
    </div>
  );
}
