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
import { mockProducts } from "@/lib/mockData";
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
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "agora_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedItems = JSON.parse(savedCart) as CartItem[];
        // Re-hydrate product data from mock data
        const hydratedItems = parsedItems
          .map((item) => {
            const product = mockProducts.find((p) => p.id === item.productId);
            if (product) {
              return { ...item, product };
            }
            return null;
          })
          .filter(Boolean) as CartItem[];
        setItems(hydratedItems);
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(
          items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }))
        )
      );
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [items]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    const product = mockProducts.find((p) => p.id === productId);
    if (!product) {
      toast.error("Produit introuvable");
      return;
    }

    if (product.stock === 0) {
      toast.error("Ce produit est en rupture de stock");
      return;
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.productId === productId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error(`Stock insuffisant (${product.stock} disponibles)`);
          return currentItems;
        }
        toast.success("Quantité mise à jour dans le panier");
        return currentItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      if (quantity > product.stock) {
        toast.error(`Stock insuffisant (${product.stock} disponibles)`);
        return currentItems;
      }

      toast.success("Produit ajouté au panier");
      return [...currentItems, { productId, product, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      return;
    }

    const product = mockProducts.find((p) => p.id === productId);
    if (product && quantity > product.stock) {
      toast.error(`Stock insuffisant (${product.stock} disponibles)`);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId)
    );
    toast.success("Produit retiré du panier");
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // Calculate derived values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
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
        existingGroup.subtotal += item.product.price * item.quantity;
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
