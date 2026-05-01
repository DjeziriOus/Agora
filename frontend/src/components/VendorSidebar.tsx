"use client";

import Link from "next/link";
import Image from "next/image";
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
  X,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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

const getShopSlug = (store: unknown): string | null => {
  if (!store || typeof store !== "object") return null;
  const record = store as Record<string, unknown>;
  if (typeof record.slug === "string") return record.slug;
  return null;
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
    showLowStock: true,
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
];

const bottomNavItems = [
  {
    label: "Parametres",
    href: "/vendeur/parametres",
    icon: Settings,
  },
];

export function VendorSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSeller = user?.role === "seller";
  const { data: store } = useMyStore({ enabled: isSeller });
  const hasStore = !!store;
  const { data: lowStockProducts } = useLowStockProducts({ enabled: hasStore });

  const lowStockCount = lowStockProducts?.length || 0;
  const shopName = getShopName(store);
  const shopSlug = getShopSlug(store);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-background shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          collapsed ? "lg:w-20" : "w-72 lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border shrink-0",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          {!collapsed && (
            <Link href="/vendeur" className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Agora"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-display font-bold text-sidebar-foreground block truncate">
                  {shopName}
                </span>
                <span className="text-xs text-sidebar-foreground/60">Espace vendeur</span>
              </div>
            </Link>
          )}

          {collapsed && (
            <Link href="/vendeur" className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="Agora"
                width={32}
                height={32}
                className="object-contain"
              />
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {/* Main Nav */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                Menu
              </p>
            )}
            {vendorNavItems
              .filter((item) => {
                if (!hasStore) {
                  return item.href === "/vendeur/boutique";
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
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className={cn(
                      "h-5 w-5 shrink-0 transition-transform",
                      !collapsed && "group-hover:scale-110"
                    )} />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.showLowStock && lowStockCount > 0 && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {lowStockCount}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.showLowStock && lowStockCount > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </Link>
                );
              })}
          </div>

          {/* View Store Link */}
          {!collapsed && hasStore && shopSlug && (
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <Link
                href={`/boutique/${shopSlug}`}
                target="_blank"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
              >
                <ExternalLink className="h-5 w-5" />
                <span>Voir ma boutique</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          {/* Settings */}
          {bottomNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* User Section */}
          {!collapsed && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent mb-2">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={`${user.firstName || ""} ${user.lastName || ""}`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-sidebar-primary/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 shrink-0 rounded-full bg-sidebar-primary flex items-center justify-center ring-2 ring-sidebar-primary/20">
                  <span className="font-semibold text-sidebar-primary-foreground text-sm">
                    {initials}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-sidebar-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center mb-2">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={`${user.firstName || ""} ${user.lastName || ""}`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-sidebar-primary/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center ring-2 ring-sidebar-primary/20">
                  <span className="font-semibold text-sidebar-primary-foreground text-sm">
                    {initials}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full text-sidebar-foreground/70 hover:text-red-400 hover:bg-red-500/10 transition-colors",
              collapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={logout}
          >
            <LogOut className={cn("h-5 w-5", !collapsed && "mr-2")} />
            {!collapsed && "Deconnexion"}
          </Button>
        </div>
      </aside>
    </>
  );
}
