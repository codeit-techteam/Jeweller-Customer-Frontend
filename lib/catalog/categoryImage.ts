/**
 * Category image resolution — priority:
 * 1. CMS upload URL from `image` or `category_image_url` (any valid http/https)
 * 2. Curated Unsplash map by slug/name (verified HTTP 200)
 * 3. null — caller uses RemoteImage placeholder="category"
 */

const q = (photoId: string, w = 800) =>
  `https://images.unsplash.com/${photoId}?w=${w}&q=85&auto=format&fit=crop&crop=center`;

/**
 * Unsplash IDs that return 404 on images.unsplash.com — ignore stale DB values
 * so the app falls back to curated URLs instead of blank tiles.
 */
export const BROKEN_UNSPLASH_PHOTO_IDS = [
  "photo-1620336655055-b57986f6e9e2",
  "photo-1606166327273-99629c102a07",
  "photo-1610375461240-597caedda88e",
  "photo-1535632066927-ab7c95ab70b6",
  "photo-1588444650733-d2c8a2eac3c5",
  "photo-1573408304045-c59d01b444f7",
  "photo-1515562141207-7e88fb950be7",
  "photo-1611658471626-53b62d81650a",
] as const;

/** Original Rings hero — do not replace (user-approved). */
export const RINGS_CATEGORY_PHOTO_ID = "photo-1617038260897-41a1f14a8ca0";

/** Unique, category-specific luxury jewellery photos (verified on CDN). */
export const CURATED_CATEGORY_UNSPLASH: Record<string, string> = {
  rings: q(RINGS_CATEGORY_PHOTO_ID),
  bangles: q("photo-1596944924616-7b38e7cfac36"),
  bracelets: q("photo-1721808085307-919cf89fe3fa"),
  coins: q("photo-1601121141461-9d6647bca1ed"),
  earrings: q("photo-1599643478518-a784e5dc4c8f"),
  "gold-coins": q("photo-1631982690223-8aa4be0a2497"),
  mangalsutras: q("photo-1617038220319-276d3cfab638"),
  "mens-rings": q("photo-1605100804763-247f67b3557e"),
  necklaces: q("photo-1602751584552-8ba73aad10e1"),
  "nose-pins": q("photo-1611955167811-4711904bb9f8"),
  pendants: q("photo-1611591437281-460bfbe1220a"),
  solitaires: q("photo-1708222170603-12471477b1d9"),
};

export function normalizeCategoryKey(nameOrSlug: string): string {
  return nameOrSlug
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isHttpUrl(value: string | null | undefined): value is string {
  return Boolean(value && typeof value === "string" && value.trim().startsWith("http"));
}

export function isBrokenUnsplashUrl(url: string): boolean {
  return BROKEN_UNSPLASH_PHOTO_IDS.some((id) => url.includes(id));
}

export function curatedCategoryImageUrl(nameOrSlug: string): string | null {
  const key = normalizeCategoryKey(nameOrSlug);
  if (CURATED_CATEGORY_UNSPLASH[key]) return CURATED_CATEGORY_UNSPLASH[key];
  const compact = key.replace(/-/g, "");
  const match = Object.entries(CURATED_CATEGORY_UNSPLASH).find(
    ([slug]) => slug.replace(/-/g, "") === compact,
  );
  return match?.[1] ?? null;
}

export type CategoryImageSource = {
  category_image_url?: string | null;
  image?: string | null;
  name?: string | null;
  slug?: string | null;
};

function usableDbUrl(url: string | null | undefined): string | null {
  if (!isHttpUrl(url)) return null;
  const trimmed = url.trim();
  if (isBrokenUnsplashUrl(trimmed)) return null;
  return trimmed;
}

/**
 * Returns a display URL or null (caller should use placeholder="category").
 * Never returns another category's image as fallback.
 */
export function resolveCategoryImageUrl(source: CategoryImageSource): string | null {
  const db = usableDbUrl(source.image) ?? usableDbUrl(source.category_image_url) ?? null;
  if (db) return db;

  const bySlug = source.slug ? curatedCategoryImageUrl(source.slug) : null;
  if (bySlug) return bySlug;

  const byName = source.name ? curatedCategoryImageUrl(source.name) : null;
  if (byName) return byName;

  return null;
}
