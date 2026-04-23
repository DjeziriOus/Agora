import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  shopsApi,
  ordersApi,
  addressesApi,
  cartApi,
  vendorApi,
  // authApi,
} from "@/lib/api";
import { PRODUCT_CATEGORIES } from "@/lib/productCategories";
import type {
  ProductQuery,
  ProductPayload,
  OrderPayload,
  StorePayload,
  Product,
  Category,
  SellerProduct,
  Order,
} from "@/types";

// Query Keys
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (params?: ProductQuery) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    sellerDetail: (id: string) => ["products", "seller", "detail", id] as const,
    seller: ["products", "seller"] as const,
    lowStock: ["products", "lowStock"] as const,
  },
  stores: {
    detail: (id: string) => ["stores", id] as const,
    products: (id: string, params?: ProductQuery) =>
      ["stores", id, "products", params] as const,
    my: ["stores", "my"] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  orders: {
    buyer: ["orders", "buyer"] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
    seller: ["orders", "seller"] as const,
    sellerDetail: (id: string) => ["orders", "seller", id] as const,
  },
  vendor: {
    stats: ["vendor", "stats"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
};

// AUTH HOOKS
// export function useCurrentUser() {
//   return useQuery({
//     queryKey: queryKeys.auth.me,
//     queryFn: () => authApi.me(),
//     retry: false,
//   });
// }

// PRODUCT HOOKS
export function useProducts(params?: ProductQuery) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsApi.getAll(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  });
}

export function useSellerProduct(id: string) {
  return useQuery<SellerProduct>({
    queryKey: queryKeys.products.sellerDetail(id),
    queryFn: () => productsApi.getMineById(id),
    enabled: !!id,
  });
}

export function useSellerProducts(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.products.seller,
    queryFn: () => productsApi.getMine(),
    enabled: options?.enabled ?? true,
  });
}

export function useLowStockProducts() {
  return useQuery<Product[]>({
    queryKey: queryKeys.products.lowStock,
    queryFn: async () => {
      const result = await productsApi.getMine();
      return result.products.filter(
        (product) => product.totalStock <= product.stockThreshold,
      );
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.seller });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lowStock });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: FormData | Partial<ProductPayload>;
    }) => productsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.seller });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.sellerDetail(id),
      });
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productsApi.toggleActive(id, isActive),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.seller });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lowStock });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.sellerDetail(id),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.seller });
    },
  });
}

// STORE HOOKS
export function useStore(id: string) {
  return useQuery({
    queryKey: queryKeys.stores.detail(id),
    queryFn: () => shopsApi.getById(id),
    enabled: !!id,
  });
}

export function useStoreProducts(id: string, params?: ProductQuery) {
  return useQuery({
    queryKey: queryKeys.stores.products(id, params),
    queryFn: () => shopsApi.getProducts(id, params),
    enabled: !!id,
  });
}

export function useMyStore(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.stores.my,
    queryFn: () => shopsApi.getMyStore(),
    retry: false,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => shopsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.my });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      shopsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.my });
    },
  });
}

// CATEGORY HOOKS
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () =>
      PRODUCT_CATEGORIES.map((name, index) => ({
        id: `category-${index + 1}`,
        name,
        productCount: 0,
      })),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// ORDER HOOKS
export function useClientOrders() {
  return useQuery({
    queryKey: queryKeys.orders.buyer,
    queryFn: () => ordersApi.getClientOrders(),
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });
}

export function useSellerOrders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.orders.seller,
    queryFn: () => ordersApi.getSellerOrders(),
    enabled: options?.enabled ?? true,
  });
}

export function useSellerOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.sellerDetail(id),
    queryFn: () => ordersApi.getSellerOrderById(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OrderPayload) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.buyer });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.seller });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.sellerDetail(id),
      });
    },
  });
}

// CART HOOKS
export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => cartApi.get(),
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartApi.add(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => cartApi.updateQuantity(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => cartApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

// VENDOR STATS HOOKS
export function useVendorStats() {
  return useQuery({
    queryKey: queryKeys.vendor.stats,
    queryFn: async () => {
      // TODO: implement real vendor stats API
      return {
        revenue: 0,
        revenueChange: 0,
        ordersReceived: 0,
        activeProducts: 0,
        averageRating: 0,
      };
    },
  });
}
