import {
    ApiError,
    getBoutiqueById,
    getCategories,
    getCollectionBySlug,
    getCollections,
    getDiscoverFeaturedProducts,
    getFeaturedSections,
    getGiftCollections,
    getMenuCategories,
    getOccasions,
    getOffers,
    getProductById,
    getProducts,
    getRelationshipSections,
} from "@/services/api";
import { PLACEHOLDER_IMAGE_URI } from "@/lib/services/mock/imageUrls";
import {
  trendingSearches,
  type TrendingSearchChip,
} from "@/lib/services/mock/search";
import { fetchBoutiques } from "@/services/boutique.service";
import type { UserCoords } from "@/services/boutique.service";

export type ProductImage = {
  tint: string;
  /** Image URL for thumbnails & inactive hero. Never a raw video URL. */
  uri?: string;
  isVideo?: boolean;
  /** Video playback URL when `isVideo` is true (e.g. MP4). */
  videoSrc?: string;
};

type GalleryRow = Awaited<ReturnType<typeof getProductById>>;

type GalleryItem = { type: "image" | "video"; url: string };

function sortGalleryVideosLast(items: GalleryItem[]): GalleryItem[] {
  const images = items.filter((i) => i.type === "image");
  const videos = items.filter((i) => i.type === "video");
  return [...images, ...videos];
}

function mapRowToVideoSlide(row: GalleryRow): ProductImage {
  const poster =
    typeof row.video_thumbnail === "string" && row.video_thumbnail.trim()
      ? row.video_thumbnail.trim()
      : undefined;
  const src =
    typeof row.video_url === "string" && row.video_url.trim()
      ? row.video_url.trim()
      : "";
  return {
    tint: "#e8e4dc",
    uri: poster,
    isVideo: true,
    videoSrc: src || undefined,
  };
}

function galleryItemToProductImage(
  item: GalleryItem,
  index: number,
  row: GalleryRow,
): ProductImage {
  const tint =
    index % 2 === 0 ? "#d4e4f0" : "#e8e4dc";
  if (item.type === "video") {
    return {
      tint,
      uri:
        typeof row.video_thumbnail === "string" && row.video_thumbnail.trim()
          ? row.video_thumbnail.trim()
          : undefined,
      isVideo: true,
      videoSrc: item.url,
    };
  }
  return { tint, uri: item.url, isVideo: false };
}

function buildGalleryItems(row: GalleryRow): GalleryItem[] {
  if (row?.media?.length) {
    const cleaned: GalleryItem[] = row.media
      .filter(
        (m): m is { type: "image" | "video"; url: string } =>
          Boolean(
            m &&
              m.url &&
              typeof m.url === "string" &&
              m.url.trim().length > 0 &&
              (m.type === "image" || m.type === "video"),
          ),
      )
      .map((m) => ({
        type: m.type,
        url: m.url.trim(),
      }));
    return sortGalleryVideosLast(cleaned);
  }

  const out: GalleryItem[] = [];

  if (row?.gallery_images?.length) {
    for (const u of row.gallery_images) {
      const s = u != null ? String(u).trim() : "";
      if (s) out.push({ type: "image", url: s });
    }
  } else if (row?.images?.length) {
    for (const u of row.images) {
      const s = u != null ? String(u).trim() : "";
      if (s) out.push({ type: "image", url: s });
    }
  } else if (row?.featured_image?.trim()) {
    out.push({ type: "image", url: row.featured_image.trim() });
  }

  const vid = row?.video_url?.trim();
  if (vid && !out.some((i) => i.type === "video")) {
    out.push({ type: "video", url: vid });
  }

  if (!out.length) {
    const thumb = resolveThumbnail(row);
    if (thumb) out.push({ type: "image", url: thumb });
  }

  return sortGalleryVideosLast(out);
}
const UUID_V4_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const detailUiCache = new Map<string, { at: number; data: ProductDetail | null }>();
const DETAIL_TTL_MS = 45_000;

function takeDetailUiCache(id: string): ProductDetail | null | undefined {
  const hit = detailUiCache.get(id);
  if (!hit || Date.now() - hit.at > DETAIL_TTL_MS) return undefined;
  return hit.data;
}

function putDetailUiCache(id: string, data: ProductDetail | null) {
  detailUiCache.set(id, { at: Date.now(), data });
}

/**
 * Clear cached product-detail data so a screen revisit hits the backend.
 * Pass an `id` to drop just one entry, or no arg to drop the entire cache.
 */
export function invalidateProductDetailCache(id?: string) {
  if (id) {
    detailUiCache.delete(id);
    return;
  }
  detailUiCache.clear();
}

function boutiqueAvatarTint(seed: string): string {
  const palette = ["#c4a574", "#9cb4cc", "#d4a574", "#8b9dc3", "#b8a99a"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h + seed.charCodeAt(i) * (i + 1)) >>> 0;
  }
  return palette[h % palette.length];
}

function parseDynamicStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
}

function sizeSectionLabelFromCategory(category: string): string {
  const u = category.toUpperCase();
  if (u.includes("BRACELET")) return "LENGTH / SIZE";
  if (u.includes("NECK")) return "NECK SIZE / LENGTH";
  if (u.includes("BANGLE")) return "BANGLE SIZE";
  if (u.includes("ANKLET")) return "SIZE";
  if (u.includes("RING")) return "RING SIZE (US)";
  return "SIZE";
}

export function inferMetalFromName(name: string): string {
  if (/platinum/i.test(name)) return "Platinum";
  if (/silver/i.test(name)) return "Silver";
  if (/rose gold/i.test(name)) return "Rose Gold";
  return "Gold";
}

export type ProductDetail = {
  id: string;
  name: string;
  boutique_id: string | null;
  primary_boutique_id?: string | null;
  price: number;
  images: ProductImage[];
  description: string;
  rating: number;
  reviews: number;
  category: string;
  metal: string;
  sizeOptions: string[];
  metalOptions: string[];
  sizeSectionLabel: string;
  relatedIds: string[];
  limitedEdition?: boolean;
  discountLabel?: string;
  boutique: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
    address: string;
    location: string;
    distance: number | null;
    image: string | null;
    logo: string | null;
    avatarTint: string;
    phone?: string | null;
    whatsapp?: string | null;
    coordinates?: { lat: number; lng: number } | null;
    latitude?: number | null;
    longitude?: number | null;
    opening_time?: string | null;
    closing_time?: string | null;
    working_days?: string[] | null;
  };
  boutiquesAvailable: number;
  specs: { metal: string; weight: string; diamond: string; dimensions: string };
  /** When false, omit specifications block entirely on the PDP. */
  hasSpecsSection: boolean;
  priceBreakup: {
    gold: number;
    gemstone: number;
    making: number;
    gst: number;
  };
  /** When CMS provides totals, PDP uses them for reconciliation display. */
  priceBreakupDisplayTotal?: number | null;
  /** When CMS row exists for price_breakup JSON. */
  hasPriceBreakFromApi?: boolean;
  tags?: {
    gender?: string;
    occasion?: string;
    style?: string;
    collection?: string;
  };
};

export type CategoryProductUi = {
  id: string;
  name: string;
  category: string;
  price: number;
  thumbnail_image: string | null;
  metal: string;
  styles: string[];
  distanceKm: number;
  boutiqueId: string | null;
  boutiqueName: string | null;
  boutiqueRating: number | null;
  boutiqueVerified: boolean;
  boutiqueRatedHigh: boolean;
  services: ("walkin" | "appointment" | "call" | "whatsapp")[];
  openNow: boolean;
};

function priceBreakupFromTotal(total: number) {
  const gold = Math.round(total * 0.86);
  const gemstone = Math.round(total * 0.015);
  const making = Math.round(total * 0.03);
  const gst = Math.max(0, total - gold - gemstone - making);
  return { gold, gemstone, making, gst };
}

function uniqueOptions(options: string[]): string[] {
  return [...new Set(options)];
}

function resolveThumbnail(
  row:
    | Awaited<ReturnType<typeof getProductById>>
    | Awaited<ReturnType<typeof getProducts>>[number],
) {
  return (
    row?.thumbnail_image ??
    row?.primary_image ??
    row?.featured_image ??
    row?.gallery_images?.[0] ??
    row?.images?.[0] ??
    row?.product_images?.[0]?.image_url ??
    row?.image ??
    null
  );
}

function toMediaImages(row: GalleryRow): ProductImage[] {
  const items = buildGalleryItems(row);
  if (items.length) {
    return items.map((item, index) =>
      galleryItemToProductImage(item, index, row),
    );
  }

  const fromLegacy =
    row?.product_images
      ?.filter((item) => item?.image_url)
      .map((item, index) => ({
        tint: index % 2 === 0 ? "#d4e4f0" : "#e8e4dc",
        uri: item.image_url,
        isVideo: false,
      })) ?? [];
  if (fromLegacy.length) {
    const vid = row.video_url?.trim();
    if (vid) {
      return [...fromLegacy, mapRowToVideoSlide(row)];
    }
    return fromLegacy;
  }

  if (row?.featured_image?.trim()) {
    return [
      { tint: "#d4e4f0", uri: row.featured_image.trim(), isVideo: false },
    ];
  }

  if (row?.video_url?.trim()) {
    return [mapRowToVideoSlide(row)];
  }

  return [{ tint: "#d4e4f0", uri: row?.image ?? undefined, isVideo: false }];
}

export type CategoryUi = {
  id: string;
  name: string;
  image: string | null;
  slug: string | null;
  subtitle?: string | null;
  /** Admin-defined product order for this category, sourced from the
   * `category_products` junction (sort_order ascending). */
  productIds: string[];
};

export async function fetchCategoriesUi(): Promise<CategoryUi[]> {
  if (__DEV__) {
    console.log("Fetching categories...");
  }
  const rows = await getCategories();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    image: row.image ?? null,
    slug:
      row.slug ?? row.name.toLowerCase().replace(/\s+/g, "-"),
    subtitle: row.subtitle ?? null,
    productIds: Array.isArray(row.product_ids)
      ? row.product_ids
      : Array.isArray(row.products)
        ? row.products.map((item) => item.id)
        : [],
  }));
}

export async function fetchBoutiquesUi(userLocation?: UserCoords | null) {
  if (__DEV__) console.log("Fetching boutiques...");
  return fetchBoutiques(userLocation ?? undefined);
}

export type CollectionUi = {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  image: string | null;
  bannerImage: string | null;
  slug: string;
  isTrending: boolean;
  isFeatured: boolean;
  productIds: string[];
};

function toCollectionUi(row: Awaited<ReturnType<typeof getCollections>>[number]): CollectionUi {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    description: row.description ?? null,
    image: row.image ?? null,
    bannerImage: row.banner_image ?? null,
    slug: row.slug ?? row.title.toLowerCase().replace(/\s+/g, "-"),
    isTrending: Boolean(row.is_trending),
    isFeatured: Boolean(row.is_featured),
    productIds: Array.isArray(row.products)
      ? row.products.map((item) => item.id)
      : [],
  };
}

export async function fetchCollectionsUi(opts?: {
  trending?: boolean;
  featured?: boolean;
}): Promise<CollectionUi[]> {
  if (__DEV__) console.log("Fetching collections...", opts);
  const rows = await getCollections(opts);
  return rows.map(toCollectionUi);
}

export async function fetchCollectionBySlugUi(
  slug: string,
): Promise<CollectionUi | null> {
  if (!slug?.trim()) return null;
  try {
    const row = await getCollectionBySlug(slug.trim().toLowerCase());
    return row ? toCollectionUi(row) : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export type OccasionUi = {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  image: string | null;
  collectionSlug: string;
  productIds: string[];
};

export async function fetchOccasionsUi(): Promise<OccasionUi[]> {
  if (__DEV__) console.log("Fetching occasions...");
  const rows = await getOccasions();
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? "",
    description: row.description ?? null,
    image: row.image ?? null,
    collectionSlug:
      row.collection_slug ?? row.title.toLowerCase().replace(/\s+/g, "-"),
    productIds: Array.isArray(row.products)
      ? row.products.map((item) => item.id)
      : [],
  }));
}

export type MenuCategoryUi = {
  id: string;
  title: string;
  slug: string;
  collectionSlug: string;
  icon: string | null;
  image: string | null;
  badge: string | null;
  subtitle: string | null;
  productIds: string[];
};

export async function fetchMenuCategoriesUi(): Promise<MenuCategoryUi[]> {
  if (__DEV__) console.log("Fetching menu categories...");
  try {
    const rows = await getMenuCategories();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug ?? row.title.toLowerCase().replace(/\s+/g, "-"),
      collectionSlug:
        row.collection_slug ??
        row.slug ??
        row.title.toLowerCase().replace(/\s+/g, "-"),
      icon: row.icon ?? null,
      image: row.image ?? null,
      badge: row.badge ?? null,
      subtitle: row.subtitle ?? null,
      productIds: Array.isArray(row.products)
        ? row.products.map((item) => item.id)
        : [],
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn("[fetchMenuCategoriesUi] falling back", error.message);
      return [];
    }
    throw error;
  }
}

export type FeaturedSectionUi = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  bannerImage: string | null;
  layout: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string | null;
    discountPercentage: number | null;
  }>;
};

export async function fetchFeaturedSectionsUi(): Promise<FeaturedSectionUi[]> {
  if (__DEV__) console.log("Fetching featured sections...");
  try {
    const rows = await getFeaturedSections();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug ?? row.title.toLowerCase().replace(/\s+/g, "-"),
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      bannerImage: row.banner_image ?? null,
      layout: row.layout ?? "carousel",
      products: (row.products ?? []).map((product) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price ?? 0),
        image: product.image ?? null,
        discountPercentage:
          product.discount_percentage != null
            ? Number(product.discount_percentage)
            : null,
      })),
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn("[fetchFeaturedSectionsUi] failed", error.message);
      return [];
    }
    throw error;
  }
}

export type OfferUi = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  discountText: string | null;
  badge: string | null;
  image: string | null;
  bannerImage: string | null;
  ctaLabel: string | null;
  ctaTarget: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  productIds: string[];
  collections: Array<{
    id: string;
    title: string | null;
    slug: string | null;
    image: string | null;
  }>;
};

export async function fetchOffersUi(): Promise<OfferUi[]> {
  if (__DEV__) console.log("Fetching offers...");
  try {
    const rows = await getOffers();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug ?? row.title.toLowerCase().replace(/\s+/g, "-"),
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      discountText: row.discount_text ?? null,
      badge: row.badge ?? null,
      image: row.image ?? null,
      bannerImage: row.banner_image ?? null,
      ctaLabel: row.cta_label ?? null,
      ctaTarget: row.cta_target ?? null,
      startsAt: row.starts_at ?? null,
      expiresAt: row.expires_at ?? null,
      productIds: Array.isArray(row.products)
        ? row.products.map((item) => item.id)
        : [],
      collections: Array.isArray(row.collections)
        ? row.collections.map((collection) => ({
            id: collection.id,
            title: collection.title ?? null,
            slug: collection.slug ?? null,
            image: collection.image ?? null,
          }))
        : [],
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn("[fetchOffersUi] failed", error.message);
      return [];
    }
    throw error;
  }
}

export type GiftCollectionUi = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image: string | null;
  bannerImage: string | null;
  productIds: string[];
};

export async function fetchGiftCollectionsUi(): Promise<GiftCollectionUi[]> {
  if (__DEV__) console.log("Fetching gift collections...");
  try {
    const rows = await getGiftCollections();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug ?? row.title.toLowerCase().replace(/\s+/g, "-"),
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      image: row.image ?? null,
      bannerImage: row.banner_image ?? null,
      productIds: Array.isArray(row.products)
        ? row.products.map((item) => item.id)
        : [],
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn("[fetchGiftCollectionsUi] failed", error.message);
      return [];
    }
    throw error;
  }
}

export async function fetchCategoryProductsUi() {
  const rows = await getProducts();
  return rows.map((row, index): CategoryProductUi => {
    const boutique = row.boutique ?? null;
    const ratingRaw = boutique?.rating;
    const ratingNumber = ratingRaw == null ? null : Number(ratingRaw);
    const boutiqueRating =
      ratingNumber != null && Number.isFinite(ratingNumber) && ratingNumber > 0
        ? ratingNumber
        : null;
    const boutiqueVerified = Boolean(
      boutique?.is_verified ?? boutique?.verified ?? false,
    );
    return {
      id: row.id,
      name: row.name,
      category: row.category?.name ?? "RINGS",
      price: Number(row.price),
      thumbnail_image: resolveThumbnail(row),
      metal: inferMetalFromName(row.name),
      styles: ["Contemporary"],
      distanceKm: 1.2 + (index % 6),
      boutiqueId: boutique?.id ?? row.boutique_id ?? null,
      boutiqueName: boutique?.name?.trim() ? boutique.name.trim() : null,
      boutiqueRating,
      boutiqueVerified,
      boutiqueRatedHigh: (boutiqueRating ?? 0) >= 4.7,
      services: ["walkin", "appointment"],
      openNow: true,
    };
  });
}

export async function fetchRelationshipSectionsUi() {
  if (__DEV__) console.log("Fetching relationship sections...");
  try {
    const rows = await getRelationshipSections();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle ?? null,
      image: row.image ?? null,
      collectionSlug: row.collection_slug?.trim() || null,
      productIds: Array.isArray(row.product_ids)
        ? row.product_ids
        : Array.isArray(row.products)
          ? row.products.map((item) => item.id)
          : [],
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn("[fetchRelationshipSectionsUi] failed", error.message);
      return [];
    }
    throw error;
  }
}

export async function fetchTrendingCollectionChipsUi(): Promise<
  TrendingSearchChip[]
> {
  try {
    const rows = await getCollections({ trending: true });
    if (!rows.length) {
      return trendingSearches;
    }
    return rows.slice(0, 8).map((row, index) => ({
      id: row.id,
      label: row.title ?? row.slug ?? "Trending",
      variant: index === 0 ? ("vday" as const) : ("default" as const),
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      return trendingSearches;
    }
    throw error;
  }
}

export async function fetchTrendingProductsUi() {
  if (__DEV__) console.log("Fetching trending / Product right now…");

  const mapDiscoverFeatured = (
    rows: Awaited<ReturnType<typeof getDiscoverFeaturedProducts>>,
  ) =>
    rows.map((row, index) => ({
      id: row.id,
      title: row.name,
      description:
        (typeof row.description === "string" && row.description.trim()) ||
        "Curated selection",
      price: `₹ ${Number(row.price ?? 0).toLocaleString("en-IN")}`,
      imageTint: index % 2 === 0 ? "#d4e4f0" : "#e8e4dc",
      imageUri: row.image?.trim() ? row.image.trim() : PLACEHOLDER_IMAGE_URI,
      category: "FEATURED",
      boutiqueId: row.boutique?.id ?? null,
      boutiqueName: row.boutique?.name ?? null,
      boutiqueRating:
        row.boutique?.rating != null && Number.isFinite(Number(row.boutique.rating))
          ? Number(row.boutique.rating)
          : null,
      boutiqueVerified: Boolean(row.boutique?.verified),
    }));

  try {
    const discoverRows = await getDiscoverFeaturedProducts();
    if (discoverRows.length > 0) {
      return mapDiscoverFeatured(discoverRows);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      if (__DEV__) {
        console.warn(
          "[fetchTrendingProductsUi] discover featured empty or failed, trying Featured Sections",
          error.message,
        );
      }
    } else {
      throw error;
    }
  }

  try {
    const sections = await getFeaturedSections();
    const section = sections.find(
      (row) => (row.slug ?? "").trim().toLowerCase() === "trending-now",
    );
    const products = section?.products ?? [];
    if (!products.length) return [];

    return products.map((row, index) => ({
      id: row.id,
      title: row.name,
      description:
        section?.subtitle?.trim() ||
        section?.description?.trim() ||
        "Curated by Luxe & Co",
      price: `₹ ${Number(row.price ?? 0).toLocaleString("en-IN")}`,
      imageTint: index % 2 === 0 ? "#d4e4f0" : "#e8e4dc",
      imageUri: row.image?.trim() ? row.image.trim() : PLACEHOLDER_IMAGE_URI,
      category: "FEATURED",
      boutiqueId: null as string | null,
      boutiqueName: null as string | null,
      boutiqueRating: null as number | null,
      boutiqueVerified: false,
    }));
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn("[fetchTrendingProductsUi] featured sections failed", error.message);
      return [];
    }
    throw error;
  }
}

export async function fetchProductDetailUi(
  id: string,
): Promise<ProductDetail | null> {
  if (!id?.trim()) return null;
  if (!UUID_V4_LIKE.test(id)) {
    return null;
  }

  const cached = takeDetailUiCache(id);
  if (cached !== undefined) return cached;

  const row = await getProductById(id);
  if (!row) {
    putDetailUiCache(id, null);
    return null;
  }

  const category = row.category?.name ?? "RINGS";
  const price = Number(row.price);

  let relatedIds: string[] = [];
  let boutiquesAvailable = 3;
  try {
    const allProducts = await getProducts(row.category_id ?? undefined);
    relatedIds = allProducts
      .filter(
        (item) => item.id !== row.id && item.category_id === row.category_id,
      )
      .slice(0, 4)
      .map((item) => item.id);
    const boutiqueKeys = new Set<string>();
    for (const item of allProducts) {
      if (
        item.category_id === row.category_id &&
        item.boutique_id &&
        UUID_V4_LIKE.test(item.boutique_id)
      ) {
        boutiqueKeys.add(item.boutique_id);
      }
    }
    boutiquesAvailable = Math.min(
      18,
      Math.max(1, boutiqueKeys.size || 1),
    );
  } catch {
    relatedIds = [];
  }

  const mediaImages = toMediaImages(row);

  const sizeOptions = parseDynamicStringArray(row.available_sizes);
  const metalOptions = uniqueOptions(parseDynamicStringArray(row.available_metals));

  const discountRaw =
    row.discount_percentage != null ? Number(row.discount_percentage) : NaN;
  const discountLabel =
    Number.isFinite(discountRaw) && discountRaw > 0
      ? `${discountRaw % 1 === 0 ? String(discountRaw) : discountRaw.toFixed(1)}% OFF on Making Charges`
      : undefined;

  const reviews = Math.max(
    0,
    Math.floor(Number(row.reviews_count ?? 0)),
  );

  let ratingNum = row.rating != null ? Number(row.rating) : NaN;
  if (!Number.isFinite(ratingNum)) {
    ratingNum = 0;
  }

  const specObj =
    row.specifications && typeof row.specifications === "object"
      ? (row.specifications as Record<string, unknown>)
      : {};

  const pullSpec = (key: string) => {
    const v = specObj[key];
    const trimmed = v == null ? "" : String(v).trim();
    return trimmed.length ? trimmed : "";
  };

  const specsDisplay = {
    metal: pullSpec("metal"),
    weight: pullSpec("approxWeight"),
    diamond: pullSpec("diamondCarat"),
    dimensions: pullSpec("dimensions"),
  };

  const hasSpecsSection =
    Boolean(specsDisplay.metal) ||
    Boolean(specsDisplay.weight) ||
    Boolean(specsDisplay.diamond) ||
    Boolean(specsDisplay.dimensions);

  const pb =
    row.price_breakup &&
    typeof row.price_breakup === "object"
      ? (row.price_breakup as Record<string, unknown>)
      : null;

  const goldPb = pb != null ? Number(pb.gold ?? 0) : 0;
  const gemstonePb = pb != null ? Number(pb.gemstone ?? 0) : 0;
  const makingPb = pb != null ? Number(pb.makingCharge ?? pb.making ?? 0) : 0;
  const gstPb = pb != null ? Number(pb.gst ?? 0) : 0;

  let priceBreakup = priceBreakupFromTotal(price);
  let priceBreakupDisplayTotal: number | undefined;
  let hasPriceBreakFromApi = false;

  const hasPbSignal =
    pb != null &&
    [goldPb, gemstonePb, makingPb, gstPb].some(
      (n) => Number.isFinite(n) && n !== 0,
    );

  if (pb != null && hasPbSignal) {
    hasPriceBreakFromApi = true;
    priceBreakup = {
      gold: Number.isFinite(goldPb) ? goldPb : 0,
      gemstone: Number.isFinite(gemstonePb) ? gemstonePb : 0,
      making: Number.isFinite(makingPb) ? makingPb : 0,
      gst: Number.isFinite(gstPb) ? gstPb : 0,
    };
    const totalRaw =
      pb.total != null ? Number(pb.total as string | number) : NaN;
    if (Number.isFinite(totalRaw) && totalRaw > 0) {
      priceBreakupDisplayTotal = totalRaw;
    }
  }

  const defaultMetalInference = inferMetalFromName(row.name);

  const tagsDraft: NonNullable<ProductDetail["tags"]> = {};
  const gTxt = typeof row.gender === "string" ? row.gender.trim() : "";
  const oTxt = typeof row.occasion === "string" ? row.occasion.trim() : "";
  const sTxt = typeof row.style === "string" ? row.style.trim() : "";
  const cTxt =
    typeof row.collection_name === "string" ? row.collection_name.trim() : "";
  if (gTxt) tagsDraft.gender = gTxt;
  if (oTxt) tagsDraft.occasion = oTxt;
  if (sTxt) tagsDraft.style = sTxt;
  if (cTxt) tagsDraft.collection = cTxt;
  const tags: ProductDetail["tags"] =
    tagsDraft.gender ||
    tagsDraft.occasion ||
    tagsDraft.style ||
    tagsDraft.collection
      ? tagsDraft
      : undefined;

  const boutiqueIdFallback = row.boutique?.id ?? row.boutique_id ?? "";

  const result: ProductDetail = {
    id: row.id,
    name: row.name,
    boutique_id: row.boutique_id ?? null,
    primary_boutique_id: row.primary_boutique_id ?? row.boutique_id ?? null,
    price,
    images: mediaImages,
    description:
      row.description?.trim() ||
      `${row.name} — thoughtfully crafted fine jewellery.`,
    rating: ratingNum,
    reviews,
    category,
    metal: metalOptions[0] ?? defaultMetalInference,
    sizeOptions,
    metalOptions,
    sizeSectionLabel: sizeSectionLabelFromCategory(category),
    relatedIds,
    discountLabel,
    boutique: {
      id: boutiqueIdFallback,
      name: row.boutique?.name ?? "Partner Boutique",
      rating: Number.isFinite(Number(row.boutique?.rating))
        ? Number(row.boutique?.rating)
        : 0,
      verified: Boolean(
        row.boutique?.is_verified ?? row.boutique?.verified ?? false,
      ),
      address: row.boutique?.address ?? row.boutique?.location ?? "",
      location:
        row.boutique?.location ??
        row.boutique?.address ??
        "Location unavailable",
      distance:
        row.boutique?.distance != null &&
        Number.isFinite(Number(row.boutique.distance))
          ? Number(row.boutique.distance)
          : null,
      image: row.boutique?.image ?? null,
      logo: row.boutique?.logo ?? row.boutique?.image ?? null,
      avatarTint: boutiqueAvatarTint(String(boutiqueIdFallback)),
      phone:
        row.boutique?.phone ?? row.boutique?.contact_details?.phone ?? null,
      whatsapp:
        row.boutique?.whatsapp ??
        row.boutique?.contact_details?.whatsapp ??
        null,
      coordinates: row.boutique?.coordinates ?? null,
      latitude: row.boutique?.latitude ?? null,
      longitude: row.boutique?.longitude ?? null,
      opening_time: row.boutique?.opening_time ?? null,
      closing_time: row.boutique?.closing_time ?? null,
      working_days: Array.isArray(row.boutique?.working_days)
        ? row.boutique.working_days.filter(
            (d: unknown): d is string => typeof d === "string",
          )
        : null,
    },
    boutiquesAvailable,
    specs: specsDisplay,
    hasSpecsSection,
    priceBreakup,
    priceBreakupDisplayTotal,
    hasPriceBreakFromApi,
    tags,
  };

  putDetailUiCache(id, result);
  return result;
}

export async function fetchRelatedProductDetails(
  ids: string[],
): Promise<ProductDetail[]> {
  const details = await Promise.all(ids.map((id) => fetchProductDetailUi(id)));
  return details.filter((item): item is ProductDetail => item != null);
}

export async function fetchBoutiquePhone(id: string): Promise<string | null> {
  try {
    const boutique = await getBoutiqueById(id);
    const raw =
      boutique?.phone?.trim() ||
      boutique?.phone_number?.trim() ||
      null;
    return raw || null;
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
}
