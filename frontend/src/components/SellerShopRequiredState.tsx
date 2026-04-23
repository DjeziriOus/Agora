"use client";

import { EmptyState } from "@/components/EmptyState";

export function SellerShopRequiredState() {
  return (
    <EmptyState
      type="store"
      title="Créez votre boutique pour commencer à vendre"
      description="Vous devez d'abord configurer votre boutique avant d'ajouter des produits, gérer votre stock ou recevoir des commandes."
      action={{
        label: "Créer ma boutique",
        href: "/vendeur/boutique",
      }}
    />
  );
}
