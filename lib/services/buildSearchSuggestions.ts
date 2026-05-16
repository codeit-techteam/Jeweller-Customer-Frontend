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
};

const MAX_TOTAL = 14;
const MAX_PRODUCTS = 6;

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

  const out: SearchSuggestion[] = [];
  const seen = new Set<string>();

  const push = (row: SearchSuggestion) => {
    const dedupe = `${row.kind}:${row.label.trim().toLowerCase()}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    out.push(row);
  };

  const productNeedle = dq.length >= 2 ? dq : q.length >= 2 ? q : "";
  if (productNeedle) {
    for (const p of input.productHits.slice(0, MAX_PRODUCTS)) {
      const name = p.name?.trim();
      if (!name) continue;
      push({
        key: `p-${p.id}`,
        kind: "product",
        label: name,
        subtitle: "Product",
        productId: p.id,
      });
      if (out.length >= MAX_TOTAL) return out;
    }
  }

  const match = (label: string, needle: string) =>
    needle.length > 0 && label.toLowerCase().includes(needle);

  for (const c of input.categories) {
    if (match(c.label, q)) {
      push({
        key: `c-${c.id}`,
        kind: "category",
        label: c.label,
        subtitle: "Category",
        categoryParam: c.categoryParam,
      });
    }
    if (out.length >= MAX_TOTAL) return out;
  }

  for (const o of input.occasions) {
    if (match(o.title, q)) {
      push({
        key: `o-${o.id}`,
        kind: "occasion",
        label: o.title,
        subtitle: "Occasion",
        collectionSlug: o.collectionSlug.trim(),
      });
    }
    if (out.length >= MAX_TOTAL) return out;
  }

  for (const col of input.collections) {
    if (match(col.title, q)) {
      push({
        key: `col-${col.id}`,
        kind: "collection",
        label: col.title,
        subtitle: "Collection",
        collectionSlug: col.slug.trim(),
      });
    }
    if (out.length >= MAX_TOTAL) return out;
  }

  for (const r of input.relationships) {
    if (match(r.title, q)) {
      push({
        key: `r-${r.id}`,
        kind: "relationship_section",
        label: r.title,
        subtitle: "Relationship",
        relationshipSectionId: r.id,
      });
    }
    if (out.length >= MAX_TOTAL) return out;
  }

  for (const ch of input.chips) {
    if (match(ch.label, q)) {
      push({
        key: `t-${ch.id}`,
        kind: "trending_chip",
        label: ch.label,
        subtitle: "Trending",
        chipLabel: ch.label,
      });
    }
    if (out.length >= MAX_TOTAL) return out;
  }

  return out;
}
