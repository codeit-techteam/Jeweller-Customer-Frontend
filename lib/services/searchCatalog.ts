/**
 * Search adapter — re-exports the centralized product catalog so existing
 * call-sites that import `SearchableProduct` / `formatCategoryLabel` continue
 * to compile. The actual data and matching logic now live in
 * `productCatalog.ts` so admin edits propagate instantly and no mock arrays
 * are read.
 */

import type { CatalogProduct } from "@/lib/services/productCatalog";

export type SearchableProduct = {
  id: string;
  name: string;
  category: string;
  /** Display-ready price, e.g. "₹ 1,45,000" */
  priceLabel: string;
  imageUri: string;
  imageTint: string;
  description: string;
  /** Boutique that publishes the piece — used for richer match feedback. */
  boutiqueName: string;
  /** Freeform keywords powering contextual matches. */
  keywords: string[];
};

const formatInr = (n: number): string =>
  Number.isFinite(n) && n > 0 ? `₹ ${n.toLocaleString("en-IN")}` : "";

/** Friendlier, sentence-case category display for result meta lines. */
export function formatCategoryLabel(category: string): string {
  if (!category) return "";
  const lower = category.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function catalogProductToSearchable(
  product: CatalogProduct,
): SearchableProduct {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    priceLabel: formatInr(product.price),
    imageUri: product.imageUri,
    imageTint: product.imageTint,
    description: product.description,
    boutiqueName: product.boutiqueName ?? "",
    keywords: [
      product.gender,
      product.occasion,
      product.style,
      product.collectionName,
      ...product.metals,
    ].filter(Boolean),
  };
}
