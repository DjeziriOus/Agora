"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Store,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLowStockProducts, useMyStore } from "@/hooks/useApi";

const getShopName = (store: unknown): string => {
  if (!store || typeof store !== "object") {
    return "Ma boutique";
  }

  const record = store as Record<string, unknown>;

  if (typeof record.name === "string" && record.name.trim()) {
    return record.name;
  }

  if (record.shop) {
    const nestedShopName = getShopName(record.shop);
    if (nestedShopName !== "Ma boutique") {
      return nestedShopName;
    }
  }

  if (record.store) {
    const nestedStoreName = getShopName(record.store);
    if (nestedStoreName !== "Ma boutique") {
      return nestedStoreName;
    }
  }

  return "Ma boutique";
};

const vendorNavItems = [
  {
    label: "Tableau de bord",
    href: "/vendeur",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Mes produits",
    href: "/vendeur/produits",
    icon: Package,
  },
  {
    label: "Gestion du stock",
    href: "/vendeur/stock",
    icon: Boxes,
  },
  {
    label: "Commandes",
    href: "/vendeur/commandes",
    icon: ShoppingCart,
  },
  {
    label: "Ma boutique",
    href: "/vendeur/boutique",
    icon: Store,
  },
  {
    label: "Paramètres du Compte",
    href: "/vendeur/parametres",
    icon: Settings,
  },
];

export function VendorSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { data: store } = useMyStore({ enabled: isSeller });
  const { data: lowStockProducts } = useLowStockProducts({ enabled: hasStore });
  const hasStore = !!store;
  const isSeller = user?.role === "seller";

  const lowStockCount = lowStockProducts?.length || 0;
  const shopName = getShopName(store);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setCollapsed(!collapsed)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background border-r transition-all duration-300",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "w-64",
          "lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center justify-between px-4 border-b">
            {!collapsed && (
              <Link href="/vendeur" className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-heading font-bold text-lg">
                    A
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="font-heading font-bold text-lg block truncate">
                    {shopName}
                  </span>
                </div>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  collapsed && "rotate-180",
                )}
              />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {vendorNavItems
              .filter((item) => {
                if (!hasStore) {
                  return (
                    item.href === "/vendeur/boutique" ||
                    item.href === "/vendeur/parametres"
                  );
                }
                return true;
              })
              .map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}

                    {!collapsed &&
                      item.href === "/vendeur/produits" &&
                      lowStockCount > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-agora-warning">
                          <AlertTriangle className="h-3 w-3" />
                          {lowStockCount}
                        </span>
                      )}
                  </Link>
                );
              })}
          </nav>

          <div className="p-4 border-t">
            {!collapsed && (
              <div className="flex items-center gap-3 mb-3">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={`${user?.firstName || ""} ${user?.lastName || ""}`}
                    className="w-10 h-10 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-muted-foreground hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
              onClick={logout}
            >
              <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
              {!collapsed && "Déconnexion"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
