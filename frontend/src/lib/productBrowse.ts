import type { Category, Product } from "@/types";

export const PUBLIC_PRODUCTS_LIMIT = 100;

const normalizeSearchQuery = (query: string) => query.trim().toLowerCase();

export function buildCategoriesFromProducts(
  products: Product[],
  limit?: number,
): Category[] {
  const categoryCounts = new Map<string, number>();

  products.forEach((product) => {
    const categoryName = product.category.trim();
    if (!categoryName) return;

    categoryCounts.set(
      categoryName,
      (categoryCounts.get(categoryName) ?? 0) + 1,
    );
  });

  const categories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .map(([name, productCount], index) => ({
      id: `category-${index + 1}-${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
      productCount,
    }));

  if (typeof limit === "number") {
    return categories.slice(0, limit);
  }

  return categories;
}

export function filterProductsBySearchQuery(
  products: Product[],
  query: string,
): Product[] {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  return products.filter((product) =>
    [
      product.name,
      product.description,
      product.category,
      product.storeName,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

export function getRelatedProducts(
  products: Product[],
  currentProduct: Product,
  limit = 4,
): Product[] {
  return products
    .filter(
      (product) =>
        product.id !== currentProduct.id &&
        product.category === currentProduct.category,
    )
    .slice(0, limit);
}
