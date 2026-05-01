"use client";

import { Fragment, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMyStore, useSellerProducts, useStockStats } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { SellerShopRequiredState } from "@/components/SellerShopRequiredState";
import { Pagination } from "@/components/Pagination";
import { isMissingSellerShopError } from "@/lib/shopErrors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Search,
  TriangleAlert,
  CircleX,
  ChevronDown,
  ChevronRight,
  Boxes,
} from "lucide-react";
import type { Product } from "@/types";

type VariantStockLine = {
  key: string;
  sku: string;
  stock: number;
  threshold: number;
  price: number;
  variantName: string;
};

type ProductStockGroup = {
  productId: string;
  productName: string;
  image?: string;
  category: string;
  stock: number;
  threshold: number;
  price: number;
  variants: VariantStockLine[];
};

type StockLine = {
  productId: string;
  productName: string;
  image?: string;
  category: string;
  sku: string;
  stock: number;
  threshold: number;
  price: number;
  variantName?: string;
};

const getStockStatus = (stock: number, threshold: number) => {
  if (stock <= 0) {
    return {
      label: "Rupture",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    };
  }

  if (stock <= threshold) {
    return {
      label: "Stock faible",
      className: "bg-agora-warning/10 text-agora-warning border-agora-warning/20",
    };
  }

  return {
    label: "En stock",
    className: "bg-agora-success/10 text-agora-success border-agora-success/20",
  };
};

const buildStockGroups = (products: Product[]): ProductStockGroup[] => {
  return products.map((product) => {
    const image = product.images?.[0];
    const variants: VariantStockLine[] = (product.variants ?? []).map((variant) => ({
      key: `${product.id}-${variant.code}`,
      sku: variant.sku || variant.code,
      stock: variant.stock ?? 0,
      threshold: product.stockThreshold ?? 5,
      price: variant.price ?? 0,
      variantName: variant.name,
    }));

    const totalStock =
      variants.length > 0
        ? variants.reduce((sum, variant) => sum + variant.stock, 0)
        : product.totalStock ?? 0;

    return {
      productId: product.id,
      productName: product.name,
      image,
      category: product.category || "Sans categorie",
      stock: totalStock,
      threshold: product.stockThreshold ?? 5,
      price: product.displayPrice ?? 0,
      variants,
    };
  });
};

const flattenVisibleLines = (groups: ProductStockGroup[]): StockLine[] => {
  return groups.flatMap((group) => {
    if (group.variants.length === 0) {
      return [
        {
          productId: group.productId,
          productName: group.productName,
          image: group.image,
          category: group.category,
          sku: "-",
          stock: group.stock,
          threshold: group.threshold,
          price: group.price,
        },
      ];
    }

    return group.variants.map((variant) => ({
      productId: group.productId,
      productName: group.productName,
      image: group.image,
      category: group.category,
      sku: variant.sku,
      stock: variant.stock,
      threshold: variant.threshold,
      price: variant.price,
      variantName: variant.variantName,
    }));
  });
};

const PRODUCTS_PER_PAGE = 10;

export default function VendorStockPage() {
  const {
    data: store,
    isLoading: isStoreLoading,
    error: storeError,
  } = useMyStore();
  const hasStore = Boolean(store);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useSellerProducts(
    { 
      page: String(page), 
      limit: String(PRODUCTS_PER_PAGE),
      ...(debouncedSearch ? { q: debouncedSearch } : {}) 
    },
    { enabled: hasStore },
  );
  const { data: stockStats, isLoading: isStatsLoading } = useStockStats({
    enabled: hasStore,
  });

  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const products: Product[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.products ?? []);
  }, [data]);
  const total = (data && !Array.isArray(data)) ? data.total ?? 0 : products.length;
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  const stockGroups = useMemo(() => buildStockGroups(products), [products]);

  const filteredGroups = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return stockGroups;

    return stockGroups
      .map((group) => {
        const productMatched =
          group.productName.toLowerCase().includes(keyword) ||
          group.category.toLowerCase().includes(keyword);

        if (group.variants.length === 0) {
          return productMatched ? group : null;
        }

        const matchedVariants = group.variants.filter((variant) => {
          return (
            variant.variantName.toLowerCase().includes(keyword) ||
            variant.sku.toLowerCase().includes(keyword)
          );
        });

        if (productMatched) {
          return group;
        }

        if (matchedVariants.length > 0) {
          return {
            ...group,
            variants: matchedVariants,
          };
        }

        return null;
      })
      .filter((group): group is ProductStockGroup => group !== null);
  }, [search, stockGroups]);

  const visibleLines = useMemo(() => flattenVisibleLines(filteredGroups), [filteredGroups]);

  const toggleExpanded = (productId: string) => {
    setExpandedProducts((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const inStockCount = stockStats?.inStockCount ?? 0;
  const lowStockCount = stockStats?.lowStockCount ?? 0;
  const outOfStockCount = stockStats?.outOfStockCount ?? 0;

  if (isStoreLoading || (hasStore && isLoading) || isStatsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (isMissingSellerShopError(storeError)) {
    return <SellerShopRequiredState />;
  }

  if (storeError) {
    return (
      <EmptyState
        icon={<Boxes className="w-12 h-12" />}
        title="Erreur de chargement"
        description="Impossible de charger votre boutique."
        action={{ label: "Retour aux produits", href: "/vendeur/produits" }}
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Boxes className="w-12 h-12" />}
        title="Erreur de chargement"
        description="Impossible de charger les donnees de stock."
        action={{ label: "Retour aux produits", href: "/vendeur/produits" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Gestion du stock
        </h1>
        <p className="text-muted-foreground mt-1">
          Suivez le stock de vos produits et variantes.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un produit, une categorie, un SKU..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Produits en stock</p>
                <p className="text-2xl font-semibold mt-1">{inStockCount}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock faible</p>
                <p className="text-2xl font-semibold mt-1 text-agora-warning">
                  {lowStockCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-agora-warning/10 flex items-center justify-center">
                <TriangleAlert className="h-5 w-5 text-agora-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En rupture de stock</p>
                <p className="text-2xl font-semibold mt-1 text-destructive">
                  {outOfStockCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <CircleX className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste du stock</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredGroups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => {
                  const productStatus = getStockStatus(group.stock, group.threshold);
                  const isExpanded = expandedProducts.has(group.productId);
                  const hasVariants = group.variants.length > 0;
                  const minPrice = hasVariants
                    ? Math.min(...group.variants.map((variant) => variant.price))
                    : group.price;
                  const maxPrice = hasVariants
                    ? Math.max(...group.variants.map((variant) => variant.price))
                    : group.price;

                  return (
                    <Fragment key={group.productId}>
                      <TableRow key={`${group.productId}-parent`} className="bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[240px]">
                            {hasVariants ? (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(group.productId)}
                                className="h-6 w-6 rounded-md border flex items-center justify-center"
                                aria-label={
                                  isExpanded
                                    ? "Replier les variantes"
                                    : "Afficher les variantes"
                                }
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    isExpanded ? "rotate-0" : "-rotate-90"
                                  }`}
                                />
                              </button>
                            ) : (
                              <span className="h-6 w-6 shrink-0" aria-hidden="true" />
                            )}
                            <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0">
                              {group.image ? (
                                <Image
                                  src={group.image}
                                  alt={group.productName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{group.productName}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {hasVariants
                                  ? `${group.variants.length} variante${
                                      group.variants.length > 1 ? "s" : ""
                                    }`
                                  : "Sans variante"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{group.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={productStatus.className}>
                            {productStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {group.stock}
                        </TableCell>
                        <TableCell>
                          {typeof minPrice === "number" && !isNaN(minPrice)
                            ? minPrice.toFixed(2)
                            : "--"}
                          {maxPrice !== minPrice && typeof maxPrice === "number" && !isNaN(maxPrice)
                            ? ` - ${maxPrice.toFixed(2)}`
                            : ""}
                          €
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/vendeur/produits/${group.productId}`}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            Modifier
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>

                      {hasVariants && isExpanded
                        ? group.variants.map((variant) => {
                            const status = getStockStatus(variant.stock, variant.threshold);

                            return (
                              <TableRow key={variant.key}>
                                <TableCell>
                                  <div className="pl-11">
                                    <p className="font-medium truncate">{variant.variantName}</p>
                                    <p className="text-xs text-muted-foreground">Variant</p>
                                  </div>
                                </TableCell>
                                <TableCell>{variant.sku}</TableCell>
                                <TableCell>{group.category}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={status.className}>
                                    {status.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{variant.stock}</TableCell>
                                <TableCell>{variant.price.toFixed(2)} €</TableCell>
                                <TableCell className="text-right">
                                  <Link
                                    href={`/vendeur/produits/${group.productId}`}
                                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                  >
                                    Modifier
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Boxes className="w-10 h-10" />}
                title="Aucun resultat"
                description="Aucun produit/variant ne correspond a votre recherche."
                action={{ label: "Voir mes produits", href: "/vendeur/produits" }}
              />
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
