"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  useSellerProducts,
  useToggleProductActive,
  useDeleteProduct,
  useMyStore,
} from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const PRODUCTS_PER_PAGE = 10;

function VendorProductsContent() {
  const searchParams = useSearchParams();
  const filterLowStock = searchParams.get("filter") === "low-stock";

  const {
    data: store,
    isLoading: isStoreLoading,
    error: storeError,
  } = useMyStore();
  const hasStore = Boolean(store);
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useSellerProducts(
    { page: String(page), limit: String(PRODUCTS_PER_PAGE) },
    { enabled: hasStore },
  );
  const toggleActive = useToggleProductActive();
  const deleteProduct = useDeleteProduct();

  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const products = Array.isArray(data)
    ? data
    : data?.products || [];
  const total = (data && !Array.isArray(data)) ? data.total ?? 0 : products.length;
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  // Filter products (client-side search within current page)
  let filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (filterLowStock) {
    filteredProducts = filteredProducts.filter((p) => p.totalStock <= (p.stockThreshold ?? 5));
  }

  const handleToggleActive = async (
    productId: string,
    currentIsActive: boolean,
  ) => {
    try {
      await toggleActive.mutateAsync({
        id: productId,
        isActive: !currentIsActive,
      });
      toast.success("Statut du produit mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct.mutateAsync(productToDelete);
      toast.success("Produit supprimé");
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isStoreLoading || (hasStore && isLoading)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (isMissingSellerShopError(storeError)) {
    return <SellerShopRequiredState />;
  }

  if (storeError) {
    return (
      <EmptyState
        icon={<Package className="w-12 h-12" />}
        title="Erreur de chargement"
        description="Impossible de charger votre boutique."
        action={{
          label: "Réessayer",
          href: "/vendeur/produits",
        }}
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Package className="w-12 h-12" />}
        title="Erreur de chargement"
        description="Impossible de charger vos produits."
        action={{
          label: "Réessayer",
          href: "/vendeur/produits",
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header — use total from backend for accurate count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Mes produits
          </h1>
          <p className="text-muted-foreground mt-1">
            {total} produit{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button asChild>
          <Link href="/vendeur/produits/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {filterLowStock && (
              <Button variant="outline" asChild>
                <Link href="/vendeur/produits">
                  <AlertTriangle className="mr-2 h-4 w-4 text-agora-warning" />
                  Stock faible ({filteredProducts.length})
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      {filteredProducts.length > 0 ? (
        <>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {product.category || "Sans catégorie"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {product.hasMultiplePrices && (
                          <span className="text-xs font-normal text-muted-foreground mr-1">À partir de</span>
                        )}
                        {product.displayPrice.toFixed(2)} €
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          product.totalStock <= (product.stockThreshold ?? 5)
                            ? "text-agora-warning"
                            : product.totalStock <= 0
                            ? "text-destructive"
                            : ""
                        }`}
                      >
                        {product.totalStock}
                      </span>
                      {product.totalStock <= (product.stockThreshold ?? 5) && product.totalStock > 0 && (
                        <AlertTriangle className="inline-block ml-1 h-3 w-3 text-agora-warning" />
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? "bg-agora-success/10 text-agora-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {product.isActive ? "Actif" : "Inactif"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {product.isActive && (
                            <DropdownMenuItem asChild>
                              <Link href={`/produit/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir la page
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/vendeur/produits/${product.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleActive(product.id, product.isActive)
                            }
                          >
                            {product.isActive ? (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" />
                                Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setProductToDelete(product.id);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
        </>
      ) : (
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title={search ? "Aucun résultat" : "Aucun produit"}
          description={
            search
              ? "Aucun produit ne correspond à votre recherche."
              : "Commencez par ajouter votre premier produit."
          }
          action={
            !search
              ? {
                  label: "Ajouter un produit",
                  href: "/vendeur/produits/nouveau",
                }
              : undefined
          }
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit sera définitivement
              supprimé de votre boutique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function VendorProductsPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement des produits...</div>}>
      <VendorProductsContent />
    </Suspense>
  );
}
