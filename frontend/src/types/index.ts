// src/types/index.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "buyer" | "seller";
  emailVerified: boolean;
  photo?: string;
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
  price: number;
  category: string;
  categoryId: string;
  stock: number;
  stockThreshold: number;
  rating: number;
  reviewCount: number;
  storeId: string;
  storeName: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
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
  price: number;
  categoryId: string;
  stock: number;
  stockThreshold: number;
  images: string[];
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
  items: { productId: string; quantity: number }[];
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
