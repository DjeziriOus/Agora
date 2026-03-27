"use client";

import { useAuth } from "@/context/AuthContext";
import {
  useVendorStats,
  useSellerOrders,
  useLowStockProducts,
} from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Eye,
  ArrowRight,
  Euro,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Sample chart data - in production this would come from the API
const chartData = [
  { name: "Lun", ventes: 120 },
  { name: "Mar", ventes: 180 },
  { name: "Mer", ventes: 150 },
  { name: "Jeu", ventes: 220 },
  { name: "Ven", ventes: 280 },
  { name: "Sam", ventes: 350 },
  { name: "Dim", ventes: 190 },
];

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

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useVendorStats();
  const { data: orders, isLoading: ordersLoading } = useSellerOrders();
  const { data: lowStockProducts, isLoading: lowStockLoading } =
    useLowStockProducts();

  const recentOrders = orders?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue, {user?.firstName} ! Voici un aperçu de votre activité.
          </p>
        </div>
        <Button asChild>
          <Link href="/vendeur/produits/nouveau">
            <Package className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {statsLoading ? (
                  <>
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {stats?.totalRevenue?.toFixed(2) || "0.00"} €
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Chiffre d'affaires
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 rounded-xl bg-agora-success/10">
                <Euro className="h-6 w-6 text-agora-success" />
              </div>
            </div>
            {!statsLoading && stats?.revenueChange && (
              <p className="text-xs text-agora-success mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />+{stats.revenueChange}% ce
                mois
              </p>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {statsLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {stats?.totalOrders || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Commandes</p>
                  </>
                )}
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
            {!statsLoading && stats?.pendingOrders !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                {stats.pendingOrders} en attente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {statsLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {stats?.totalProducts || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Produits</p>
                  </>
                )}
              </div>
              <div className="p-3 rounded-xl bg-agora-accent/10">
                <Package className="h-6 w-6 text-agora-accent" />
              </div>
            </div>
            {!statsLoading && stats?.activeProducts !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                {stats.activeProducts} actifs
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card
          className={
            (lowStockProducts?.length || 0) > 0
              ? "border-agora-warning/50"
              : ""
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                {lowStockLoading ? (
                  <>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">
                      {lowStockProducts?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Stock faible</p>
                  </>
                )}
              </div>
              <div className="p-3 rounded-xl bg-agora-warning/10">
                <AlertTriangle className="h-6 w-6 text-agora-warning" />
              </div>
            </div>
            {!lowStockLoading && (lowStockProducts?.length || 0) > 0 && (
              <Link
                href="/vendeur/produits?filter=low-stock"
                className="text-xs text-agora-warning mt-2 flex items-center gap-1 hover:underline"
              >
                Voir les produits
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ventes de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} €`, "Ventes"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Commandes récentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendeur/commandes">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/vendeur/commandes/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "d MMM", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.status] || statusColors.en_attente
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucune commande récente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Products */}
      {(lowStockProducts?.length || 0) > 0 && (
        <Card className="border-agora-warning/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-agora-warning">
              <AlertTriangle className="h-5 w-5" />
              Produits en stock faible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {lowStockProducts?.slice(0, 4).map((product) => (
                <Link
                  key={product.id}
                  href={`/vendeur/produits/${product.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-agora-warning">
                      Stock: {product.stock}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
