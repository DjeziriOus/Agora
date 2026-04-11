import { API_URL } from "../config";
import type { Product, ProductImage, SellerProduct, CartItem } from "@/types";
const BASE_URL = API_URL;

type BackendProductImage =
  | string
  | {
      url?: string;
      publicId?: string;
    };

type BackendProductShop =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
    };

type BackendProduct = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  stock?: number;
  stockThreshold?: number;
  rating?: number;
  reviewCount?: number;
  images?: BackendProductImage[];
  isActive?: boolean;
  createdAt?: string;
  shop?: BackendProductShop;
};

const mapProduct = (product: BackendProduct): Product => {
  const id = product.id ?? product._id;

  if (!id) {
    throw new Error("Product id is missing in API response.");
  }

  const storeId =
    typeof product.shop === "string"
      ? product.shop
      : (product.shop?.id ?? product.shop?._id ?? "");

  const storeName =
    typeof product.shop === "string" ? "" : (product.shop?.name ?? "");

  return {
    id,
    name: product.name,
    description: product.description ?? "",
    price: product.price,
    category: product.category ?? "",
    stock: product.stock ?? 0,
    stockThreshold: product.stockThreshold ?? 5,
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    storeId,
    storeName,
    images: (product.images ?? []).map((image) =>
      typeof image === "string" ? image : (image.url ?? ""),
    ),
    isActive: product.isActive ?? true,
    createdAt: product.createdAt ?? "",
  };
};

const mapProductImage = (image: BackendProductImage): ProductImage => ({
  url: typeof image === "string" ? image : (image.url ?? ""),
  publicId: typeof image === "string" ? "" : (image.publicId ?? ""),
});

const mapSellerProduct = (product: BackendProduct): SellerProduct => {
  const mappedProduct = mapProduct(product);

  return {
    ...mappedProduct,
    images: (product.images ?? []).map(mapProductImage),
  };
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "ngrok-skip-browser-warning": "true",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Products ────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: async (params?: Record<string, string | undefined>) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined),
          ) as Record<string, string>,
        ).toString()
      : "";
    const result = await apiFetch<{
      products: BackendProduct[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/products${qs}`);
    return { ...result, products: result.products.map(mapProduct) };
  },
  getById: async (id: string) => {
    const product = await apiFetch<BackendProduct>(`/api/products/${id}`);
    return mapProduct(product);
  },
  getMineById: async (id: string) => {
    const product = await apiFetch<BackendProduct>(`/api/products/mine/${id}`);
    return mapSellerProduct(product);
  },
  getMine: async () => {
    const result = await apiFetch<{
      products: BackendProduct[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/products/mine`);

    return {
      ...result,
      products: result.products.map(mapProduct),
    };
  },
  create: (data: FormData) =>
    apiFetch<unknown>("/api/products", {
      method: "POST",
      body: data,
    }),
  update: (id: string, data: FormData | unknown) =>
    apiFetch<unknown>(`/api/products/${id}`, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/products/${id}`, {
      method: "DELETE",
    }),
  updateStock: (id: string, stock: number) =>
    apiFetch<unknown>(`/api/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    }),
  toggleActive: (id: string, isActive: boolean) =>
    apiFetch<unknown>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    }),
};

// ── Shops ────────────────────────────────────────────────────────────────────
export const shopsApi = {
  getById: (id: string) => apiFetch<unknown>(`/api/shops/${id}`),
  getProducts: (id: string, params?: Record<string, string | undefined>) => {
    const qs = params
      ? "?" +
        new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined),
          ) as Record<string, string>,
        ).toString()
      : "";
    return apiFetch<unknown>(`/api/shops/${id}/products${qs}`);
  },
  getMyStore: async () => {
    const store = await apiFetch<unknown>("/api/shops/my");
    return store ?? null;
  },
  create: (data: unknown) =>
    apiFetch<unknown>("/api/shops", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiFetch<unknown>(`/api/shops/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ── Cart ─────────────────────────────────────────────────────────────────────

type BackendCartItem = {
  productId: BackendProduct & { shop: BackendProductShop };
  quantity: number;
};

type BackendCart = {
  userId: string;
  items: BackendCartItem[];
};

const mapCartItem = (item: BackendCartItem): CartItem => ({
  productId: item.productId.id ?? item.productId._id ?? "",
  quantity: item.quantity,
  product: mapProduct(item.productId),
});

export const cartApi = {
  get: async (): Promise<CartItem[]> => {
    const cart = await apiFetch<BackendCart>("/api/cart");
    return cart.items.map(mapCartItem);
  },
  add: async (productId: string, quantity: number): Promise<CartItem[]> => {
    const cart = await apiFetch<BackendCart>("/api/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
    return cart.items.map(mapCartItem);
  },
  updateQuantity: async (
    productId: string,
    quantity: number,
  ): Promise<CartItem[]> => {
    const cart = await apiFetch<BackendCart>(`/api/cart/items/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
    return cart.items.map(mapCartItem);
  },
  remove: async (productId: string): Promise<CartItem[]> => {
    const cart = await apiFetch<BackendCart>(`/api/cart/items/${productId}`, {
      method: "DELETE",
    });
    return cart.items.map(mapCartItem);
  },
  clear: async (): Promise<void> => {
    await apiFetch<BackendCart>("/api/cart", { method: "DELETE" });
  },
};

// ── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: () => apiFetch<unknown[]>("/api/orders"),
  getById: (id: string) => apiFetch<unknown>(`/api/orders/${id}`),
  getClientOrders: () => apiFetch<unknown[]>("/api/orders/client"),
  getSellerOrders: () => apiFetch<unknown[]>("/api/orders/seller"),
  getSellerOrderById: (id: string) =>
    apiFetch<unknown>(`/api/orders/seller/${id}`),
  updateStatus: (id: string, status: string) =>
    apiFetch<unknown>(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  create: (data: unknown) =>
    apiFetch<unknown>("/api/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Addresses ────────────────────────────────────────────────────────────────
export const addressesApi = {
  getAll: () => apiFetch<unknown[]>("/api/addresses"),
  create: (data: unknown) =>
    apiFetch<unknown>("/api/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: unknown) =>
    apiFetch<unknown>(`/api/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/addresses/${id}`, { method: "DELETE" }),
  setDefault: (id: string) =>
    apiFetch<unknown>(`/api/addresses/${id}/default`, { method: "PATCH" }),
};
