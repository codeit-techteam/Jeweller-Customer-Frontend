import type { RecentProductItem } from '@/lib/services/mock/recentlyViewed';
import { PLACEHOLDER_IMAGE_URI, productPrimaryUri } from '@/lib/services/mock/imageUrls';
import { getProductById } from '@/lib/services/mock/products';
import type { SearchSpotlightProduct } from '@/lib/services/mock/search';

export type WishlistItemRow = {
  id: string;
  name: string;
  price: number;
  boutiqueName?: string;
  boutiqueRating?: number | null;
  boutiqueVerified?: boolean;
  /** Remote image URL; empty when using `tintFallback` only */
  image: string;
  /** Catalog image tint when `image` is empty */
  tintFallback?: string;
};

/** Persisted when wishlisting items whose ids are not in the main catalog (e.g. trending `t1`). */
export type WishlistSnapshot = {
  id: string;
  name: string;
  price: number;
  image: string;
  tintFallback?: string;
  boutiqueName?: string;
  boutiqueRating?: number | null;
  boutiqueVerified?: boolean;
};

export function parseInrDisplayPrice(label: string): number {
  const digits = label.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10);
}

export function wishlistSnapshotToRow(s: WishlistSnapshot): WishlistItemRow {
  return {
    id: s.id,
    name: s.name,
    price: s.price,
    image: s.image,
    tintFallback: s.tintFallback,
  };
}

export function snapshotFromListingFields(fields: {
  id: string;
  name: string;
  priceLabel: string;
  imageUri: string;
  imageTint?: string;
  boutiqueName?: string | null;
  boutiqueRating?: number | null;
  boutiqueVerified?: boolean | null;
}): WishlistSnapshot {
  return {
    id: fields.id,
    name: fields.name,
    price: parseInrDisplayPrice(fields.priceLabel),
    image: fields.imageUri,
    tintFallback: fields.imageTint,
    boutiqueName:
      typeof fields.boutiqueName === "string" && fields.boutiqueName.trim()
        ? fields.boutiqueName.trim()
        : undefined,
    boutiqueRating:
      fields.boutiqueRating != null && Number.isFinite(Number(fields.boutiqueRating))
        ? Number(fields.boutiqueRating)
        : null,
    boutiqueVerified: Boolean(fields.boutiqueVerified),
  };
}

export function snapshotFromWeddingProduct(item: {
  id: string;
  name: string;
  price: number;
  image: string;
}): WishlistSnapshot {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
  };
}

export function snapshotFromSpotlight(product: SearchSpotlightProduct): WishlistSnapshot {
  return snapshotFromListingFields({
    id: product.id,
    name: product.title,
    priceLabel: product.price,
    imageUri: product.imageUri,
    imageTint: product.imageTint,
  });
}

export function snapshotFromRecentProduct(p: RecentProductItem): WishlistSnapshot {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
  };
}

export function snapshotFromProductDetail(p: {
  id: string;
  name: string;
  price: number;
  category?: string;
  images: Array<{ uri?: string; tint?: string }>;
  boutique?: {
    name?: string | null;
    rating?: number | null;
    verified?: boolean | null;
  } | null;
}): WishlistSnapshot {
  const uri = p.images[0]?.uri ?? productPrimaryUri(p.id, p.category ?? "Wedding");
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: uri ?? PLACEHOLDER_IMAGE_URI,
    tintFallback: p.images[0]?.tint,
    boutiqueName:
      typeof p.boutique?.name === "string" && p.boutique.name.trim()
        ? p.boutique.name.trim()
        : undefined,
    boutiqueRating:
      p.boutique?.rating != null && Number.isFinite(Number(p.boutique.rating))
        ? Number(p.boutique.rating)
        : null,
    boutiqueVerified: Boolean(p.boutique?.verified),
  };
}

/** Seed items shown in wishlist UI — ids must exist in `products` catalog or be resolvable */
export const WISHLIST_MOCK_ITEMS: WishlistItemRow[] = [
  {
    id: 'wishlist-chain-necklace',
    name: 'Chain Necklace',
    price: 8500,
    image:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop&q=80',
  },
];

export const WISHLIST_SEED_IDS: string[] = WISHLIST_MOCK_ITEMS.map((x) => x.id);

export function getWishlistMockRow(id: string): WishlistItemRow | undefined {
  return WISHLIST_MOCK_ITEMS.find((x) => x.id === id);
}

/** Display row for wishlist screen: mock image override when present, else catalog product */
export function resolveWishlistRow(id: string): WishlistItemRow | null {
  const mock = getWishlistMockRow(id);
  const p = getProductById(id);
  if (mock && p) {
    return { id, name: p.name, price: p.price, image: mock.image };
  }
  if (mock) return mock;
  if (p) {
    const uri = p.images[0]?.uri ?? productPrimaryUri(p.id, p.category);
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      image: uri ?? PLACEHOLDER_IMAGE_URI,
      tintFallback: p.images[0]?.tint ?? '#e8eaed',
    };
  }
  return null;
}
