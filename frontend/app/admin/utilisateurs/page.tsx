"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  UserCheck,
  UserX,
  Download,
  Plus,
  ChevronDown,
  Calendar,
  Shield,
  Store,
  ArrowUpDown,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Extended mock data
const mockUsers = [
  {
    id: "1",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@email.com",
    role: "seller" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-01-15T10:30:00Z",
    lastLogin: "2024-03-20T14:22:00Z",
    storeName: "Boutique Jean",
    ordersCount: 156,
    revenue: 12450.50,
    phone: "+33 6 12 34 56 78",
  },
  {
    id: "2",
    firstName: "Marie",
    lastName: "Martin",
    email: "marie.martin@email.com",
    role: "buyer" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-02-20T08:15:00Z",
    lastLogin: "2024-03-21T09:45:00Z",
    ordersCount: 23,
    totalSpent: 1890.00,
    phone: "+33 6 98 76 54 32",
  },
  {
    id: "3",
    firstName: "Pierre",
    lastName: "Bernard",
    email: "pierre.bernard@email.com",
    role: "seller" as const,
    emailVerified: false,
    status: "pending" as const,
    createdAt: "2024-03-10T16:45:00Z",
    lastLogin: null,
    storeName: "Tech Store",
    ordersCount: 0,
    revenue: 0,
    phone: "+33 6 55 44 33 22",
  },
  {
    id: "4",
    firstName: "Sophie",
    lastName: "Leroy",
    email: "sophie.leroy@email.com",
    role: "buyer" as const,
    emailVerified: true,
    status: "suspended" as const,
    createdAt: "2024-01-05T12:00:00Z",
    lastLogin: "2024-02-28T18:30:00Z",
    ordersCount: 45,
    totalSpent: 3420.00,
    phone: "+33 6 11 22 33 44",
    suspensionReason: "Comportement abusif signale",
  },
  {
    id: "5",
    firstName: "Lucas",
    lastName: "Moreau",
    email: "lucas.moreau@email.com",
    role: "seller" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-02-28T11:20:00Z",
    lastLogin: "2024-03-21T16:00:00Z",
    storeName: "Mode & Style",
    ordersCount: 289,
    revenue: 34567.80,
    phone: "+33 6 77 88 99 00",
  },
  {
    id: "6",
    firstName: "Emma",
    lastName: "Petit",
    email: "emma.petit@email.com",
    role: "buyer" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-03-15T09:30:00Z",
    lastLogin: "2024-03-20T20:15:00Z",
    ordersCount: 12,
    totalSpent: 567.50,
    phone: "+33 6 22 33 44 55",
  },
  {
    id: "7",
    firstName: "Antoine",
    lastName: "Roux",
    email: "antoine.roux@email.com",
    role: "admin" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2023-06-01T08:00:00Z",
    lastLogin: "2024-03-21T08:00:00Z",
    ordersCount: 0,
    phone: "+33 6 00 11 22 33",
  },
  {
    id: "8",
    firstName: "Chloe",
    lastName: "Girard",
    email: "chloe.girard@email.com",
    role: "seller" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-01-22T14:00:00Z",
    lastLogin: "2024-03-21T11:30:00Z",
    storeName: "Beaute Bio",
    ordersCount: 178,
    revenue: 8923.45,
    phone: "+33 6 66 77 88 99",
  },
  {
    id: "9",
    firstName: "Thomas",
    lastName: "Blanc",
    email: "thomas.blanc@email.com",
    role: "buyer" as const,
    emailVerified: false,
    status: "pending" as const,
    createdAt: "2024-03-21T10:00:00Z",
    lastLogin: null,
    ordersCount: 0,
    totalSpent: 0,
    phone: "+33 6 44 55 66 77",
  },
  {
    id: "10",
    firstName: "Julie",
    lastName: "Fournier",
    email: "julie.fournier@email.com",
    role: "seller" as const,
    emailVerified: true,
    status: "active" as const,
    createdAt: "2024-02-14T15:30:00Z",
    lastLogin: "2024-03-19T17:45:00Z",
    storeName: "Jardin & Deco",
    ordersCount: 67,
    revenue: 4521.30,
    phone: "+33 6 88 99 00 11",
  },
];

type User = typeof mockUsers[0];

const roleColors = {
  admin: "bg-red-100 text-red-700 border-red-200",
  seller: "bg-primary/10 text-primary border-primary/20",
  buyer: "bg-blue-100 text-blue-700 border-blue-200",
};

const statusColors = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
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

function UserDetailModal({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <span>{user.firstName} {user.lastName}</span>
              <Badge variant="outline" className={cn("ml-2", roleColors[user.role])}>
                {roleLabels[user.role]}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Details du compte utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
              <p className="text-sm font-medium flex items-center gap-2">
                {user.email}
                {user.emailVerified ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Telephone</Label>
              <p className="text-sm font-medium">{user.phone}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Statut</Label>
              <Badge variant="outline" className={cn("mt-1", statusColors[user.status])}>
                {statusLabels[user.status]}
              </Badge>
            </div>
            {user.role === "seller" && user.storeName && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Boutique</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  {user.storeName}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Date d&apos;inscription</Label>
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Derniere connexion</Label>
              <p className="text-sm font-medium">
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleString("fr-FR")
                  : "Jamais connecte"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                {user.role === "seller" ? "Commandes recues" : "Commandes passees"}
              </Label>
              <p className="text-sm font-medium">{user.ordersCount}</p>
            </div>
            {user.role === "seller" && user.revenue !== undefined && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Chiffre d&apos;affaires</Label>
                <p className="text-sm font-medium text-emerald-600">
                  {user.revenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </p>
              </div>
            )}
            {user.role === "buyer" && user.totalSpent !== undefined && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Total depense</Label>
                <p className="text-sm font-medium">
                  {user.totalSpent.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </p>
              </div>
            )}
          </div>
        </div>

        {user.status === "suspended" && user.suspensionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <Label className="text-xs text-red-600 uppercase tracking-wide">Raison de la suspension</Label>
            <p className="text-sm text-red-700 mt-1">{user.suspensionReason}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="outline" className="gap-2">
            <Mail className="w-4 h-4" />
            Contacter
          </Button>
          {user.status === "suspended" ? (
            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
              <UserCheck className="w-4 h-4" />
              Reactiver
            </Button>
          ) : user.role !== "admin" ? (
            <Button variant="destructive" className="gap-2">
              <UserX className="w-4 h-4" />
              Suspendre
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SuspendUserModal({
  user,
  open,
  onClose,
  onConfirm,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <UserX className="w-5 h-5" />
            Suspendre l&apos;utilisateur
          </DialogTitle>
          <DialogDescription>
            Vous etes sur le point de suspendre le compte de {user.firstName} {user.lastName}.
            Cette action empechera l&apos;utilisateur d&apos;acceder a son compte.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="reason">Raison de la suspension</Label>
          <Textarea
            id="reason"
            placeholder="Decrivez la raison de cette suspension..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
          >
            Confirmer la suspension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [suspendUser, setSuspendUser] = useState<User | null>(null);

  const filteredUsers = mockUsers
    .filter((user) => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "createdAt") {
        return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      if (sortBy === "name") {
        return multiplier * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      if (sortBy === "orders") {
        return multiplier * (a.ordersCount - b.ordersCount);
      }
      return 0;
    });

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const handleSuspendConfirm = (reason: string) => {
    console.log(`Suspending user ${suspendUser?.id} for: ${reason}`);
    setSuspendUser(null);
  };

  const stats = {
    total: mockUsers.length,
    active: mockUsers.filter((u) => u.status === "active").length,
    pending: mockUsers.filter((u) => u.status === "pending").length,
    suspended: mockUsers.filter((u) => u.status === "suspended").length,
    sellers: mockUsers.filter((u) => u.role === "seller").length,
    buyers: mockUsers.filter((u) => u.role === "buyer").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Gerez tous les comptes de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Ajouter un admin
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Actifs</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">En attente</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
          <p className="text-xs text-muted-foreground">Suspendus</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.sellers}</p>
          <p className="text-xs text-muted-foreground">Vendeurs</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.buyers}</p>
          <p className="text-xs text-muted-foreground">Acheteurs</p>
        </div>
      </motion.div>

      {/* Filters & Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl border border-border shadow-sm"
      >
        {/* Filters */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
              {(roleFilter !== "all" || statusFilter !== "all" || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRoleFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="gap-1 text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                  Reinitialiser
                </Button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          <AnimatePresence>
            {selectedUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex items-center gap-4 p-3 bg-muted rounded-lg"
              >
                <span className="text-sm font-medium">
                  {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? "s" : ""} selectionne{selectedUsers.length > 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Mail className="w-3 h-3" />
                    Envoyer un email
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-amber-600 hover:text-amber-700">
                    <UserX className="w-3 h-3" />
                    Suspendre
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                  className="ml-auto"
                >
                  Annuler
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-3 px-4 w-10">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Utilisateur
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Statut</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email verifie</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Boutique</th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort("orders")}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Commandes
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Inscription
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "border-b border-border hover:bg-muted/50 transition-colors",
                    selectedUsers.includes(user.id) && "bg-primary/5"
                  )}
                >
                  <td className="py-4 px-4">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleSelectUser(user.id)}
                    />
                  </td>
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
                    <Badge variant="outline" className={cn("font-medium", roleColors[user.role])}>
                      {user.role === "admin" && <Shield className="w-3 h-3 mr-1" />}
                      {roleLabels[user.role]}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="outline" className={cn("font-medium", statusColors[user.status])}>
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
                        {user.emailVerified ? "Oui" : "Non"}
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
                        <DropdownMenuItem onClick={() => setViewUser(user)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Envoyer un email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "active" && user.role !== "admin" ? (
                          <DropdownMenuItem
                            onClick={() => setSuspendUser(user)}
                            className="text-amber-600"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Suspendre
                          </DropdownMenuItem>
                        ) : user.status === "suspended" ? (
                          <DropdownMenuItem className="text-emerald-600">
                            <UserCheck className="w-4 h-4 mr-2" />
                            Reactiver
                          </DropdownMenuItem>
                        ) : null}
                        {user.role !== "admin" && (
                          <DropdownMenuItem className="text-red-600">
                            <Ban className="w-4 h-4 mr-2" />
                            Bannir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">Aucun utilisateur trouve</h3>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Affichage de 1 a {filteredUsers.length} sur {mockUsers.length} utilisateurs
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Precedent
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                Suivant
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <UserDetailModal
        user={viewUser}
        open={!!viewUser}
        onClose={() => setViewUser(null)}
      />
      <SuspendUserModal
        user={suspendUser}
        open={!!suspendUser}
        onClose={() => setSuspendUser(null)}
        onConfirm={handleSuspendConfirm}
      />
    </div>
  );
}
