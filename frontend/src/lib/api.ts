import { API_URL } from "../config";
import type {
  Cart,
  CartItem,
  Product,
  ProductImage,
  ProductVariant,
  SellerProduct,
} from "@/types";
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

type BackendVariant = {
  _id?: string;
  id?: string;
  code?: string;
  name?: string;
  sku?: string;
  price?: number;
  stock?: number;
  attributes?: Record<string, string>;
  isActive?: boolean;
};

type BackendProduct = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category?: string;
  stockThreshold?: number;
  rating?: number;
  reviewCount?: number;
  images?: BackendProductImage[];
  variants?: BackendVariant[];
  totalStock?: number;
  displayPrice?: number;
  hasMultiplePrices?: boolean;
  isActive?: boolean;
  createdAt?: string;
  shop?: BackendProductShop;
};

type BackendCartItem = {
  productId: BackendProduct;
  variantId?: BackendVariant | string | null;
  selected?: boolean;
  quantity: number;
};

type BackendCart = {
  _id?: string;
  userId?: string;
  items?: BackendCartItem[];
  createdAt?: string;
  updatedAt?: string;
};

type CartMutationResponse = {
  message?: string;
  cart: BackendCart;
};

type CheckoutSummaryResponse = {
  selectedItems: BackendCartItem[];
  subtotal: number;
  itemCount: number;
};

const mapVariant = (variant: BackendVariant): ProductVariant => ({
  id: variant.id ?? variant._id ?? "",
  code: variant.code ?? "",
  name: variant.name ?? "",
  sku: variant.sku ?? "",
  price: Number(variant.price ?? 0),
  stock: variant.stock ?? 0,
  attributes: variant.attributes ?? {},
  isActive: variant.isActive ?? true,
});

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

  const variants = (product.variants ?? []).map(mapVariant);

  // Compute aggregates from variants if not provided by backend
  const activeVariants = variants.filter((v) => v.isActive);
  const fallbackTotalStock = activeVariants.reduce((s, v) => s + v.stock, 0);
  const fallbackDisplayPrice =
    activeVariants.length > 0
      ? Math.min(...activeVariants.map((v) => v.price))
      : 0;
  const fallbackHasMultiplePrices =
    activeVariants.length > 1 &&
    new Set(activeVariants.map((v) => v.price)).size > 1;

  return {
    id,
    name: product.name,
    description: product.description ?? "",
    category: product.category ?? "",
    stockThreshold: product.stockThreshold ?? 5,
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    storeId,
    storeName,
    images: (product.images ?? []).map((image) =>
      typeof image === "string" ? image : (image.url ?? ""),
    ),
    variants,
    totalStock: product.totalStock ?? fallbackTotalStock,
    displayPrice: product.displayPrice ?? fallbackDisplayPrice,
    hasMultiplePrices: product.hasMultiplePrices ?? fallbackHasMultiplePrices,
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

const mapCartItem = (item: BackendCartItem): CartItem => {
  // The backend populates productId with the full product document.
  const product = mapProduct(item.productId);

  // The backend populates variantId with the full variant document.
  const variantData =
    typeof item.variantId === "object" && item.variantId !== null
      ? item.variantId
      : null;

  const variant: ProductVariant = variantData
    ? mapVariant(variantData as BackendVariant)
    : product.variants[0] ?? {
        id: "",
        code: "default",
        name: "Standard",
        price: product.displayPrice,
        stock: 0,
        isActive: true,
      };

  const variantId =
    typeof item.variantId === "string"
      ? item.variantId
      : (variantData as BackendVariant)?._id ??
        (variantData as BackendVariant)?.id ??
        variant.id;

  return {
    productId: product.id,
    variantId: variantId ?? "",
    product,
    variant,
    quantity: item.quantity,
    unitPrice: variant.price,
    selected: item.selected ?? true,
  };
};

const mapCart = (cart: BackendCart): Cart => {
  // Normalize the backend cart payload into the shape expected by the frontend.
  const items = (cart.items ?? []).map(mapCartItem);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const storeGroups = items.reduce(
    (groups, item) => {
      const existingGroup = groups.find(
        (group) => group.storeId === item.product.storeId,
      );

      if (existingGroup) {
        existingGroup.items.push(item);
        existingGroup.subtotal += item.unitPrice * item.quantity;
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

  return {
    items,
    subtotal,
    storeGroups,
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
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
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
  updateStock: (id: string, stock: number) =>
    apiFetch<unknown>(`/api/products/${id}/stock`, {
      method: "PUT",
      body: JSON.stringify({ stock }),
    }),
  delete: (id: string) =>
    apiFetch<void>(`/api/products/${id}`, {
      method: "DELETE",
    }),
  toggleActive: (id: string, isActive: boolean) =>
    apiFetch<unknown>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive }),
    }),
};

// ── Shops ────────────────────────────────────────────────────────────────────
export const storesApi = {
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
      body: data as FormData,
    }),
  update: (data: unknown) =>
    apiFetch<unknown>("/api/shops/my", {
      method: "PUT",
      body: data as FormData,
    }),
};

export const shopsApi = storesApi;

export const categoriesApi = {
  getAll: () => apiFetch<unknown[]>("/api/categories"),
};

export const cartApi = {
  get: () => apiFetch<unknown>("/api/cart"),
  add: (productId: string, quantity: number) =>
    apiFetch<unknown>("/api/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),
  updateQuantity: (productId: string, quantity: number) =>
    apiFetch<unknown>("/api/cart/update", {
      method: "PUT",
      body: JSON.stringify({ productId, quantity }),
    }),
  remove: (productId: string) =>
    apiFetch<unknown>("/api/cart/remove", {
      method: "DELETE",
      body: JSON.stringify({ productId }),
    }),
  clear: () =>
    apiFetch<unknown>("/api/cart/clear", {
      method: "DELETE",
    }),
};

export const vendorApi = {
  getStats: () => apiFetch<unknown>("/api/vendor/stats"),
};

export const authApi = {
  me: () => apiFetch<unknown>("/api/auth/me"),
// ── Cart ─────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: async () => {
    // Fetch the authenticated user's server-side cart.
    const cart = await apiFetch<BackendCart>("/api/cart");
    return mapCart(cart);
  },
  add: async (productId: string, quantity = 1, variantId?: string | null) => {
    const response = await apiFetch<CartMutationResponse>("/api/cart/add", {
      method: "POST",
      body: JSON.stringify({
        productId,
        quantity,
        variantId: variantId ?? null,
      }),
    });

    return mapCart(response.cart);
  },
  updateQuantity: async (
    productId: string,
    quantity: number,
    variantId: string,
  ) => {
    const response = await apiFetch<CartMutationResponse>(
      "/api/cart/update-quantity",
      {
        method: "PUT",
        body: JSON.stringify({
          productId,
          quantity,
          variantId,
        }),
      },
    );

    return mapCart(response.cart);
  },
  remove: async (productId: string, variantId: string) => {
    const response = await apiFetch<CartMutationResponse>("/api/cart/remove", {
      method: "DELETE",
      body: JSON.stringify({
        productId,
        variantId,
      }),
    });

    return mapCart(response.cart);
  },
  toggleSelected: async (productId: string, variantId: string) => {
    const response = await apiFetch<CartMutationResponse>(
      "/api/cart/toggle-selected",
      {
        method: "PATCH",
        body: JSON.stringify({
          productId,
          variantId,
        }),
      },
    );

    return mapCart(response.cart);
  },
  getCheckoutSummary: async () => {
    const summary = await apiFetch<CheckoutSummaryResponse>(
      "/api/cart/checkout-summary",
    );

    return {
      selectedItems: summary.selectedItems.map(mapCartItem),
      subtotal: summary.subtotal,
      itemCount: summary.itemCount,
    };
  },
  clear: () =>
    apiFetch<{ message: string }>("/api/cart/clear", {
      method: "DELETE",
    }),
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
