"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockStats = {
  totalUsers: 12847,
  usersChange: 12.5,
  totalStores: 1284,
  storesChange: 8.3,
  totalProducts: 45632,
  productsChange: 15.2,
  totalOrders: 8945,
  ordersChange: -2.4,
};

const mockUsers = [
  {
    id: "1",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@email.com",
    role: "seller" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-01-15",
    storeName: "Boutique Jean",
    ordersCount: 156,
  },
  {
    id: "2",
    firstName: "Marie",
    lastName: "Martin",
    email: "marie.martin@email.com",
    role: "buyer" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-02-20",
    ordersCount: 23,
  },
  {
    id: "3",
    firstName: "Pierre",
    lastName: "Bernard",
    email: "pierre.bernard@email.com",
    role: "seller" as const,
    emailVerified: false,
    status: "pending" as const,
    createdAt: "2024-03-10",
    storeName: "Tech Store",
    ordersCount: 0,
  },
  {
    id: "4",
    firstName: "Sophie",
    lastName: "Leroy",
    email: "sophie.leroy@email.com",
    role: "buyer" as const,
    emailVerified: true,
    status: "suspended" as const,
    createdAt: "2024-01-05",
    ordersCount: 45,
  },
  {
    id: "5",
    firstName: "Lucas",
    lastName: "Moreau",
    email: "lucas.moreau@email.com",
    role: "seller" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-02-28",
    storeName: "Mode & Style",
    ordersCount: 289,
  },
  {
    id: "6",
    firstName: "Emma",
    lastName: "Petit",
    email: "emma.petit@email.com",
    role: "buyer" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-03-15",
    ordersCount: 12,
  },
  {
    id: "7",
    firstName: "Antoine",
    lastName: "Roux",
    email: "antoine.roux@email.com",
    role: "admin" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2023-06-01",
    ordersCount: 0,
  },
  {
    id: "8",
    firstName: "Chloe",
    lastName: "Girard",
    email: "chloe.girard@email.com",
    role: "seller" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-01-22",
    storeName: "Beaute Bio",
    ordersCount: 178,
  },
];

const recentActivity = [
  { type: "user_registered", message: "Nouvel utilisateur inscrit", user: "Thomas Blanc", time: "Il y a 5 min" },
  { type: "store_created", message: "Nouvelle boutique creee", user: "Marie Duval", time: "Il y a 15 min" },
  { type: "order_placed", message: "Commande passee", user: "Client #4521", time: "Il y a 23 min" },
  { type: "user_suspended", message: "Utilisateur suspendu", user: "Compte signale", time: "Il y a 1h" },
  { type: "product_flagged", message: "Produit signale", user: "Review equipe", time: "Il y a 2h" },
];

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor,
  delay,
}: {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  iconColor: string;
  delay: number;
}) {
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
          isPositive ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </motion.div>
  );
}

function UserRow({
  user,
  onAction,
}: {
  user: typeof mockUsers[0];
  onAction: (action: string, userId: string) => void;
}) {
  const roleColors = {
    admin: "bg-red-100 text-red-700",
    seller: "bg-primary/10 text-primary",
    buyer: "bg-blue-100 text-blue-700",
  };

  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    suspended: "bg-red-100 text-red-700",
  };

  const statusLabels = {
    active: "Actif",
    pending: "En attente",
    suspended: "Suspendu",
  };

  const roleLabels = {
    admin: "Admin",
    seller: "Vendeur",
    buyer: "Acheteur",
  };

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border-border hover:bg-muted/50 transition-colors"
    >
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge variant="secondary" className={cn("font-medium", roleColors[user.role])}>
          {roleLabels[user.role]}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <Badge variant="secondary" className={cn("font-medium", statusColors[user.status])}>
          {statusLabels[user.status]}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1">
          {user.emailVerified ? (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground">
            {user.emailVerified ? "Verifie" : "Non verifie"}
          </span>
        </div>
      </td>
      <td className="py-4 px-4">
        {user.storeName ? (
          <span className="text-sm font-medium text-foreground">{user.storeName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-muted-foreground">{user.ordersCount}</span>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
        </span>
      </td>
      <td className="py-4 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onAction("view", user.id)}>
              <Eye className="w-4 h-4 mr-2" />
              Voir le profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("email", user.id)}>
              <Mail className="w-4 h-4 mr-2" />
              Envoyer un email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.status === "active" ? (
              <DropdownMenuItem
                onClick={() => onAction("suspend", user.id)}
                className="text-amber-600"
              >
                <UserX className="w-4 h-4 mr-2" />
                Suspendre
              </DropdownMenuItem>
            ) : user.status === "suspended" ? (
              <DropdownMenuItem
                onClick={() => onAction("activate", user.id)}
                className="text-emerald-600"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Reactiver
              </DropdownMenuItem>
            ) : null}
            {user.role !== "admin" && (
              <DropdownMenuItem
                onClick={() => onAction("ban", user.id)}
                className="text-red-600"
              >
                <Ban className="w-4 h-4 mr-2" />
                Bannir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </motion.tr>
  );
}

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = (action: string, userId: string) => {
    console.log(`Action: ${action} on user: ${userId}`);
    // In a real app, this would call an API
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Gerez les utilisateurs et supervisez la plateforme
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Actualiser
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total utilisateurs"
          value={mockStats.totalUsers}
          change={mockStats.usersChange}
          icon={Users}
          iconColor="bg-primary/10 text-primary"
          delay={0}
        />
        <StatCard
          title="Boutiques actives"
          value={mockStats.totalStores}
          change={mockStats.storesChange}
          icon={Store}
          iconColor="bg-emerald-100 text-emerald-600"
          delay={0.1}
        />
        <StatCard
          title="Produits en ligne"
          value={mockStats.totalProducts}
          change={mockStats.productsChange}
          icon={Package}
          iconColor="bg-amber-100 text-amber-600"
          delay={0.2}
        />
        <StatCard
          title="Commandes ce mois"
          value={mockStats.totalOrders}
          change={mockStats.ordersChange}
          icon={ShoppingCart}
          iconColor="bg-blue-100 text-blue-600"
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-3 bg-card rounded-2xl border border-border shadow-sm"
        >
          {/* Table Header */}
          <div className="p-6 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Utilisateurs</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""} trouve{filteredUsers.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="seller">Vendeur</SelectItem>
                    <SelectItem value="buyer">Acheteur</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Utilisateur</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Boutique</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Commandes</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Inscription</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <UserRow key={user.id} user={user} onAction={handleUserAction} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Affichage de 1 a {filteredUsers.length} sur {mockUsers.length} utilisateurs
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Precedent
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
                Suivant
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Activite recente</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  activity.type === "user_registered" && "bg-emerald-100 text-emerald-600",
                  activity.type === "store_created" && "bg-primary/10 text-primary",
                  activity.type === "order_placed" && "bg-blue-100 text-blue-600",
                  activity.type === "user_suspended" && "bg-amber-100 text-amber-600",
                  activity.type === "product_flagged" && "bg-red-100 text-red-600",
                )}>
                  {activity.type === "user_registered" && <Users className="w-4 h-4" />}
                  {activity.type === "store_created" && <Store className="w-4 h-4" />}
                  {activity.type === "order_placed" && <ShoppingCart className="w-4 h-4" />}
                  {activity.type === "user_suspended" && <UserX className="w-4 h-4" />}
                  {activity.type === "product_flagged" && <Package className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary">
            Voir tout l&apos;historique
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Inscriptions aujourd&apos;hui</h3>
            <span className="text-2xl font-bold text-primary">47</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: "78%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">78% de l&apos;objectif journalier</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Comptes en attente</h3>
            <span className="text-2xl font-bold text-amber-500">12</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">8 vendeurs</Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">4 acheteurs</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Necessite une verification</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Signalements ouverts</h3>
            <span className="text-2xl font-bold text-red-500">5</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-red-100 text-red-700">2 urgents</Badge>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">3 normaux</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">A traiter rapidement</p>
        </div>
      </motion.div>
    </div>
  );
}
