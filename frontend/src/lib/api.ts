/**
 * @file Couche HTTP centralisée — un seul point d'appel `fetch` typé.
 *
 * Toutes les API REST consommées par le frontend passent par ce module
 * (productsApi, shopsApi, cartApi, ordersApi, addressesApi, vendorApi,
 * accountApi). Les requêtes incluent automatiquement `credentials: "include"`
 * pour transmettre le cookie de session Better Auth.
 *
 * Les erreurs HTTP sont normalisées en `ApiError` avec :
 *   - `status` : code HTTP
 *   - `code`   : code métier (ex. `MAX_PER_ORDER`, `INSUFFICIENT_STOCK`)
 *   - `data`   : payload brut renvoyé par l'API
 *
 * Voir aussi : docs/modules/frontend/lib-api.md
 */

import { toast } from "sonner";
import { API_URL } from "../config";
import type {
  Cart,
  CartItem,
  Product,
  ProductImage,
  ProductQuery,
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

type BackendStoreImage = {
  url?: string;
  publicId?: string;
};

type BackendStore = {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  logo?: BackendStoreImage;
  banner?: BackendStoreImage;
  productCount?: number;
  rating?: number;
  reviewCount?: number;
  followerCount?: number;
  createdAt?: string;
};

type BackendProductShop =
  | string
  | {
      _id?: string;
      id?: string;
      name?: string;
      slug?: string;
      logo?: BackendStoreImage;
    };

type BackendVariant = {
  _id?: string;
  id?: string;
  code?: string;
  name?: string;
  sku?: string;
  price?: number;
  // Public payloads omit `stock` and provide these instead. Seller payloads
  // still include `stock` and `maxPerOrder` for the inventory pages.
  stock?: number;
  maxPerOrder?: number;
  maxPurchasable?: number;
  inStock?: boolean;
  lowStock?: boolean;
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
  inStock?: boolean;
  lowStock?: boolean;
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

const mapVariant = (variant: BackendVariant): ProductVariant => {
  const stock = variant.stock;
  const maxPerOrder = Number(variant.maxPerOrder ?? 10);
  // For public payloads `stock` is omitted and the backend computes
  // maxPurchasable / inStock / lowStock for us. For seller payloads we
  // still receive `stock` and derive the same fields locally so the rest
  // of the UI can rely on a single shape.
  const fallbackMaxPurchasable =
    typeof stock === "number"
      ? Math.max(0, Math.min(stock, maxPerOrder))
      : maxPerOrder;
  const fallbackInStock = typeof stock === "number" ? stock > 0 : true;
  const fallbackLowStock = typeof stock === "number" ? stock > 0 && stock <= 5 : false;

  return {
    id: variant.id ?? variant._id ?? "",
    code: variant.code ?? "",
    name: variant.name ?? "",
    sku: variant.sku ?? "",
    price: Number(variant.price ?? 0),
    maxPerOrder,
    maxPurchasable: variant.maxPurchasable ?? fallbackMaxPurchasable,
    inStock: variant.inStock ?? fallbackInStock,
    lowStock: variant.lowStock ?? fallbackLowStock,
    stock: typeof stock === "number" ? stock : undefined,
    attributes: variant.attributes ?? {},
    isActive: variant.isActive ?? true,
  };
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

  const storeSlug =
    typeof product.shop === "string" ? "" : (product.shop?.slug ?? "");

  const storeName =
    typeof product.shop === "string" ? "" : (product.shop?.name ?? "");

  const storeLogo =
    typeof product.shop === "string"
      ? ""
      : (product.shop?.logo?.url ?? "");

  const variants = (product.variants ?? []).map(mapVariant);

  // Compute aggregates from variants if not provided by backend
  const activeVariants = variants.filter((v) => v.isActive);
  const fallbackDisplayPrice =
    activeVariants.length > 0
      ? Math.min(...activeVariants.map((v) => v.price))
      : 0;
  const fallbackHasMultiplePrices =
    activeVariants.length > 1 &&
    new Set(activeVariants.map((v) => v.price)).size > 1;
  const fallbackInStock = activeVariants.some((v) => v.inStock);
  const fallbackLowStock =
    activeVariants.length > 0 && activeVariants.every((v) => v.lowStock || !v.inStock);

  return {
    id,
    name: product.name,
    description: product.description ?? "",
    category: product.category ?? "",
    stockThreshold: product.stockThreshold ?? 5,
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    storeId,
    storeSlug,
    storeName,
    storeLogo,
    images: (product.images ?? []).map((image) =>
      typeof image === "string" ? image : (image.url ?? ""),
    ),
    variants,
    inStock: product.inStock ?? fallbackInStock,
    lowStock: product.lowStock ?? fallbackLowStock,
    totalStock: product.totalStock,
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
    : (product.variants[0] ?? {
        id: "",
        code: "default",
        name: "Standard",
        price: product.displayPrice,
        maxPerOrder: 10,
        maxPurchasable: 0,
        inStock: false,
        lowStock: false,
        isActive: true,
      });

  const variantId =
    typeof item.variantId === "string"
      ? item.variantId
      : ((variantData as BackendVariant)?._id ??
        (variantData as BackendVariant)?.id ??
        variant.id);

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
  body: Record<string, unknown> | null;
  code?: string;
  maxAllowed?: number;
  productId?: string;

  constructor(
    public status: number,
    message: string,
    body: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.body = body;
    if (body && typeof body.code === "string") this.code = body.code;
    if (body && typeof body.maxAllowed === "number")
      this.maxAllowed = body.maxAllowed;
    if (body && typeof body.productId === "string")
      this.productId = body.productId;
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
    let body: Record<string, unknown> | null = null;
    try {
      body = (await res.json()) as Record<string, unknown>;
      const m = body?.message ?? body?.error;
      if (typeof m === "string") message = m;
    } catch {
      /* non-JSON error body */
    }
    toast.error(message);
    throw new ApiError(res.status, message, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Products ────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: async (params?: ProductQuery) => {
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
  getMine: async (params?: ProductQuery) => {
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
    }>(`/api/products/mine${qs}`);

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
  getById: (id: string) => apiFetch<BackendStore>(`/api/shops/${id}`),
  getProducts: async (
    id: string,
    params?: ProductQuery,
  ) => {
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
    }>(
      `/api/shops/${id}/products${qs}`,
    );
    return { ...result, products: result.products.map(mapProduct) };
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
  update: (id: string, data: unknown) =>
    apiFetch<unknown>(`/api/shops/${id}`, {
      method: "PUT",
      body: data as FormData,
    }),
};

export const shopsApi = storesApi;

export const categoriesApi = {
  getAll: () => apiFetch<unknown[]>("/api/categories"),
};

// export const cartApi = {
//   get: () => apiFetch<unknown>("/api/cart"),
//   add: (productId: string, quantity: number) =>
//     apiFetch<unknown>("/api/cart/add", {
//       method: "POST",
//       body: JSON.stringify({ productId, quantity }),
//     }),
//   updateQuantity: (productId: string, quantity: number) =>
//     apiFetch<unknown>("/api/cart/update", {
//       method: "PUT",
//       body: JSON.stringify({ productId, quantity }),
//     }),
//   remove: (productId: string) =>
//     apiFetch<unknown>("/api/cart/remove", {
//       method: "DELETE",
//       body: JSON.stringify({ productId }),
//     }),
//   clear: () =>
//     apiFetch<unknown>("/api/cart/clear", {
//       method: "DELETE",
//     }),
// };

export const vendorApi = {
  getStats: () => apiFetch<any>("/api/shops/my/stats"),
  getStockStats: () =>
    apiFetch<{
      inStockCount: number;
      lowStockCount: number;
      outOfStockCount: number;
    }>("/api/shops/my/stock-stats"),
};

// export const authApi = {
//   me: () => apiFetch<unknown>("/api/auth/me"),
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
    apiFetch<{ id: string }>("/api/orders", {
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
    apiFetch<unknown>(`/api/addresses/${id}/default`, { method: "POST" }),
};
