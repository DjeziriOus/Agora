"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/types";
import { cartApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  storeGroups: {
    storeId: string;
    storeName: string;
    items: CartItem[];
    subtotal: number;
  }[];
  addToCart: (
    productOrId: string | Product,
    quantity?: number,
    variantId?: string | null,
  ) => Promise<void>;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string | null) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Une erreur est survenue";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const loadServerCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      const cart = await cartApi.get();
      setItems(cart.items);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void loadServerCart();
  }, [isAuthLoading, loadServerCart]);

  const addToCart = useCallback(
    async (
      productOrId: string | Product,
      quantity = 1,
      variantId?: string | null,
    ) => {
      if (!isAuthenticated) {
        toast.error("Connectez-vous pour ajouter des produits au panier");
        return;
      }

      const productId =
        typeof productOrId === "string"
          ? productOrId
          : productOrId.id ||
            ((productOrId as unknown as { _id?: string })._id ?? "");

      if (!productId) {
        toast.error("Produit introuvable");
        return;
      }

      try {
        const cart = await cartApi.add(productId, quantity, variantId ?? null);
        setItems(cart.items);
        toast.success("Produit ajouté au panier");
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [isAuthenticated],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string | null) => {
      if (!isAuthenticated) {
        return;
      }

      if (quantity < 1) {
        return;
      }

      try {
        const cart = await cartApi.updateQuantity(
          productId,
          quantity,
          variantId ?? null,
        );
        setItems(cart.items);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [isAuthenticated],
  );

  const removeFromCart = useCallback(
    async (productId: string, variantId?: string | null) => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const cart = await cartApi.remove(productId, variantId ?? null);
        setItems(cart.items);
        toast.success("Produit retire du panier");
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [isAuthenticated],
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      await cartApi.clear();
      setItems([]);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [isAuthenticated]);

  // Calculate derived values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? item.product.price) * item.quantity,
    0
  );

  // Group items by store
  const storeGroups = items.reduce(
    (groups, item) => {
      const existingGroup = groups.find(
        (g) => g.storeId === item.product.storeId
      );
      if (existingGroup) {
        existingGroup.items.push(item);
        existingGroup.subtotal +=
          (item.unitPrice ?? item.product.price) * item.quantity;
      } else {
        groups.push({
          storeId: item.product.storeId,
          storeName: item.product.storeName,
          items: [item],
          subtotal: (item.unitPrice ?? item.product.price) * item.quantity,
        });
      }
      return groups;
    },
    [] as {
      storeId: string;
      storeName: string;
      items: CartItem[];
      subtotal: number;
    }[]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        storeGroups,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
