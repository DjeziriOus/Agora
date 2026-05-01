"use client";

import { useAuth } from "@/context/AuthContext";
import {
  useVendorStats,
  useSellerOrders,
  useLowStockProducts,
  useStockStats,
  useMyStore,
} from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Eye,
  ArrowRight,
  Euro,
  Plus,
  Users,
  BarChart3,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ChevronRight,
  Sparkles,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

// Sample chart data - in production this would come from the API
const generateChartData = () => {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  return days.map((day) => ({
    name: day,
    ventes: Math.floor(Math.random() * 400) + 100,
    commandes: Math.floor(Math.random() * 20) + 5,
  }));
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  en_attente: {
    label: "En attente",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  en_preparation: {
    label: "En preparation",
    icon: RefreshCw,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  en_livraison: {
    label: "En livraison",
    icon: Truck,
    color: "text-purple-600",
    bg: "bg-purple-500/10",
  },
  livree: {
    label: "Livree",
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
  annulee: {
    label: "Annulee",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-500/10",
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Euro;
  trend?: number;
  trendLabel?: string;
  iconColor: string;
  iconBg: string;
  loading?: boolean;
  href?: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconColor,
  iconBg,
  loading,
  href,
}: StatCardProps) {
  const content = (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-md",
      href && "cursor-pointer hover:border-[var(--agora-primary)]/50"
    )}>
      {/* Subtle gradient overlay */}
      <div
        aria-hidden
        className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10", iconBg)}
      />
      
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <>
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", iconBg)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
        
        {!loading && trend !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
                trend >= 0
                  ? "text-green-600 bg-green-500/10"
                  : "text-red-600 bg-red-500/10"
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trend >= 0 ? "+" : ""}{trend}%
            </div>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useVendorStats();
  const { data: orders, isLoading: ordersLoading } = useSellerOrders();
  const { data: store } = useMyStore();
  const hasStore = !!store;
  const { data: stockStats, isLoading: stockStatsLoading } = useStockStats({ enabled: hasStore });
  const { data: lowStockProducts, isLoading: lowStockLoading } = useLowStockProducts({ enabled: hasStore });

  const chartData = useMemo(() => generateChartData(), []);
  const recentOrders = orders?.slice(0, 6) || [];
  const lowStockCount = stockStats?.lowStockCount || 0;

  // Calculate order status distribution
  const orderStatusCounts = useMemo(() => {
    if (!orders) return {};
    return orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [orders]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon apres-midi";
    return "Bonsoir";
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {greeting}, {user?.firstName}
            </h1>
            <Sparkles className="h-6 w-6 text-[var(--agora-gold)]" />
          </div>
          <p className="text-muted-foreground">
            Voici un apercu de votre activite. Continuez comme ca !
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/vendeur/produits">
              <Package className="mr-2 h-4 w-4" />
              Mes produits
            </Link>
          </Button>
          <Button asChild className="bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)]">
            <Link href="/vendeur/produits/nouveau">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau produit
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chiffre d'affaires"
          value={`${stats?.totalRevenue?.toFixed(2) || "0.00"} €`}
          icon={Euro}
          trend={stats?.revenueChange}
          trendLabel="ce mois"
          iconColor="text-green-600"
          iconBg="bg-green-500/10"
          loading={statsLoading}
        />
        <StatCard
          title="Commandes"
          value={stats?.totalOrders || 0}
          subtitle={stats?.pendingOrders ? `${stats.pendingOrders} en attente` : undefined}
          icon={ShoppingCart}
          iconColor="text-[var(--agora-primary)]"
          iconBg="bg-[var(--agora-primary)]/10"
          loading={statsLoading}
          href="/vendeur/commandes"
        />
        <StatCard
          title="Produits"
          value={stats?.totalProducts || 0}
          subtitle={stats?.activeProducts ? `${stats.activeProducts} actifs` : undefined}
          icon={Package}
          iconColor="text-[var(--agora-ink)]"
          iconBg="bg-[var(--agora-ink)]/10"
          loading={statsLoading}
          href="/vendeur/produits"
        />
        <StatCard
          title="Stock faible"
          value={lowStockCount}
          subtitle={lowStockCount > 0 ? "Produits a reapprovisionner" : "Tout va bien"}
          icon={AlertTriangle}
          iconColor={lowStockCount > 0 ? "text-amber-600" : "text-green-600"}
          iconBg={lowStockCount > 0 ? "bg-amber-500/10" : "bg-green-500/10"}
          loading={stockStatsLoading}
          href="/vendeur/stock"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Ventes de la semaine</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Performance des 7 derniers jours
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-[var(--agora-primary)]" />
                Ventes
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--agora-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--agora-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `${value}€`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "10px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => [`${value} €`, "Ventes"]}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventes"
                    stroke="var(--agora-primary)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVentes)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Statut des commandes</CardTitle>
            <p className="text-sm text-muted-foreground">Repartition actuelle</p>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : Object.keys(orderStatusCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(orderStatusCounts).map(([status, count]) => {
                  const config = statusConfig[status] || statusConfig.en_attente;
                  const Icon = config.icon;
                  const percentage = Math.round((count / (orders?.length || 1)) * 100);
                  
                  return (
                    <div key={status} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-lg", config.bg)}>
                            <Icon className={cn("h-4 w-4", config.color)} />
                          </div>
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{count}</span>
                          <span className="text-xs text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", config.bg.replace("/10", ""))}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Aucune commande pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Commandes recentes</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {orders?.length || 0} commande{(orders?.length || 0) !== 1 ? "s" : ""} au total
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-[var(--agora-primary)]">
              <Link href="/vendeur/commandes">
                Voir tout
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const config = statusConfig[order.status] || statusConfig.en_attente;
                  const StatusIcon = config.icon;
                  
                  return (
                    <Link
                      key={order.id}
                      href={`/vendeur/commandes/${order.id}`}
                      className="group flex items-center justify-between p-4 rounded-xl border border-border hover:border-[var(--agora-primary)]/30 hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0", config.bg)}>
                          <StatusIcon className={cn("h-4 w-4", config.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate group-hover:text-[var(--agora-primary)] transition-colors">
                            Commande #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(order.createdAt), { 
                              addSuffix: true,
                              locale: fr 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          config.bg,
                          config.color
                        )}>
                          {config.label}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">Aucune commande</p>
                <p className="text-sm text-muted-foreground">
                  Vos premieres commandes apparaitront ici
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className={cn(
          "transition-all",
          lowStockCount > 0 && "border-amber-500/30"
        )}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Alertes de stock
                </CardTitle>
                {lowStockCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold text-amber-600 bg-amber-500/10 rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Produits a reapprovisionner
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-[var(--agora-primary)]">
              <Link href="/vendeur/stock">
                Gerer le stock
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <Link
                    key={product.id}
                    href={`/vendeur/produits/${product.id}`}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600">
                          Stock: {product.totalStock} unites
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-green-500/10 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-medium text-foreground mb-1">Stocks a jour</p>
                <p className="text-sm text-muted-foreground">
                  Tous vos produits ont un stock suffisant
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href="/vendeur/produits/nouveau"
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-border hover:border-[var(--agora-primary)] hover:bg-[var(--agora-primary)]/5 transition-all"
            >
              <div className="p-3 rounded-xl bg-[var(--agora-primary)]/10 mb-3 group-hover:bg-[var(--agora-primary)]/20 transition-colors">
                <Plus className="h-6 w-6 text-[var(--agora-primary)]" />
              </div>
              <span className="text-sm font-medium text-center">Ajouter un produit</span>
            </Link>
            <Link
              href="/vendeur/commandes"
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-border hover:border-[var(--agora-gold)] hover:bg-[var(--agora-gold)]/5 transition-all"
            >
              <div className="p-3 rounded-xl bg-[var(--agora-gold)]/10 mb-3 group-hover:bg-[var(--agora-gold)]/20 transition-colors">
                <ShoppingCart className="h-6 w-6 text-[var(--agora-gold)]" />
              </div>
              <span className="text-sm font-medium text-center">Voir les commandes</span>
            </Link>
            <Link
              href="/vendeur/stock"
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-border hover:border-[var(--agora-green)] hover:bg-[var(--agora-green)]/5 transition-all"
            >
              <div className="p-3 rounded-xl bg-[var(--agora-green)]/10 mb-3 group-hover:bg-[var(--agora-green)]/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-[var(--agora-green)]" />
              </div>
              <span className="text-sm font-medium text-center">Gerer le stock</span>
            </Link>
            <Link
              href="/vendeur/boutique"
              className="group flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-border hover:border-[var(--agora-ink)] hover:bg-[var(--agora-ink)]/5 transition-all"
            >
              <div className="p-3 rounded-xl bg-[var(--agora-ink)]/10 mb-3 group-hover:bg-[var(--agora-ink)]/20 transition-colors">
                <Users className="h-6 w-6 text-[var(--agora-ink)]" />
              </div>
              <span className="text-sm font-medium text-center">Ma boutique</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
