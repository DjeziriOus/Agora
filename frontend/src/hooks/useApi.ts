import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productsApi,
  // storesApi,
  // categoriesApi,
  ordersApi,
  // cartApi,
  // vendorApi,
  // authApi,
} from "@/lib/api";
import type { ProductQuery, ProductPayload, OrderPayload, StorePayload } from "@/types";

// Query Keys
export const queryKeys = {
  products: {
    all: ["products"] as const,
    list: (params?: ProductQuery) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
    seller: ["products", "seller"] as const,
    lowStock: ["products", "lowStock"] as const,
  },
  stores: {
    detail: (id: string) => ["stores", id] as const,
    products: (id: string, params?: ProductQuery) => ["stores", id, "products", params] as const,
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
  cart: ["cart"] as const,
  vendor: {
    stats: ["vendor", "stats"] as const,
  },
  auth: {
    me: ["auth", "me"] as const,
  },
};

// AUTH HOOKS
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    // queryFn: () => authApi.me(),
    queryFn: () => {},
    retry: false,
  });
}

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

export function useSellerProducts() {
  return useQuery({
    queryKey: queryKeys.products.seller,
    // queryFn: () => productsApi.getSellerProducts(),
    queryFn: () => {},
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: queryKeys.products.lowStock,
    // queryFn: () => vendorApi.getLowStockProducts(),
    queryFn: () => {},
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductPayload) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.seller });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductPayload> }) =>
      productsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.seller });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    },
  });
}

export function useToggleProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    // mutationFn: (id: string) => productsApi.toggleActive(id),
    // mutationFn: (id: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.seller });
    },
  });
}

export function useUpdateProductStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      productsApi.updateStock(id, stock),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.seller });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lowStock });
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
    queryFn: () => storesApi.getById(id),
    enabled: !!id,
  });
}

export function useStoreProducts(id: string, params?: ProductQuery) {
  return useQuery({
    queryKey: queryKeys.stores.products(id, params),
    queryFn: () => storesApi.getProducts(id, params),
    enabled: !!id,
  });
}

export function useMyStore() {
  return useQuery({
    queryKey: queryKeys.stores.my,
    queryFn: () => storesApi.getMyStore(),
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StorePayload) => storesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.my });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StorePayload>) => storesApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stores.my });
    },
  });
}

// CATEGORY HOOKS
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => categoriesApi.getAll(),
  });
}

// ORDER HOOKS
export function useClientOrders() {
  return useQuery({
    queryKey: queryKeys.orders.client,
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

export function useSellerOrders() {
  return useQuery({
    queryKey: queryKeys.orders.seller,
    queryFn: () => ordersApi.getSellerOrders(),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.client });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.sellerDetail(id) });
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
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.add(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      cartApi.updateQuantity(productId, quantity),
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
    queryFn: () => vendorApi.getStats(),
  });
}
