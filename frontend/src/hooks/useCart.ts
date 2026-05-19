/**
 * @file Hooks panier — wrappers React Query autour de `cartApi`.
 *
 * Toutes les mutations panier appliquent un optimistic update (réactivité
 * immédiate) puis se resync avec le serveur. Les erreurs structurées
 * (`MAX_PER_ORDER`, `INSUFFICIENT_STOCK`) sont propagées telles quelles
 * pour que le composant appelant affiche le toast adéquat.
 *
 * Voir aussi : docs/modules/frontend/hooks.md
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Cart, CartItem, Product } from "@/types";

const CART_KEY = ["cart"] as const;

/**
 * Compute derived cart values from raw Cart data.
 */
const deriveCartValues = (cart: Cart | undefined) => {
  const items = cart?.items ?? [];
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const storeGroups = cart?.storeGroups ?? [];

  return { items, itemCount, subtotal, storeGroups };
};

/**
 * Helper: build an optimistically updated cart
 */
const optimisticAdd = (
  old: Cart | undefined,
  productId: string,
  variantId: string,
  quantity: number,
): Cart => {
  const prev = old ?? { items: [], subtotal: 0, storeGroups: [] };
  const existingIdx = prev.items.findIndex(
    (i) => i.productId === productId && i.variantId === variantId,
  );

  let newItems: CartItem[];
  if (existingIdx >= 0) {
    newItems = prev.items.map((item, idx) =>
      idx === existingIdx
        ? { ...item, quantity: item.quantity + quantity }
        : item,
    );
  } else {
    // We don't have full product/variant data for optimistic add,
    // so we skip optimistic updates for add — rely on onSettled to refetch.
    return prev;
  }

  const newSubtotal = newItems.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );
  return { ...prev, items: newItems, subtotal: newSubtotal };
};

const optimisticUpdateQty = (
  old: Cart | undefined,
  productId: string,
  variantId: string,
  quantity: number,
): Cart => {
  const prev = old ?? { items: [], subtotal: 0, storeGroups: [] };
  const newItems = prev.items.map((item) =>
    item.productId === productId && item.variantId === variantId
      ? { ...item, quantity }
      : item,
  );
  const newSubtotal = newItems.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );
  return { ...prev, items: newItems, subtotal: newSubtotal };
};

const optimisticRemove = (
  old: Cart | undefined,
  productId: string,
  variantId: string,
): Cart => {
  const prev = old ?? { items: [], subtotal: 0, storeGroups: [] };
  const newItems = prev.items.filter(
    (i) => !(i.productId === productId && i.variantId === variantId),
  );
  const newSubtotal = newItems.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0,
  );

  // Rebuild store groups
  const storeGroups = newItems.reduce(
    (groups, item) => {
      const existing = groups.find(
        (g) => g.storeId === item.product.storeId,
      );
      if (existing) {
        existing.items.push(item);
        existing.subtotal += item.unitPrice * item.quantity;
      } else {
        groups.push({
          storeId: item.product.storeId,
          storeName: item.product.storeName,
          items: [item],
          subtotal: item.unitPrice * item.quantity,
        });
      }
      return groups;
    },
    [] as Cart["storeGroups"],
  );

  return { items: newItems, subtotal: newSubtotal, storeGroups };
};

// Standard onError handler that rolls back to previous cache
const rollback = (
  queryClient: QueryClient,
  context: { previous?: Cart } | undefined,
  message: string,
) => {
  if (context?.previous) {
    queryClient.setQueryData<Cart>(CART_KEY, context.previous);
  }
  toast.error(message);
};

/**
 * useCart — the single source of truth for cart state.
 *
 * Uses React Query for server state with optimistic updates.
 * Components destructure only what they need.
 */
export function useCart() {
  const { isAuthenticated, isSeller } = useAuth();
  const queryClient = useQueryClient();

  // ── Query: fetch cart ──────────────────────────────────────────────────────
  const cartQuery = useQuery<Cart>({
    queryKey: CART_KEY,
    queryFn: () => cartApi.get(),
    enabled: isAuthenticated && !isSeller,
    staleTime: 30_000,
  });

  const { items, itemCount, subtotal, storeGroups } = deriveCartValues(
    isSeller ? undefined : cartQuery.data,
  );

  // ── Mutation: add to cart ──────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
      variantId,
    }: {
      productId: string;
      quantity: number;
      variantId: string;
    }) => cartApi.add(productId, quantity, variantId),
    onMutate: async ({ productId, quantity, variantId }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_KEY);
      queryClient.setQueryData<Cart>(CART_KEY, (old) =>
        optimisticAdd(old, productId, variantId, quantity),
      );
      return { previous };
    },
    onError: (_err, _vars, context) =>
      rollback(queryClient, context, "Erreur lors de l'ajout au panier"),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: CART_KEY }),
    onSuccess: () => toast.success("Produit ajouté au panier"),
  });

  // ── Mutation: update quantity ──────────────────────────────────────────────
  const updateQtyMutation = useMutation({
    mutationFn: ({
      productId,
      quantity,
      variantId,
    }: {
      productId: string;
      quantity: number;
      variantId: string;
    }) => cartApi.updateQuantity(productId, quantity, variantId),
    onMutate: async ({ productId, quantity, variantId }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_KEY);
      queryClient.setQueryData<Cart>(CART_KEY, (old) =>
        optimisticUpdateQty(old, productId, variantId, quantity),
      );
      return { previous };
    },
    onError: (_err, _vars, context) =>
      rollback(
        queryClient,
        context,
        "Erreur lors de la mise à jour de la quantité",
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });

  // ── Mutation: remove from cart ──────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: ({
      productId,
      variantId,
    }: {
      productId: string;
      variantId: string;
    }) => cartApi.remove(productId, variantId),
    onMutate: async ({ productId, variantId }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_KEY);
      queryClient.setQueryData<Cart>(CART_KEY, (old) =>
        optimisticRemove(old, productId, variantId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) =>
      rollback(
        queryClient,
        context,
        "Erreur lors de la suppression de l'article",
      ),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: CART_KEY }),
    onSuccess: () => toast.success("Article retiré du panier"),
  });

  // ── Mutation: clear cart ────────────────────────────────────────────────────
  const clearMutation = useMutation({
    mutationFn: () => cartApi.clear(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_KEY);
      queryClient.setQueryData<Cart>(CART_KEY, {
        items: [],
        subtotal: 0,
        storeGroups: [],
      });
      return { previous };
    },
    onError: (_err, _vars, context) =>
      rollback(queryClient, context, "Erreur lors du vidage du panier"),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });

  // ── Public API ─────────────────────────────────────────────────────────────
  // Wrapper functions with simpler signatures for component convenience.

  const addToCart = (
    productOrId: string | Product,
    quantity = 1,
    variantId?: string | null,
  ) => {
    if (isSeller) {
      toast.error("Les comptes vendeurs ne peuvent pas passer de commande");
      return;
    }

    const productId =
      typeof productOrId === "string" ? productOrId : productOrId.id;

    // Resolve variantId: use provided, or auto-select first variant from product
    let resolvedVariantId = variantId ?? "";
    if (!resolvedVariantId && typeof productOrId !== "string") {
      const firstActive = productOrId.variants?.find((v) => v.isActive);
      resolvedVariantId = firstActive?.id ?? "";
    }

    if (!resolvedVariantId) {
      toast.error("Veuillez sélectionner une option");
      return;
    }

    addMutation.mutate({
      productId,
      quantity,
      variantId: resolvedVariantId,
    });
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variantId: string,
  ) => {
    if (isSeller) return;

    updateQtyMutation.mutate({ productId, quantity, variantId });
  };

  const removeFromCart = (productId: string, variantId: string) => {
    if (isSeller) return;

    removeMutation.mutate({ productId, variantId });
  };

  const clearCart = () => {
    if (isSeller) return;

    clearMutation.mutate();
  };

  return {
    // Data
    items,
    itemCount,
    subtotal,
    storeGroups,

    // Loading states
    isLoading: !isSeller && cartQuery.isLoading,
    isFetching: !isSeller && cartQuery.isFetching,

    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,

    // Mutation states (for per-button spinners etc.)
    isAdding: addMutation.isPending,
    isUpdating: updateQtyMutation.isPending,
    isRemoving: removeMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}
