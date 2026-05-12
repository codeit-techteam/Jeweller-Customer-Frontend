/**
 * Centralized product catalog — single source of truth for every screen that
 * needs product data (Discover, Search, Women/Men/Kids/etc Collections,
 * Boutique Profile, Product Detail, Wishlist, Recently Viewed).
 *
 * Behaviour
 * - Fetches the latest active products from the backend in one shot.
 * - In-memory cache with a short TTL so consecutive screens reuse the same data.
 * - `invalidateProductCatalog()` clears the cache so the next call refetches
 *   (used after admin updates or when a screen regains focus).
 * - All search, filtering and grouping happens on the cached list — no static
 *   or mock arrays are read here.
 */

import { getProducts } from "@/services/api";
import { PLACEHOLDER_IMAGE_URI } from "@/lib/services/mock/imageUrls";

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUri: string;
  imageTint: string;
  category: string;
  categoryId: string | null;
  boutiqueId: string | null;
  boutiqueName: string | null;
  /** Rating of the boutique this product is offered at (0-5). */
  boutiqueRating: number | null;
  /** Whether the linked boutique is verified by Luxe & Co. */
  boutiqueVerified: boolean;
  /** Normalised lower-case for filtering. */
  gender: string;
  occasion: string;
  style: string;
  collectionName: string;
  metals: string[];
  /** `true` when product is flagged trending in admin. */
  trending: boolean;
  /** Discount % when applicable (admin-managed). */
  discountPercentage: number | null;
};

type CacheEntry = { at: number; data: CatalogProduct[] };

const CATALOG_TTL_MS = 30_000;
let cache: CacheEntry | null = null;
let inflight: Promise<CatalogProduct[]> | null = null;

type ApiProductRow = Awaited<ReturnType<typeof getProducts>>[number];

function safeString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function resolveImage(row: ApiProductRow): string {
  const candidates: Array<unknown> = [
    (row as { thumbnail_image?: unknown }).thumbnail_image,
    (row as { primary_image?: unknown }).primary_image,
    (row as { featured_image?: unknown }).featured_image,
    Array.isArray((row as { gallery_images?: unknown }).gallery_images)
      ? ((row as { gallery_images?: unknown }).gallery_images as unknown[])[0]
      : null,
    Array.isArray((row as { images?: unknown }).images)
      ? ((row as { images?: unknown }).images as unknown[])[0]
      : null,
    Array.isArray((row as { product_images?: unknown }).product_images)
      ? ((row as { product_images?: Array<{ image_url?: unknown }> })
          .product_images?.[0]?.image_url ?? null)
      : null,
    (row as { image?: unknown }).image,
  ];
  for (const candidate of candidates) {
    const value = safeString(candidate);
    if (value) return value;
  }
  return PLACEHOLDER_IMAGE_URI;
}

function resolveMetals(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => safeString(entry)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => safeString(entry)).filter(Boolean);
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

function tintForId(id: string): string {
  const palette = ["#d4e4f0", "#e8e4dc", "#e8ecf2", "#e5d5c5", "#dce4ec"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) >>> 0;
  }
  return palette[hash % palette.length];
}

function mapRow(row: ApiProductRow): CatalogProduct {
  const categoryName = safeString(row.category?.name) || "JEWELLERY";
  const boutiqueName = safeString(row.boutique?.name);
  const boutiqueRatingRaw = row.boutique?.rating;
  const boutiqueRatingNumber =
    boutiqueRatingRaw == null ? null : Number(boutiqueRatingRaw);
  const boutiqueRating =
    boutiqueRatingNumber != null &&
    Number.isFinite(boutiqueRatingNumber) &&
    boutiqueRatingNumber > 0
      ? boutiqueRatingNumber
      : null;
  const boutiqueVerified = Boolean(
    (row.boutique as { is_verified?: unknown; verified?: unknown } | null | undefined)
      ?.is_verified ??
      (row.boutique as { is_verified?: unknown; verified?: unknown } | null | undefined)
        ?.verified ??
      false,
  );
  const discountRaw =
    (row as { discount_percentage?: unknown }).discount_percentage;
  const discountNumber = Number(discountRaw);
  return {
    id: row.id,
    name: safeString(row.name) || "Untitled piece",
    description:
      safeString((row as { description?: unknown }).description) || "",
    price: Number((row as { price?: unknown }).price ?? 0) || 0,
    imageUri: resolveImage(row),
    imageTint: tintForId(row.id),
    category: categoryName,
    categoryId: row.category_id ?? null,
    boutiqueId: row.boutique_id ?? null,
    boutiqueName: boutiqueName || null,
    boutiqueRating,
    boutiqueVerified,
    gender: safeString((row as { gender?: unknown }).gender),
    occasion: safeString((row as { occasion?: unknown }).occasion),
    style: safeString((row as { style?: unknown }).style),
    collectionName: safeString(
      (row as { collection_name?: unknown }).collection_name,
    ),
    metals: resolveMetals((row as { available_metals?: unknown }).available_metals),
    trending: Boolean(
      (row as { is_trending?: unknown }).is_trending ??
        (row as { trending?: unknown }).trending,
    ),
    discountPercentage:
      Number.isFinite(discountNumber) && discountNumber > 0
        ? discountNumber
        : null,
  };
}

async function fetchCatalogFromApi(): Promise<CatalogProduct[]> {
  const rows = await getProducts();
  return (rows ?? []).map(mapRow);
}

/**
 * Returns the full catalog from cache when fresh, otherwise refetches.
 * Pass `{ force: true }` after admin mutations to bypass the cache.
 */
export async function fetchProductCatalog(opts?: {
  force?: boolean;
}): Promise<CatalogProduct[]> {
  const force = Boolean(opts?.force);
  if (!force && cache && Date.now() - cache.at < CATALOG_TTL_MS) {
    return cache.data;
  }
  if (inflight && !force) return inflight;
  const promise = fetchCatalogFromApi()
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  inflight = promise;
  return promise;
}

/** Clears the cached catalog. Call after admin updates or on focus. */
export function invalidateProductCatalog() {
  cache = null;
  inflight = null;
}

/* ------------------------------------------------------------------ */
/* Search                                                             */
/* ------------------------------------------------------------------ */

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(query: string): string[] {
  return normalise(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function productSearchHaystack(product: CatalogProduct): string {
  const parts = [
    product.name,
    product.category,
    product.boutiqueName ?? "",
    product.gender,
    product.occasion,
    product.style,
    product.collectionName,
    product.description,
    product.metals.join(" "),
  ];
  return parts
    .map((part) => normalise(part ?? ""))
    .filter(Boolean)
    .join(" \u0001 ");
}

/**
 * Case-insensitive, partial-match, multi-token search over the live catalog.
 * Every token must match somewhere in the product's text fields, so
 * `"gold ring"` only returns products with both keywords.
 */
export function filterCatalog(
  products: CatalogProduct[],
  query: string,
): CatalogProduct[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  return products.filter((product) => {
    const haystack = productSearchHaystack(product);
    return tokens.every((token) => haystack.includes(token));
  });
}

/** Async helper — pulls latest catalog and filters in one call. */
export async function searchCatalogProducts(
  query: string,
): Promise<CatalogProduct[]> {
  if (!query.trim()) return [];
  const products = await fetchProductCatalog();
  return filterCatalog(products, query);
}

/* ------------------------------------------------------------------ */
/* Collection slug mapping                                            */
/* ------------------------------------------------------------------ */

export type CollectionSlug =
  | "women"
  | "men"
  | "kids"
  | "offers"
  | "gifts"
  | "wedding"
  | "anniversary"
  | "engagement"
  | "festive"
  | "heritage-bridal"
  | "daily-wear"
  | "birthday"
  | string;

type SlugRule = (product: CatalogProduct) => boolean;

function includesAny(haystack: string, needles: string[]): boolean {
  if (!haystack) return false;
  const value = haystack.toLowerCase();
  return needles.some((needle) => value.includes(needle));
}

const MEN_NEEDLES = ["men", "him", "male", "gent"];
const WOMEN_NEEDLES = ["women", "her", "ladies", "female"];
const KIDS_NEEDLES = ["kid", "infant", "child", "baby"];

function isWomenProduct(product: CatalogProduct): boolean {
  if (includesAny(product.gender, WOMEN_NEEDLES)) return true;
  if (includesAny(product.gender, MEN_NEEDLES)) return false;
  if (includesAny(product.gender, KIDS_NEEDLES)) return false;
  if (includesAny(product.category, KIDS_NEEDLES)) return false;
  if (includesAny(product.category, MEN_NEEDLES)) return false;
  if (includesAny(product.collectionName, WOMEN_NEEDLES)) return true;
  // Default catalogue is feminine when nothing else matches.
  return true;
}

function isMenProduct(product: CatalogProduct): boolean {
  if (includesAny(product.gender, MEN_NEEDLES)) return true;
  if (includesAny(product.category, MEN_NEEDLES)) return true;
  if (includesAny(product.collectionName, MEN_NEEDLES)) return true;
  return false;
}

function isKidsProduct(product: CatalogProduct): boolean {
  if (includesAny(product.gender, KIDS_NEEDLES)) return true;
  if (includesAny(product.category, KIDS_NEEDLES)) return true;
  if (includesAny(product.collectionName, KIDS_NEEDLES)) return true;
  return false;
}

function hasOccasion(product: CatalogProduct, needles: string[]): boolean {
  return (
    includesAny(product.occasion, needles) ||
    includesAny(product.collectionName, needles)
  );
}

const COLLECTION_RULES: Record<string, SlugRule> = {
  women: (p) => isWomenProduct(p),
  men: (p) => isMenProduct(p),
  kids: (p) => isKidsProduct(p),
  offers: (p) => (p.discountPercentage ?? 0) > 0,
  gifts: () => true,
  wedding: (p) => hasOccasion(p, ["wedding", "bridal"]),
  anniversary: (p) => hasOccasion(p, ["anniversary"]),
  engagement: (p) => hasOccasion(p, ["engagement"]),
  festive: (p) => hasOccasion(p, ["festive", "festival", "diwali"]),
  "heritage-bridal": (p) => hasOccasion(p, ["bridal", "heritage", "wedding"]),
  "daily-wear": (p) =>
    hasOccasion(p, ["daily", "office", "everyday", "casual"]),
  birthday: (p) => hasOccasion(p, ["birthday"]),
};

/** Resolves the relevant catalog subset for a marketing collection slug. */
export function selectCollectionProducts(
  products: CatalogProduct[],
  slug: string,
): CatalogProduct[] {
  const normalised = slug.trim().toLowerCase();
  const rule = COLLECTION_RULES[normalised];
  const list = rule ? products.filter(rule) : products.slice();
  // Fallback: if a rule yields zero results, show the full active catalog so
  // the screen never breaks. The user can still navigate to product details
  // from any item that the admin has published.
  if (list.length === 0) return products.slice();
  return list;
}

/** Async helper — pulls latest catalog and filters by slug. */
export async function fetchProductsForCollection(
  slug: string,
  opts?: { force?: boolean },
): Promise<CatalogProduct[]> {
  const products = await fetchProductCatalog(opts);
  return selectCollectionProducts(products, slug);
}
