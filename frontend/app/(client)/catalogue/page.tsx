"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Grid3X3, List, X, ChevronDown, ChevronUp } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonProductGrid } from "@/components/SkeletonCard";
import { EmptyState } from "@/components/EmptyState";
import { StarRating } from "@/components/StarRating";
import { mockProducts, mockCategories, mockStores, filterProducts } from "@/lib/mockData";
import { cn } from "@/lib/utils";

type SortOption = "relevance" | "price_asc" | "price_desc" | "rating";
type ViewMode = "grid" | "list";

interface FilterState {
  minPrice: number;
  maxPrice: number;
  categories: string[];
  stores: string[];
  minRating: number;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Pertinence" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "rating", label: "Meilleures notes" },
];

function CatalogueContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    category: true,
    store: true,
    rating: true,
  });
  
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 500,
    categories: categoryParam ? [categoryParam] : [],
    stores: [],
    minRating: 0,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const resetFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: 500,
      categories: [],
      stores: [],
      minRating: 0,
    });
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = filterProducts({
      minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice < 500 ? filters.maxPrice : undefined,
      category: filters.categories.length === 1 ? filters.categories[0] : undefined,
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
    });

    // Additional category filter for multiple selections
    if (filters.categories.length > 1) {
      products = products.filter((p) => filters.categories.includes(p.category));
    }

    // Store filter
    if (filters.stores.length > 0) {
      products = products.filter((p) => filters.stores.includes(p.storeId));
    }

    // Sort
    switch (sortBy) {
      case "price_asc":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        products.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        products.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // relevance - keep original order
        break;
    }

    return products;
  }, [filters, sortBy]);

  const hasActiveFilters =
    filters.minPrice > 0 ||
    filters.maxPrice < 500 ||
    filters.categories.length > 0 ||
    filters.stores.length > 0 ||
    filters.minRating > 0;

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
              filters={filters}
              setFilters={setFilters}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              resetFilters={resetFilters}
              hasActiveFilters={hasActiveFilters}
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
                  {filteredProducts.length} produit{filteredProducts.length !== 1 ? "s" : ""} trouvé{filteredProducts.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
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
                        : "text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
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
                        : "text-[var(--agora-mid)] hover:text-[var(--agora-ink)]"
                    )}
                    aria-label="Vue liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div
                className={cn(
                  "grid gap-6",
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                )}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
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
                filters={filters}
                setFilters={setFilters}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
                resetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
            <div className="p-4 border-t border-[var(--agora-line)]">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-full py-3 bg-[var(--agora-primary)] text-white rounded-[var(--radius-md)] font-medium hover:bg-[var(--agora-primary-hover)] transition-colors"
              >
                Voir {filteredProducts.length} résultat{filteredProducts.length !== 1 ? "s" : ""}
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
    <Suspense fallback={<div className="min-h-screen bg-[var(--agora-bg)] flex items-center justify-center p-8"><div className="w-8 h-8 border-4 border-[var(--agora-primary)] border-t-transparent rounded-full animate-spin" /></div>}>
      <CatalogueContent />
    </Suspense>
  );
}

// Filter Panel Component
function FilterPanel({
  filters,
  setFilters,
  expandedSections,
  toggleSection,
  resetFilters,
  hasActiveFilters,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}) {
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
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    minPrice: Math.max(0, parseInt(e.target.value) || 0),
                  }))
                }
                className="w-full px-3 py-2 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-sm"
                min={0}
              />
            </div>
            <span className="text-[var(--agora-mid)] mt-5">—</span>
            <div className="flex-1">
              <label className="text-xs text-[var(--agora-mid)] mb-1 block">
                Max (€)
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    maxPrice: Math.max(0, parseInt(e.target.value) || 500),
                  }))
                }
                className="w-full px-3 py-2 border border-[var(--agora-line)] rounded-[var(--radius-md)] text-sm"
                min={0}
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
          {mockCategories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 py-1 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.categories.includes(category.name)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters((f) => ({
                      ...f,
                      categories: [...f.categories, category.name],
                    }));
                  } else {
                    setFilters((f) => ({
                      ...f,
                      categories: f.categories.filter((c) => c !== category.name),
                    }));
                  }
                }}
                className="w-4 h-4 rounded border-[var(--agora-line)] text-[var(--agora-primary)] focus:ring-[var(--agora-primary)]"
              />
              <span className="text-sm text-[var(--agora-ink)] group-hover:text-[var(--agora-primary)] transition-colors flex-1">
                {category.name}
              </span>
              <span className="text-xs text-[var(--agora-mid)] bg-[var(--agora-accent)] px-2 py-0.5 rounded-full">
                {category.productCount}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Store Filter */}
      <FilterSection
        title="Boutique"
        isExpanded={expandedSections.store}
        onToggle={() => toggleSection("store")}
      >
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {mockStores.map((store) => (
            <label
              key={store.id}
              className="flex items-center gap-3 py-1 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.stores.includes(store.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters((f) => ({
                      ...f,
                      stores: [...f.stores, store.id],
                    }));
                  } else {
                    setFilters((f) => ({
                      ...f,
                      stores: f.stores.filter((s) => s !== store.id),
                    }));
                  }
                }}
                className="w-4 h-4 rounded border-[var(--agora-line)] text-[var(--agora-primary)] focus:ring-[var(--agora-primary)]"
              />
              <span className="text-sm text-[var(--agora-ink)] group-hover:text-[var(--agora-primary)] transition-colors flex-1 truncate">
                {store.name}
              </span>
              <span className="text-xs text-[var(--agora-mid)] bg-[var(--agora-accent)] px-2 py-0.5 rounded-full">
                {store.productCount}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection
        title="Note"
        isExpanded={expandedSections.rating}
        onToggle={() => toggleSection("rating")}
      >
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-3 py-1 cursor-pointer group"
            >
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === rating}
                onChange={() => setFilters((f) => ({ ...f, minRating: rating }))}
                className="w-4 h-4 border-[var(--agora-line)] text-[var(--agora-primary)] focus:ring-[var(--agora-primary)]"
              />
              <StarRating rating={rating} size="sm" />
              <span className="text-sm text-[var(--agora-mid)]">et plus</span>
            </label>
          ))}
          {filters.minRating > 0 && (
            <button
              onClick={() => setFilters((f) => ({ ...f, minRating: 0 }))}
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
