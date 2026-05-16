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

import {
  ApiError,
  getCollectionBySlug,
  getGiftCollections,
  getMenuCategories,
  getOccasions,
  getOffers,
  getProducts,
} from "@/services/api";
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
/* CMS collection / menu / offer / gift / occasion product resolution   */
/* ------------------------------------------------------------------ */

type CmsProductResolution = { matched: boolean; ids: string[] };

/**
 * Resolve admin-curated product ids for a marketing slug. Order is preserved
 * from the first CMS source that yields a non-empty list, in priority:
 * collections → menu categories → offers → gift collections → occasions.
 *
 * If a CMS entity exists but has zero linked products, returns `{ matched:
 * true, ids: [] }` so callers render an empty grid (no heuristic fallback).
 * If no CMS row matches the slug at all, returns `{ matched: false }`.
 */
async function resolveCmsAttachedProductIds(slug: string): Promise<CmsProductResolution> {
  const key = slug.trim().toLowerCase();
  if (!key) return { matched: false, ids: [] };

  let collection: Awaited<ReturnType<typeof getCollectionBySlug>> = null;
  try {
    collection = await getCollectionBySlug(key);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      console.warn("[productCatalog] collection by slug failed", error);
    }
  }
  const collectionIds = collection?.products?.map((p) => p.id) ?? [];
  if (collectionIds.length > 0) {
    return { matched: true, ids: collectionIds };
  }

  let menuMatch:
    | Awaited<ReturnType<typeof getMenuCategories>>[number]
    | undefined;
  let offerMatch:
    | Awaited<ReturnType<typeof getOffers>>[number]
    | undefined;
  let giftMatch:
    | Awaited<ReturnType<typeof getGiftCollections>>[number]
    | undefined;
  let occasionMatch:
    | Awaited<ReturnType<typeof getOccasions>>[number]
    | undefined;

  try {
    const [menu, offers, gifts, occasions] = await Promise.all([
      getMenuCategories(),
      getOffers(),
      getGiftCollections(),
      getOccasions(),
    ]);

    menuMatch = menu.find((row) => (row.slug ?? "").toLowerCase() === key);
    const menuIds = menuMatch?.products?.map((p) => p.id) ?? [];
    if (menuIds.length > 0) return { matched: true, ids: menuIds };

    offerMatch = offers.find((row) => (row.slug ?? "").toLowerCase() === key);
    const offerIds = offerMatch?.products?.map((p) => p.id) ?? [];
    if (offerIds.length > 0) return { matched: true, ids: offerIds };

    giftMatch = gifts.find((row) => (row.slug ?? "").toLowerCase() === key);
    const giftIds = giftMatch?.products?.map((p) => p.id) ?? [];
    if (giftIds.length > 0) return { matched: true, ids: giftIds };

    occasionMatch = occasions.find(
      (row) =>
        (row.collection_slug ?? "").toLowerCase() === key ||
        ((row as { slug?: string | null }).slug ?? "").toLowerCase() === key,
    );
    const occasionIds = occasionMatch?.products?.map((p) => p.id) ?? [];
    if (occasionIds.length > 0) return { matched: true, ids: occasionIds };
  } catch (error) {
    console.warn("[productCatalog] admin CMS lookup failed", error);
  }

  const hadEntity = Boolean(
    collection ||
      menuMatch ||
      offerMatch ||
      giftMatch ||
      occasionMatch,
  );
  if (hadEntity) {
    return { matched: true, ids: [] };
  }

  return { matched: false, ids: [] };
}

/** Curated products for a collection / menu slug — Admin Panel order only. */
export async function fetchProductsForCollection(
  slug: string,
  opts?: { force?: boolean },
): Promise<CatalogProduct[]> {
  const products = await fetchProductCatalog(opts);
  const { matched, ids } = await resolveCmsAttachedProductIds(slug);

  if (!matched) {
    return [];
  }

  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered: CatalogProduct[] = [];
  for (const id of ids) {
    const hit = byId.get(id);
    if (hit) ordered.push(hit);
  }
  return ordered;
}
