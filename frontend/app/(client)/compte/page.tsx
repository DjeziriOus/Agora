"use client";

import { useAuth } from "@/context/AuthContext";
import { useClientOrders } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Package, MapPin, ShoppingBag, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AccountPage() {
  const { user } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useClientOrders();

  const recentOrders = orders?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Bonjour, {user?.firstName} !
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue sur votre espace personnel Agora.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Commandes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-agora-success/10">
                <ShoppingBag className="h-6 w-6 text-agora-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {orders?.filter((o) => o.status === "livree").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Livrées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-agora-warning/10">
                <MapPin className="h-6 w-6 text-agora-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Adresses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Commandes récentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/compte/commandes">
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/compte/commandes/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">
                      Commande #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {order.total.toFixed(2)} €
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "livree"
                          ? "bg-agora-success/10 text-agora-success"
                          : order.status === "en_livraison"
                          ? "bg-primary/10 text-primary"
                          : "bg-agora-warning/10 text-agora-warning"
                      }`}
                    >
                      {order.status === "en_attente" && "En attente"}
                      {order.status === "en_preparation" && "En préparation"}
                      {order.status === "en_livraison" && "En livraison"}
                      {order.status === "livree" && "Livrée"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                {"Vous n'avez pas encore passé de commande."}
              </p>
              <Button asChild>
                <Link href="/catalogue">Découvrir nos produits</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
