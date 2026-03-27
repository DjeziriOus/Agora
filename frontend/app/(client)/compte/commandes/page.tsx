"use client";

import { useClientOrders } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";
import { Package, Eye, ChevronRight, PackageIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  en_attente: "En attente",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

const statusColors: Record<string, string> = {
  en_attente: "bg-agora-warning/10 text-agora-warning",
  en_preparation: "bg-primary/10 text-primary",
  en_livraison: "bg-agora-accent/10 text-agora-accent",
  livree: "bg-agora-success/10 text-agora-success",
  annulee: "bg-destructive/10 text-destructive",
};

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useClientOrders();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Mes commandes
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez et gérez vos commandes
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<PackageIcon/>}
        title="Erreur de chargement"
        description="Impossible de charger vos commandes. Veuillez réessayer."
        actionLabel="Réessayer"
        actionHref="/compte/commandes"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Mes commandes
        </h1>
        <p className="text-muted-foreground mt-1">
          {orders?.length || 0} commande{(orders?.length || 0) > 1 ? "s" : ""}
        </p>
      </div>

      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-base">
                      Commande #{order.id.slice(0, 8)}
                    </CardTitle>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status] || statusColors.en_attente
                      }`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "d MMMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {order.subOrders?.reduce(
                        (acc, sub) =>
                          acc + sub.items.reduce((a, i) => a + i.quantity, 0),
                        0
                      ) || 0}{" "}
                      article(s)
                    </p>
                    <p className="font-semibold text-lg">
                      {order.total.toFixed(2)} €
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/compte/commandes/${order.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir les détails
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="Aucune commande"
          description="Vous n'avez pas encore passé de commande sur Agora."
          actionLabel="Découvrir nos produits"
          actionHref="/catalogue"
        />
      )}
    </div>
  );
}
