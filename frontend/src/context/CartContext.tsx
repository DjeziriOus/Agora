"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";
import { cartApi, ApiError } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  storeGroups: {
    storeId: string;
    storeName: string;
    items: CartItem[];
    subtotal: number;
  }[];
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cart from backend whenever auth state resolves.
  // Clear local state on logout.
  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    (async () => {
      try {
        const cartItems: CartItem[] = await cartApi.get() as CartItem[];
        setItems(cartItems);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, isAuthLoading]);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      if (!isAuthenticated) {
        toast.error("Connectez-vous pour ajouter au panier");
        return;
      }
      try {
        const updated: CartItem[] = await cartApi.add(productId, quantity) as CartItem[];
        setItems(updated);
        toast.success("Produit ajouté au panier");
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Erreur lors de l'ajout",
        );
      }
    },
    [isAuthenticated],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) return;
      try {
        const updated: CartItem[] = await cartApi.updateQuantity(productId, quantity) as CartItem[];
        setItems(updated);
      } catch (err) {
        toast.error(
          err instanceof ApiError
            ? err.message
            : "Erreur lors de la mise à jour",
        );
      }
    },
    [],
  );

  const removeFromCart = useCallback(async (productId: string) => {
    try {
      const updated: CartItem[] = await cartApi.remove(productId) as CartItem[];
      setItems(updated);
      toast.success("Produit retiré du panier");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Erreur lors de la suppression",
      );
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await cartApi.clear();
      setItems([]);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Erreur lors du vidage du panier",
      );
    }
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const storeGroups = items.reduce(
    (groups, item) => {
      const existing = groups.find((g) => g.storeId === item.product.storeId);
      if (existing) {
        existing.items.push(item);
        existing.subtotal += item.product.price * item.quantity;
      } else {
        groups.push({
          storeId: item.product.storeId,
          storeName: item.product.storeName,
          items: [item],
          subtotal: item.product.price * item.quantity,
        });
      }
      return groups;
    },
    [] as {
      storeId: string;
      storeName: string;
      items: CartItem[];
      subtotal: number;
    }[],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
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
