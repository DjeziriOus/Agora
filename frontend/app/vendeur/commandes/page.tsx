"use client";

import { useState } from "react";
import Link from "next/link";
import { useSellerOrders, useUpdateOrderStatus } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Search, Eye, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  en_attente: "En attente",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
};

const statusColors: Record<string, string> = {
  en_attente: "bg-agora-warning/10 text-agora-warning",
  en_preparation: "bg-primary/10 text-primary",
  en_livraison: "bg-agora-accent/10 text-agora-accent",
  livree: "bg-agora-success/10 text-agora-success",
};

const statusOptions = [
  { value: "en_attente", label: "En attente" },
  { value: "en_preparation", label: "En préparation" },
  { value: "en_livraison", label: "En livraison" },
  { value: "livree", label: "Livrée" },
];

export default function VendorOrdersPage() {
  const { data: orders, isLoading, error } = useSellerOrders();
  const updateStatus = useUpdateOrderStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter orders
  let filteredOrders = orders || [];
  if (search) {
    filteredOrders = filteredOrders.filter((order) =>
      order.id.toLowerCase().includes(search.toLowerCase()),
    );
  }
  if (statusFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.status === statusFilter,
    );
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: orderId, status: newStatus });
      toast.success("Statut mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Erreur de chargement"
        description="Impossible de charger vos commandes."
        actionLabel="Réessayer"
        actionHref="/vendeur/commandes"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Commandes
        </h1>
        <p className="text-muted-foreground mt-1">
          {orders?.length || 0} commande{(orders?.length || 0) > 1 ? "s" : ""}{" "}
          au total
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commande</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/vendeur/commandes/${order.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        #{order.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.createdAt), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell>
                      {order.items?.reduce(
                        (acc, item) => acc + item.quantity,
                        0,
                      ) || 0}{" "}
                      article(s)
                    </TableCell>
                    <TableCell className="font-semibold">
                      {order.total?.toFixed(2) || "0.00"} €
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleStatusChange(order.id, value)
                        }
                      >
                        <SelectTrigger
                          className={`w-[160px] h-8 text-xs font-medium ${
                            statusColors[order.status] ||
                            statusColors.en_attente
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/vendeur/commandes/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title={
            search || statusFilter !== "all"
              ? "Aucun résultat"
              : "Aucune commande"
          }
          description={
            search || statusFilter !== "all"
              ? "Aucune commande ne correspond à vos critères."
              : "Vous n'avez pas encore reçu de commande."
          }
        />
      )}
    </div>
  );
}
