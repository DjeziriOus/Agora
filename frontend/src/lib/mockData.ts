// src/lib/mockData.ts
import type {
  Product,
  Store,
  Category,
  Order,
  SubOrder,
  Cart,
  VendorStats,
  Review,
} from "@/types";

export const mockCategories: Category[] = [
  { id: "cat-1", name: "Papeterie", productCount: 8 },
  { id: "cat-2", name: "Maison", productCount: 12 },
  { id: "cat-3", name: "Mode", productCount: 15 },
  { id: "cat-4", name: "Bijoux", productCount: 9 },
  { id: "cat-5", name: "Art", productCount: 6 },
  { id: "cat-6", name: "Alimentation", productCount: 10 },
  { id: "cat-7", name: "Beauté", productCount: 7 },
  { id: "cat-8", name: "Jouets", productCount: 5 },
];

export const mockStores: Store[] = [
  {
    id: "s1",
    name: "Atelier Dumas",
    description:
      "Créations artisanales en cuir depuis 2015. Chaque pièce est fabriquée à la main dans notre atelier parisien avec des matériaux de qualité supérieure.",
    logo: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop",
    productCount: 24,
    rating: 4.8,
    createdAt: "2015-03-15",
    address: {
      street: "12 Rue du Commerce",
      city: "Paris",
      postalCode: "75015",
      country: "France",
    },
    category: "Mode",
  },
  {
    id: "s2",
    name: "La Fabrique",
    description:
      "Bougies artisanales et décoration intérieure. Nos produits sont fabriqués avec des cires naturelles et des parfums de Grasse.",
    logo: "https://images.unsplash.com/photo-1602928321679-560bb453f190?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1200&h=300&fit=crop",
    productCount: 18,
    rating: 4.5,
    createdAt: "2018-06-20",
    address: {
      street: "45 Avenue des Arts",
      city: "Lyon",
      postalCode: "69002",
      country: "France",
    },
    category: "Maison",
  },
  {
    id: "s3",
    name: "Papier & Co",
    description:
      "Papeterie haut de gamme et carnets personnalisés. Impression artisanale et reliure traditionnelle.",
    logo: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1200&h=300&fit=crop",
    productCount: 32,
    rating: 4.9,
    createdAt: "2012-09-01",
    address: {
      street: "8 Rue des Écritures",
      city: "Bordeaux",
      postalCode: "33000",
      country: "France",
    },
    category: "Papeterie",
  },
  {
    id: "s4",
    name: "Bijoux Céleste",
    description:
      "Bijoux faits main en argent et pierres semi-précieuses. Designs uniques inspirés de la nature.",
    logo: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1200&h=300&fit=crop",
    productCount: 45,
    rating: 4.7,
    createdAt: "2019-01-10",
    address: {
      street: "23 Rue de la Paix",
      city: "Nice",
      postalCode: "06000",
      country: "France",
    },
    category: "Bijoux",
  },
];

export const mockProducts: Product[] = [
  {
    id: "p1",
    name: "Carnet artisanal en cuir",
    description:
      "Carnet relié à la main avec couverture en cuir véritable. 200 pages de papier recyclé ivoire. Parfait pour l'écriture, le dessin ou le journaling. Format A5.",
    price: 34.9,
    category: "Papeterie",
    categoryId: "cat-1",
    stock: 12,
    stockThreshold: 5,
    rating: 4.7,
    reviewCount: 89,
    storeId: "s1",
    storeName: "Atelier Dumas",
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-01-15",
  },
  {
    id: "p2",
    name: "Bougie parfumée artisanale",
    description:
      "Bougie coulée à la main avec cire de soja 100% naturelle. Parfum Fleur de Coton délicat et apaisant. Durée de combustion : 45 heures.",
    price: 18.5,
    category: "Maison",
    categoryId: "cat-2",
    stock: 3,
    stockThreshold: 5,
    rating: 4.3,
    reviewCount: 42,
    storeId: "s2",
    storeName: "La Fabrique",
    images: [
      "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1608181831688-ba943b5d2a5f?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-02-20",
  },
  {
    id: "p3",
    name: "Sac cabas en cuir naturel",
    description:
      "Sac cabas spacieux en cuir pleine fleur tanné végétal. Doublure en coton bio. Fermeture magnétique. Dimensions : 40x30x15 cm.",
    price: 149.0,
    category: "Mode",
    categoryId: "cat-3",
    stock: 8,
    stockThreshold: 3,
    rating: 4.9,
    reviewCount: 127,
    storeId: "s1",
    storeName: "Atelier Dumas",
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-01-10",
  },
  {
    id: "p4",
    name: "Collier Lune en argent",
    description:
      "Pendentif croissant de lune en argent 925 avec pierre de lune véritable. Chaîne ajustable 40-45 cm. Livré dans un écrin cadeau.",
    price: 65.0,
    category: "Bijoux",
    categoryId: "cat-4",
    stock: 15,
    stockThreshold: 5,
    rating: 4.6,
    reviewCount: 58,
    storeId: "s4",
    storeName: "Bijoux Céleste",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-03-01",
  },
  {
    id: "p5",
    name: "Set de cartes postales illustrées",
    description:
      "Ensemble de 12 cartes postales avec illustrations originales de Paris. Imprimées sur papier recyclé 300g. Format 10x15 cm.",
    price: 12.9,
    category: "Papeterie",
    categoryId: "cat-1",
    stock: 45,
    stockThreshold: 10,
    rating: 4.4,
    reviewCount: 31,
    storeId: "s3",
    storeName: "Papier & Co",
    images: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-02-15",
  },
  {
    id: "p6",
    name: "Diffuseur de parfum en rotin",
    description:
      "Diffuseur d'ambiance avec bâtonnets en rotin naturel. Parfum Bois de Santal. Contenance 200ml, durée 3 mois.",
    price: 28.0,
    category: "Maison",
    categoryId: "cat-2",
    stock: 22,
    stockThreshold: 8,
    rating: 4.5,
    reviewCount: 67,
    storeId: "s2",
    storeName: "La Fabrique",
    images: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1616169201999-0d80789c83e6?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-01-25",
  },
  {
    id: "p7",
    name: "Portefeuille minimaliste",
    description:
      "Portefeuille compact en cuir grainé. 6 emplacements cartes, poche billets, compartiment monnaie avec zip. Dimensions : 11x9 cm.",
    price: 59.0,
    category: "Mode",
    categoryId: "cat-3",
    stock: 0,
    stockThreshold: 5,
    rating: 4.8,
    reviewCount: 94,
    storeId: "s1",
    storeName: "Atelier Dumas",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-02-01",
  },
  {
    id: "p8",
    name: "Boucles d'oreilles Gouttes",
    description:
      "Boucles d'oreilles pendantes en argent 925 avec améthyste facettée. Longueur totale : 3,5 cm. Fermoirs à levier.",
    price: 45.0,
    category: "Bijoux",
    categoryId: "cat-4",
    stock: 20,
    stockThreshold: 5,
    rating: 4.7,
    reviewCount: 43,
    storeId: "s4",
    storeName: "Bijoux Céleste",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-03-05",
  },
  {
    id: "p9",
    name: "Stylo plume en bois",
    description:
      "Stylo plume artisanal en noyer français. Plume acier inoxydable moyenne. Livré avec convertisseur et cartouche d'encre bleue.",
    price: 42.0,
    category: "Papeterie",
    categoryId: "cat-1",
    stock: 7,
    stockThreshold: 5,
    rating: 4.9,
    reviewCount: 112,
    storeId: "s3",
    storeName: "Papier & Co",
    images: [
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-01-20",
  },
  {
    id: "p10",
    name: "Coussin brodé main",
    description:
      "Housse de coussin en lin avec broderie florale artisanale. Dimensions : 45x45 cm. Fermeture zip invisible. Coussin non inclus.",
    price: 38.0,
    category: "Maison",
    categoryId: "cat-2",
    stock: 11,
    stockThreshold: 5,
    rating: 4.4,
    reviewCount: 29,
    storeId: "s2",
    storeName: "La Fabrique",
    images: [
      "https://images.unsplash.com/photo-1629949009765-40c3bb839eb4?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-02-28",
  },
  {
    id: "p11",
    name: "Bracelet tressé cuir",
    description:
      "Bracelet en cuir tressé avec fermoir magnétique en acier. Tour de poignet ajustable 18-20 cm. Disponible en marron et noir.",
    price: 32.0,
    category: "Mode",
    categoryId: "cat-3",
    stock: 25,
    stockThreshold: 8,
    rating: 4.5,
    reviewCount: 76,
    storeId: "s1",
    storeName: "Atelier Dumas",
    images: [
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-03-10",
  },
  {
    id: "p12",
    name: "Bague Fleur en argent",
    description:
      "Bague fleur délicate en argent 925 avec zircon central. Ajustable de la taille 50 à 54. Livrée dans une pochette en velours.",
    price: 39.0,
    category: "Bijoux",
    categoryId: "cat-4",
    stock: 18,
    stockThreshold: 5,
    rating: 4.6,
    reviewCount: 51,
    storeId: "s4",
    storeName: "Bijoux Céleste",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=600&fit=crop",
    ],
    isActive: true,
    createdAt: "2024-02-10",
  },
];

export const mockReviews: Review[] = [
  {
    id: "r1",
    productId: "p1",
    userId: "u1",
    userName: "Marie D.",
    rating: 5,
    comment: "Magnifique carnet, la qualité du cuir est exceptionnelle. Les pages sont agréables à écrire. Je recommande !",
    date: "2024-03-15",
  },
  {
    id: "r2",
    productId: "p1",
    userId: "u2",
    userName: "Pierre L.",
    rating: 4,
    comment: "Très beau carnet, parfait pour offrir. La livraison était rapide.",
    date: "2024-03-10",
  },
  {
    id: "r3",
    productId: "p1",
    userId: "u3",
    userName: "Sophie M.",
    rating: 5,
    comment: "J'adore ! C'est mon troisième achat chez ce vendeur, toujours satisfaite.",
    date: "2024-02-28",
  },
];

export const mockOrders: Order[] = [
  {
    id: "cmd-001",
    status: "livre",
    total: 52.4,
    date: "2024-03-15",
    items: [
      {
        productId: "p1",
        productName: "Carnet artisanal en cuir",
        productImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=100&h=100&fit=crop",
        quantity: 1,
        unitPrice: 34.9,
        lineTotal: 34.9,
      },
      {
        productId: "p2",
        productName: "Bougie parfumée artisanale",
        productImage: "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=100&h=100&fit=crop",
        quantity: 1,
        unitPrice: 18.5,
        lineTotal: 18.5,
      },
    ],
    client: {
      name: "Marie Dupont",
      email: "marie.dupont@email.com",
    },
    deliveryAddress: {
      firstName: "Marie",
      lastName: "Dupont",
      addressLine1: "15 Rue de la République",
      city: "Lyon",
      postalCode: "69001",
      country: "France",
    },
    subOrders: [
      {
        id: "sub-001-1",
        orderId: "cmd-001",
        storeId: "s1",
        storeName: "Atelier Dumas",
        status: "livre",
        total: 34.9,
        items: [
          {
            productId: "p1",
            productName: "Carnet artisanal en cuir",
            productImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=100&h=100&fit=crop",
            quantity: 1,
            unitPrice: 34.9,
            lineTotal: 34.9,
          },
        ],
        statusHistory: [
          { status: "en_attente", timestamp: "2024-03-15T10:00:00Z" },
          { status: "en_preparation", timestamp: "2024-03-15T14:30:00Z" },
          { status: "expedie", timestamp: "2024-03-16T09:00:00Z" },
          { status: "livre", timestamp: "2024-03-18T11:00:00Z" },
        ],
      },
      {
        id: "sub-001-2",
        orderId: "cmd-001",
        storeId: "s2",
        storeName: "La Fabrique",
        status: "livre",
        total: 18.5,
        items: [
          {
            productId: "p2",
            productName: "Bougie parfumée artisanale",
            productImage: "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=100&h=100&fit=crop",
            quantity: 1,
            unitPrice: 18.5,
            lineTotal: 18.5,
          },
        ],
        statusHistory: [
          { status: "en_attente", timestamp: "2024-03-15T10:00:00Z" },
          { status: "en_preparation", timestamp: "2024-03-15T16:00:00Z" },
          { status: "expedie", timestamp: "2024-03-16T10:30:00Z" },
          { status: "livre", timestamp: "2024-03-18T14:00:00Z" },
        ],
      },
    ],
  },
  {
    id: "cmd-002",
    status: "expedie",
    total: 149.0,
    date: "2024-03-18",
    items: [
      {
        productId: "p3",
        productName: "Sac cabas en cuir naturel",
        productImage: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&h=100&fit=crop",
        quantity: 1,
        unitPrice: 149.0,
        lineTotal: 149.0,
      },
    ],
    client: {
      name: "Jean Martin",
      email: "jean.martin@email.com",
    },
    deliveryAddress: {
      firstName: "Jean",
      lastName: "Martin",
      addressLine1: "8 Avenue Victor Hugo",
      city: "Paris",
      postalCode: "75016",
      country: "France",
    },
    subOrders: [
      {
        id: "sub-002-1",
        orderId: "cmd-002",
        storeId: "s1",
        storeName: "Atelier Dumas",
        status: "expedie",
        total: 149.0,
        items: [
          {
            productId: "p3",
            productName: "Sac cabas en cuir naturel",
            productImage: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100&h=100&fit=crop",
            quantity: 1,
            unitPrice: 149.0,
            lineTotal: 149.0,
          },
        ],
        statusHistory: [
          { status: "en_attente", timestamp: "2024-03-18T09:00:00Z" },
          { status: "en_preparation", timestamp: "2024-03-18T11:00:00Z" },
          { status: "expedie", timestamp: "2024-03-19T08:30:00Z" },
        ],
      },
    ],
  },
  {
    id: "cmd-003",
    status: "en_preparation",
    total: 110.0,
    date: "2024-03-20",
    items: [
      {
        productId: "p4",
        productName: "Collier Lune en argent",
        productImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=100&h=100&fit=crop",
        quantity: 1,
        unitPrice: 65.0,
        lineTotal: 65.0,
      },
      {
        productId: "p8",
        productName: "Boucles d'oreilles Gouttes",
        productImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=100&h=100&fit=crop",
        quantity: 1,
        unitPrice: 45.0,
        lineTotal: 45.0,
      },
    ],
    client: {
      name: "Claire Bernard",
      email: "claire.bernard@email.com",
    },
    deliveryAddress: {
      firstName: "Claire",
      lastName: "Bernard",
      addressLine1: "22 Rue des Fleurs",
      city: "Marseille",
      postalCode: "13001",
      country: "France",
    },
    subOrders: [
      {
        id: "sub-003-1",
        orderId: "cmd-003",
        storeId: "s4",
        storeName: "Bijoux Céleste",
        status: "en_preparation",
        total: 110.0,
        items: [
          {
            productId: "p4",
            productName: "Collier Lune en argent",
            productImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=100&h=100&fit=crop",
            quantity: 1,
            unitPrice: 65.0,
            lineTotal: 65.0,
          },
          {
            productId: "p8",
            productName: "Boucles d'oreilles Gouttes",
            productImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=100&h=100&fit=crop",
            quantity: 1,
            unitPrice: 45.0,
            lineTotal: 45.0,
          },
        ],
        statusHistory: [
          { status: "en_attente", timestamp: "2024-03-20T14:00:00Z" },
          { status: "en_preparation", timestamp: "2024-03-20T16:30:00Z" },
        ],
      },
    ],
  },
  {
    id: "cmd-004",
    status: "en_attente",
    total: 70.9,
    date: "2024-03-21",
    items: [
      {
        productId: "p5",
        productName: "Set de cartes postales illustrées",
        productImage: "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=100&h=100&fit=crop",
        quantity: 2,
        unitPrice: 12.9,
        lineTotal: 25.8,
      },
      {
        productId: "p9",
        productName: "Stylo plume en bois",
        productImage: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=100&h=100&fit=crop",
        quantity: 1,
        unitPrice: 42.0,
        lineTotal: 42.0,
      },
    ],
    client: {
      name: "Lucas Petit",
      email: "lucas.petit@email.com",
    },
    deliveryAddress: {
      firstName: "Lucas",
      lastName: "Petit",
      addressLine1: "5 Place de la Mairie",
      city: "Toulouse",
      postalCode: "31000",
      country: "France",
    },
    subOrders: [
      {
        id: "sub-004-1",
        orderId: "cmd-004",
        storeId: "s3",
        storeName: "Papier & Co",
        status: "en_attente",
        total: 70.9,
        items: [
          {
            productId: "p5",
            productName: "Set de cartes postales illustrées",
            productImage: "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=100&h=100&fit=crop",
            quantity: 2,
            unitPrice: 12.9,
            lineTotal: 25.8,
          },
          {
            productId: "p9",
            productName: "Stylo plume en bois",
            productImage: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=100&h=100&fit=crop",
            quantity: 1,
            unitPrice: 42.0,
            lineTotal: 42.0,
          },
        ],
        statusHistory: [
          { status: "en_attente", timestamp: "2024-03-21T10:00:00Z" },
        ],
      },
    ],
  },
];

export const mockVendorSubOrders: SubOrder[] = mockOrders.flatMap(
  (order) => order.subOrders
);

export const mockCart: Cart = {
  items: [
    {
      productId: "p1",
      product: mockProducts[0],
      quantity: 2,
    },
    {
      productId: "p4",
      product: mockProducts[3],
      quantity: 1,
    },
  ],
  subtotal: 134.8,
  storeGroups: [
    {
      storeId: "s1",
      storeName: "Atelier Dumas",
      items: [
        {
          productId: "p1",
          product: mockProducts[0],
          quantity: 2,
        },
      ],
      subtotal: 69.8,
    },
    {
      storeId: "s4",
      storeName: "Bijoux Céleste",
      items: [
        {
          productId: "p4",
          product: mockProducts[3],
          quantity: 1,
        },
      ],
      subtotal: 65.0,
    },
  ],
};

export const mockVendorStats: VendorStats = {
  revenue: 4320,
  revenueChange: 12,
  ordersReceived: 47,
  activeProducts: 23,
  averageRating: 4.6,
};

// Helper to get products by store
export function getProductsByStore(storeId: string): Product[] {
  return mockProducts.filter((p) => p.storeId === storeId);
}

// Helper to get low stock products
export function getLowStockProducts(): Product[] {
  return mockProducts.filter((p) => p.stock <= p.stockThreshold);
}

// Helper to filter products
export function filterProducts(params: {
  q?: string;
  category?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}): Product[] {
  return mockProducts.filter((p) => {
    if (params.q && !p.name.toLowerCase().includes(params.q.toLowerCase())) {
      return false;
    }
    if (params.category && p.category !== params.category) {
      return false;
    }
    if (params.storeId && p.storeId !== params.storeId) {
      return false;
    }
    if (params.minPrice && p.price < params.minPrice) {
      return false;
    }
    if (params.maxPrice && p.price > params.maxPrice) {
      return false;
    }
    if (params.minRating && p.rating < params.minRating) {
      return false;
    }
    return true;
  });
}
