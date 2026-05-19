/**
 * @file Helpers de détection d'erreurs métier liées à la boutique.
 * Utilisés pour orienter le vendeur vers la création de boutique
 * quand une route /api/shops/my répond 404.
 */

import { ApiError } from "@/lib/api";

export const isMissingSellerShopError = (error: unknown) =>
  error instanceof ApiError && error.status === 404;
