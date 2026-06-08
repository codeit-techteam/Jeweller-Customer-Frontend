import type { CatalogProduct } from "@/lib/services/productCatalog";

export type SearchSuggestionKind =
  | "product"
  | "category"
  | "occasion"
  | "collection"
  | "trending_chip"
  | "relationship_section";

export type SearchSuggestion = {
  key: string;
  kind: SearchSuggestionKind;
  label: string;
  subtitle?: string;
  productId?: string;
  categoryParam?: string;
  categorySlug?: string;
  productCount?: number;
  imageUri?: string;
  price?: number;
  boutiqueName?: string;
  boutiqueVerified?: boolean;
  collectionSlug?: string;
  chipLabel?: string;
  relationshipSectionId?: string;
};

type CategoryRow = { id: string; label: string; categoryParam: string };
type OccasionRow = { id: string; title: string; collectionSlug: string };
type RelationshipRow = { id: string; title: string };
type CollectionRow = { id: string; title: string; slug: string };
type ChipRow = { id: string; label: string };

export type BuildSearchSuggestionsInput = {
  /** Immediate trimmed query — drives category / occasion / collection chips. */
  q: string;
  /** Debounced query — aligned with product grid. */
  debouncedQ: string;
  categories: CategoryRow[];
  occasions: OccasionRow[];
  relationships: RelationshipRow[];
  collections: CollectionRow[];
  chips: ChipRow[];
  /** Already `filterCatalog` output for `debouncedQ`. */
  productHits: CatalogProduct[];
  /** Full catalog — used for per-category product counts in suggestions. */
  allProducts?: CatalogProduct[];
};

const MAX_TOTAL = 14;
const MAX_PRODUCTS = 4;

function countCategoryProducts(
  products: CatalogProduct[],
  categoryParam: string,
): number {
  const needle = categoryParam.trim().toLowerCase();
  if (!needle) return 0;
  return products.filter(
    (p) => p.category.trim().toLowerCase() === needle,
  ).length;
}

function categorySlugFromParam(categoryParam: string): string {
  return categoryParam.trim().toLowerCase().replace(/\s+/g, "-");
}

/**
 * Merges catalog matches with taxonomy chips for the live suggestions rail.
 * Dedupes by kind + normalized label.
 */
export function buildSearchSuggestions(
  input: BuildSearchSuggestionsInput,
): SearchSuggestion[] {
  const q = input.q.trim().toLowerCase();
  const dq = input.debouncedQ.trim().toLowerCase();
  if (!q) return [];

  const categories: SearchSuggestion[] = [];
  const products: SearchSuggestion[] = [];
  const others: SearchSuggestion[] = [];
  const seen = new Set<string>();
  const catalog = input.allProducts ?? input.productHits;

  const push = (bucket: SearchSuggestion[], row: SearchSuggestion) => {
    const dedupe = `${row.kind}:${row.label.trim().toLowerCase()}`;
    if (seen.has(dedupe)) return false;
    seen.add(dedupe);
    bucket.push(row);
    return true;
  };

  const match = (label: string, needle: string) =>
    needle.length > 0 && label.toLowerCase().includes(needle);

  for (const c of input.categories) {
    if (match(c.label, q)) {
      push(categories, {
        key: `c-${c.id}`,
        kind: "category",
        label: c.label,
        subtitle: "Category",
        categoryParam: c.categoryParam,
        categorySlug: categorySlugFromParam(c.categoryParam),
        productCount: countCategoryProducts(catalog, c.categoryParam),
      });
    }
  }

  const productNeedle = dq.length >= 1 ? dq : q.length >= 1 ? q : "";
  if (productNeedle) {
    for (const p of input.productHits.slice(0, MAX_PRODUCTS)) {
      const name = p.name?.trim();
      if (!name) continue;
      push(products, {
        key: `p-${p.id}`,
        kind: "product",
        label: name,
        subtitle: "Product",
        productId: p.id,
        imageUri: p.imageUri,
        price: p.price,
        boutiqueName: p.boutiqueName ?? undefined,
        boutiqueVerified: p.boutiqueVerified,
      });
    }
  }

  for (const o of input.occasions) {
    if (match(o.title, q)) {
      push(others, {
        key: `o-${o.id}`,
        kind: "occasion",
        label: o.title,
        subtitle: "Occasion",
        collectionSlug: o.collectionSlug.trim(),
      });
    }
  }

  for (const col of input.collections) {
    if (match(col.title, q)) {
      push(others, {
        key: `col-${col.id}`,
        kind: "collection",
        label: col.title,
        subtitle: "Collection",
        collectionSlug: col.slug.trim(),
      });
    }
  }

  for (const r of input.relationships) {
    if (match(r.title, q)) {
      push(others, {
        key: `r-${r.id}`,
        kind: "relationship_section",
        label: r.title,
        subtitle: "Relationship",
        relationshipSectionId: r.id,
      });
    }
  }

  for (const ch of input.chips) {
    if (match(ch.label, q)) {
      push(others, {
        key: `t-${ch.id}`,
        kind: "trending_chip",
        label: ch.label,
        subtitle: "Trending",
        chipLabel: ch.label,
      });
    }
  }

  return [...categories, ...products, ...others].slice(0, MAX_TOTAL);
}
