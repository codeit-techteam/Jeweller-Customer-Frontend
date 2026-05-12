/**
 * Curated Unsplash URLs — Indian jewellery, luxury retail, campaigns.
 */

const q = (photoId: string, w = 800) =>
  `https://images.unsplash.com/${photoId}?w=${w}&q=85&auto=format&fit=crop`;

/**
 * Primary fallback — diamond ring (always a real photo, never grey placeholder).
 * User reference: https://images.unsplash.com/photo-1588444650733-d2c8a2eac3c5
 */
export const PLACEHOLDER_IMAGE_URI = q('photo-1588444650733-d2c8a2eac3c5', 900);

/** Secondary fallback if primary URL fails to load (showroom / luxury retail). */
export const IMAGE_FALLBACK_SECONDARY = q('photo-1601121141461-9d6647bca1ed', 900);

/** Category anchors (Figma / product spec) */
export const RING_CATEGORY_ANCHOR = q('photo-1617038260897-41a1f14a8ca0', 900);
/** User reference: https://images.unsplash.com/photo-1602751584552-8ba73aad10e1 */
export const NECKLACE_CATEGORY_ANCHOR = q('photo-1602751584552-8ba73aad10e1', 900);
export const EARRING_CATEGORY_ANCHOR = q('photo-1599643478518-a784e5dc4c8f', 900);
export const BANGLE_CATEGORY_ANCHOR = q('photo-1620336655055-b57986f6e9e2', 900);

/** Coin / bullion category — warm gold visuals (jewellery-adjacent) */
const COINS_GOLD = [
  q('photo-1617038260897-41a1f14a8ca0', 900),
  q('photo-1588444650733-d2c8a2eac3c5', 900),
  q('photo-1605100804763-247f67b3557e', 900),
];

const RINGS = [
  RING_CATEGORY_ANCHOR,
  q('photo-1588444650733-d2c8a2eac3c5', 900),
  q('photo-1605100804763-247f67b3557e', 900),
  q('photo-1603561596112-0a132b757442', 900),
  q('photo-1573408304045-c59d01b444f7', 900),
  q('photo-1599643478518-a784e5dc4c8f', 900),
];

const NECKLACES = [
  NECKLACE_CATEGORY_ANCHOR,
  q('photo-1601121141461-9d6647bca1ed', 900),
  q('photo-1611591437281-460bfbe1220a', 900),
  q('photo-1515562141207-7e88fb950be7', 900),
  q('photo-1596944924616-7b38e7cfac36', 900),
];

const EARRINGS = [
  EARRING_CATEGORY_ANCHOR,
  q('photo-1535632066927-ab7c95ab70b6', 900),
  q('photo-1611658471626-53b62d81650a', 900),
  q('photo-1605100804763-247f67b3557e', 900),
];

const BANGLES = [
  BANGLE_CATEGORY_ANCHOR,
  q('photo-1599643478518-a784e5dc4c8f', 900),
  q('photo-1603561596112-0a132b757442', 900),
  q('photo-1611591437281-460bfbe1220a', 900),
];

const POOL_BY_CATEGORY: Record<string, string[]> = {
  RINGS,
  NECKLACES,
  EARRINGS,
  BANGLES,
  PENDANTS: [...NECKLACES, ...RINGS],
  BRACELETS: [...BANGLES, ...RINGS],
  COINS: COINS_GOLD,
  SOLITAIRES: RINGS,
  MANGALSUTRAS: NECKLACES,
  /** "MEN'S RINGS".replace(/\s+/g, '_') */
  "MEN'S_RINGS": RINGS,
  NOSE_PINS: EARRINGS,
  GOLD_COINS: COINS_GOLD,
  /** Normalized keys (filters strip spaces) */
  NOSEPINS: EARRINGS,
  GOLDCOINS: COINS_GOLD,
};

export const CATEGORY_HOME_IMAGE: Record<string, string> = {
  RINGS: RING_CATEGORY_ANCHOR,
  NECKLACES: NECKLACE_CATEGORY_ANCHOR,
  EARRINGS: EARRING_CATEGORY_ANCHOR,
  BANGLES: BANGLE_CATEGORY_ANCHOR,
  PENDANTS: q('photo-1611591437281-460bfbe1220a', 600),
  BRACELETS: BANGLE_CATEGORY_ANCHOR,
  'NOSE PINS': EARRING_CATEGORY_ANCHOR,
  COINS: COINS_GOLD[0],
  SOLITAIRES: q('photo-1588444650733-d2c8a2eac3c5', 600),
  MANGALSUTRAS: q('photo-1602751584552-8ba73aad10e1', 600),
  'GOLD COINS': COINS_GOLD[0],
  "MEN'S RINGS": RING_CATEGORY_ANCHOR,
};

/** Hero strip on home + occasions */
export const COLLECTION_HERO_URIS = {
  wedding: q('photo-1515562141207-7e88fb950be7', 1400),
  anniversary: q('photo-1588444650733-d2c8a2eac3c5', 1400),
  festive: q('photo-1603561596112-0a132b757442', 1400),
} as const;

export const OCCASION_HERO_URI = q('photo-1611591437281-460bfbe1220a', 1400);

export const OCCASION_CARD_URIS: Record<string, string> = {
  /** Bridal / wedding jewellery */
  wedding: q('photo-1515562141207-7e88fb950be7', 900),
  /** Anniversary — diamond ring */
  anniversary: q('photo-1588444650733-d2c8a2eac3c5', 900),
  engagement: q('photo-1603561596112-0a132b757442', 900),
  festive: q('photo-1605100804763-247f67b3557e', 900),
  'daily-wear': q('photo-1617038260897-41a1f14a8ca0', 900),
  /** Birthday / gifting — warm gold necklace (shop-by-occasion) */
  birthday: q('photo-1602751584552-8ba73aad10e1', 900),
};

export const TRENDING_WEDDING_URIS: Record<string, string> = {
  aethelgard: q('photo-1611658471626-53b62d81650a', 900),
  celeste: q('photo-1535632066927-ab7c95ab70b6', 900),
};

export const TINTS = ['#2a1810', '#1a1a1a', '#e8d5c8', '#f5f0eb', '#dce4ec', '#d4c4a8', '#2c2416', '#eef2f6'];

export function hashString(s: string): number {
  return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function tintFor(id: string, i: number): string {
  const n = hashString(id);
  return TINTS[(n + i) % TINTS.length];
}

function poolFor(category: string): string[] {
  const normalized = category.toUpperCase().replace(/\s+/g, '_');
  return POOL_BY_CATEGORY[normalized] ?? POOL_BY_CATEGORY[category] ?? RINGS;
}

/** Category grid / pills — matches labels from `categories` mock */
export function categoryImageUri(label: string): string {
  const trimmed = label.trim();
  if (CATEGORY_HOME_IMAGE[trimmed]) return CATEGORY_HOME_IMAGE[trimmed];
  const upper = trimmed.toUpperCase();
  if (CATEGORY_HOME_IMAGE[upper]) return CATEGORY_HOME_IMAGE[upper];
  return CATEGORY_HOME_IMAGE.RINGS ?? RING_CATEGORY_ANCHOR;
}

const MOCK_VIDEO_MP4 =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

/** Four slides for product detail (3rd is a video: poster still + playback URL) */
export function productSlideImages(
  productId: string,
  category: string,
): {
  tint: string;
  uri?: string;
  isVideo?: boolean;
  videoSrc?: string;
}[] {
  const pool = poolFor(category);
  const h = hashString(productId);
  return [0, 1, 2, 3].map((i) => ({
    tint: tintFor(productId, i),
    uri: pool[(h + i) % pool.length],
    isVideo: i === 2,
    videoSrc: i === 2 ? MOCK_VIDEO_MP4 : undefined,
  }));
}

export function productPrimaryUri(productId: string, category: string): string {
  return productSlideImages(productId, category)[0]?.uri ?? poolFor(category)[0];
}

const TRENDING_URI: Record<string, string> = {
  t1: q('photo-1603561596112-0a132b757442'),
  t2: q('photo-1611591437281-460bfbe1220a'),
  t3: q('photo-1535632066927-ab7c95ab70b6'),
  t4: q('photo-1605100804763-247f67b3557e'),
  t5: q('photo-1573408304045-c59d01b444f7'),
  t6: q('photo-1599643478518-a784e5dc4c8f'),
  t7: q('photo-1611658471626-53b62d81650a'),
  t8: q('photo-1603561596112-0a132b757442'),
};

export function trendingImageUri(id: string): string {
  return TRENDING_URI[id] ?? q('photo-1605100804763-247f67b3557e');
}

/**
 * Listing card covers on Home / Boutiques — real jewellery photography matched to each boutique’s positioning.
 */
const BOUTIQUE_COVER_BY_ID: Record<string, string> = {
  /** Temple jewellery, polki, heritage — bridal gold / traditional */
  'hazoorilal-legacy': q('photo-1617038220319-276d3cfab638', 1200),
  /** Tata luxury — diamonds & contemporary fine jewellery */
  'zoya-tata': q('photo-1588444650733-d2c8a2eac3c5', 1200),
  /** Diamonds, contemporary, bridal */
  'vogue-jewels': q('photo-1603561596112-0a132b757442', 1200),
  /** Heritage bridal collections */
  'heritage-gems': q('photo-1611591437281-460bfbe1220a', 1200),
  /** Modern silhouettes */
  'aurora-contemporary': q('photo-1596944924616-7b38e7cfac36', 1200),
  /** Temple & bespoke bridal */
  'shyam-boutique': q('photo-1515562141207-7e88fb950be7', 1200),
};

const JEWELLERY_SHOWROOM_POOL = [
  q('photo-1601121141461-9d6647bca1ed', 1200),
  q('photo-1617038260897-41a1f14a8ca0', 1200),
  q('photo-1515562141207-7e88fb950be7', 1200),
  q('photo-1602751584552-8ba73aad10e1', 1200),
  q('photo-1611591437281-460bfbe1220a', 1200),
  q('photo-1605100804763-247f67b3557e', 1200),
  q('photo-1599643478518-a784e5dc4c8f', 1200),
  q('photo-1620336655055-b57986f6e9e2', 1200),
];

export function boutiqueListingCoverImage(boutiqueId: string): string {
  const curated = BOUTIQUE_COVER_BY_ID[boutiqueId];
  if (curated) return curated;
  return JEWELLERY_SHOWROOM_POOL[hashString(boutiqueId) % JEWELLERY_SHOWROOM_POOL.length];
}

export const BOUTIQUE_BANNER_URIS = [
  q('photo-1601121141461-9d6647bca1ed', 1400),
  q('photo-1617038260897-41a1f14a8ca0', 1400),
  q('photo-1441986300917-64674bd600d8', 1400),
] as const;

export const MAP_PLACEHOLDER_URI = q('photo-1524661135-423995f22d0b', 1000);

export const HERO_JEWELLERY_URI = q('photo-1599643478518-a784e5dc4c8f', 1400);

export const DEFAULT_JEWELLERY_FALLBACK = q('photo-1605100804763-247f67b3557e');
