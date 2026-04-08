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
  variants?: Array<{
    code?: string;
    name?: string;
    sku?: string;
    price?: number | null;
    stock?: number;
    isActive?: boolean;
  }>;
  isActive?: boolean;
  createdAt?: string;
  shop?: BackendProductShop;
};

type BackendCartItem = {
  productId: BackendProduct;
  variantId?: string | null;
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

const mapVariant = (variant: {
  code?: string;
  name?: string;
  sku?: string;
  price?: number | null;
  stock?: number;
  isActive?: boolean;
}): ProductVariant => ({
  code: variant.code ?? "",
  name: variant.name ?? "",
  sku: variant.sku ?? "",
  price:
    variant.price === undefined || variant.price === null
      ? null
      : Number(variant.price),
  stock: variant.stock ?? 0,
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
      : product.shop?.id ?? product.shop?._id ?? "";

  const storeName =
    typeof product.shop === "string" ? "" : product.shop?.name ?? "";

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
      typeof image === "string" ? image : image.url ?? "",
    ),
    variants: (product.variants ?? []).map(mapVariant),
    isActive: product.isActive ?? true,
    createdAt: product.createdAt ?? "",
  };
};

const mapProductImage = (image: BackendProductImage): ProductImage => ({
  url: typeof image === "string" ? image : image.url ?? "",
  publicId: typeof image === "string" ? "" : image.publicId ?? "",
});

const mapSellerProduct = (product: BackendProduct): SellerProduct => {
  const mappedProduct = mapProduct(product);

  return {
    ...mappedProduct,
    images: (product.images ?? []).map(mapProductImage),
  };
};

const resolveCartItemUnitPrice = (
  product: Product,
  variantId?: string | null,
) => {
  // Use the variant-specific price when a cart line targets a variant.
  if (!variantId) {
    return product.price;
  }

  const variant = (product.variants ?? []).find(
    (item) => item.code === variantId,
  );

  return variant?.price ?? product.price;
};

const mapCartItem = (item: BackendCartItem): CartItem => {
  // The backend populates productId with the full product document.
  const product = mapProduct(item.productId);

  return {
    productId: product.id,
    product,
    quantity: item.quantity,
    variantId: item.variantId ?? null,
    selected: item.selected ?? true,
    unitPrice: resolveCartItemUnitPrice(product, item.variantId),
  } as CartItem;
};

const mapCart = (cart: BackendCart): Cart => {
  // Normalize the backend cart payload into the shape expected by the frontend.
  const items = (cart.items ?? []).map(mapCartItem);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice ?? item.product.price) * item.quantity,
    0,
  );

  const storeGroups = items.reduce(
    (groups, item) => {
      const existingGroup = groups.find(
        (group) => group.storeId === item.product.storeId,
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
  getAll: (params?: Record<string, string | undefined>) => {
    const qs = params
      ? "?" +
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined),
        ) as Record<string, string>,
      ).toString()
      : "";
    return apiFetch<{ products: Product[]; total: number }>(
      `/api/products${qs}`,
    );
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
      method: "DELETE"
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

// ── Orders ───────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: () => apiFetch<unknown[]>("/api/orders"),
  create: (data: unknown) =>
    apiFetch<unknown>("/api/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

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
    variantId?: string | null,
  ) => {
    const response = await apiFetch<CartMutationResponse>(
      "/api/cart/update-quantity",
      {
        method: "PUT",
        body: JSON.stringify({
          productId,
          quantity,
          variantId: variantId ?? null,
        }),
      },
    );

    return mapCart(response.cart);
  },
  remove: async (productId: string, variantId?: string | null) => {
    const response = await apiFetch<CartMutationResponse>("/api/cart/remove", {
      method: "DELETE",
      body: JSON.stringify({
        productId,
        variantId: variantId ?? null,
      }),
    });

    return mapCart(response.cart);
  },
  toggleSelected: async (productId: string, variantId?: string | null) => {
    const response = await apiFetch<CartMutationResponse>(
      "/api/cart/toggle-selected",
      {
        method: "PATCH",
        body: JSON.stringify({
          productId,
          variantId: variantId ?? null,
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
