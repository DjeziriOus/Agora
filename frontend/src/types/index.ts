// src/types/index.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "buyer" | "seller" | "unassigned";
  emailVerified: boolean;
  image?: string;
}

export interface Store {
  id: string;
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  productCount: number;
  rating: number;
  createdAt: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  category?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  stockThreshold: number;
  rating: number;
  reviewCount: number;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeLogo?: string;
  images: string[];
  variants: ProductVariant[];
  totalStock: number;
  displayPrice: number;
  hasMultiplePrices: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  code: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
  isActive: boolean;
}

export interface ProductImage {
  url: string;
  publicId: string;
}

export interface SellerProduct extends Omit<Product, "images"> {
  images: ProductImage[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  unitPrice: number;
  selected?: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  storeGroups: {
    storeId: string;
    storeName: string;
    items: CartItem[];
    subtotal: number;
  }[];
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  date: string;
  items: OrderItem[];
  client: {
    name: string;
    email: string;
  };
  deliveryAddress: DeliveryAddress;
  subOrders: SubOrder[];
}

export interface SubOrder {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export type OrderStatus =
  | "en_attente"
  | "en_preparation"
  | "expedie"
  | "livre"
  | "annule";

export interface DeliveryAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

// API Payloads
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "buyer" | "seller";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  category: string;
  stockThreshold?: number;
  images: File[] | string[];
  variants?: ProductVariant[];
  isActive: boolean;
}

export interface StorePayload {
  name: string;
  description: string;
  logo?: string;
  banner?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  category?: string;
}

export interface OrderPayload {
  items: { productId: string; variantId: string; quantity: number }[];
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
}

export interface ProductQuery {
  q?: string;
  category?: string;
  storeId?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  sort?: "relevance" | "price_asc" | "price_desc" | "rating";
  page?: string;
  limit?: string;
}

// Dashboard Stats
export interface VendorStats {
  revenue: number;
  revenueChange: number;
  ordersReceived: number;
  activeProducts: number;
  averageRating: number;
}
