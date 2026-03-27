"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Package, Search, ShoppingBag, Store, FileText } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateType = "products" | "search" | "cart" | "orders" | "store";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

const defaultContent: Record<
  EmptyStateType,
  { icon: ReactNode; title: string; description: string }
> = {
  products: {
    icon: <Package className="w-12 h-12" />,
    title: "Aucun produit",
    description: "Il n'y a pas encore de produits à afficher.",
  },
  search: {
    icon: <Search className="w-12 h-12" />,
    title: "Aucun résultat",
    description: "Aucun produit ne correspond à votre recherche.",
  },
  cart: {
    icon: <ShoppingBag className="w-12 h-12" />,
    title: "Votre panier est vide",
    description: "Ajoutez des produits à votre panier pour les retrouver ici.",
  },
  orders: {
    icon: <FileText className="w-12 h-12" />,
    title: "Aucune commande",
    description: "Vous n'avez pas encore passé de commande.",
  },
  store: {
    icon: <Store className="w-12 h-12" />,
    title: "Boutique non configurée",
    description: "Configurez votre boutique pour commencer à vendre.",
  },
};

export function EmptyState({
  type = "products",
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  const content = defaultContent[type];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="w-20 h-20 rounded-full bg-[var(--agora-accent)] flex items-center justify-center text-[var(--agora-primary)] mb-6">
        {icon || content.icon}
      </div>
      <h3 className="font-display text-xl font-bold text-[var(--agora-ink)] mb-2">
        {title || content.title}
      </h3>
      <p className="text-[var(--agora-mid)] max-w-sm mb-6">
        {description || content.description}
      </p>
      {action && (
        <Button
          asChild={!!action.href}
          onClick={action.onClick}
          className="bg-[var(--agora-primary)] hover:bg-[var(--agora-primary-hover)]"
        >
          {action.href ? <a href={action.href}>{action.label}</a> : action.label}
        </Button>
      )}
    </div>
  );
}
