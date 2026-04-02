export const stores = [
  {
    id: "store-1",
    name: "Agora Boutique",
    description: "Une boutique de démonstration pour vendre des produits sélectionnés.",
    logo: "https://placehold.co/200x200?text=Logo",
    banner: "https://placehold.co/1200x300?text=Banner",
    productCount: 2,
    rating: 4.8,
    createdAt: new Date().toISOString(),
    address: {
      street: "123 Rue de l'Agora",
      city: "Paris",
      postalCode: "75000",
      country: "France",
    },
    category: "Électronique",
  },
];

export const products = [
  {
    id: "prod-1",
    name: "Souris sans fil",
    description: "Souris ergonomique avec connexion Bluetooth et longue autonomie.",
    price: 29.99,
    category: "Électronique",
    categoryId: "electronics",
    stock: 14,
    stockThreshold: 5,
    rating: 4.6,
    reviewCount: 23,
    storeId: "store-1",
    storeName: "Agora Boutique",
    images: ["https://placehold.co/600x400?text=Souris"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "Clavier mécanique",
    description: "Clavier rétroéclairé avec switches tactiles et repose-poignets.",
    price: 89.99,
    category: "Électronique",
    categoryId: "electronics",
    stock: 4,
    stockThreshold: 5,
    rating: 4.7,
    reviewCount: 12,
    storeId: "store-1",
    storeName: "Agora Boutique",
    images: ["https://placehold.co/600x400?text=Clavier"],
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const orders = [
  {
    id: "order-1",
    userId: "user-1",
    sellerId: "seller-1",
    storeId: "store-1",
    storeName: "Agora Boutique",
    items: [
      {
        productId: "prod-1",
        productName: "Souris sans fil",
        quantity: 2,
        price: 29.99,
      },
    ],
    status: "shipped",
    totalPrice: 59.98,
    shippingAddress: {
      street: "456 Boulevard Central",
      city: "Lyon",
      postalCode: "69000",
      country: "France",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function generateId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
