/**
 * Product hero/gallery images are built from `productSlideImages()` in `imageUrls.ts` — every item has valid Unsplash `uri`s.
 */
import { categoryProducts, type CategoryProduct } from '@/lib/services/mock/categoryProducts';
import { productSlideImages } from '@/lib/services/mock/imageUrls';
import { searchSpotlightProducts, type SearchSpotlightProduct } from '@/lib/services/mock/search';
import { trendingProducts, type TrendingProduct } from '@/lib/services/mock/trending';

export type ProductImage = {
  tint: string;
  uri?: string;
  isVideo?: boolean;
  videoSrc?: string;
};

export type ProductDetail = {
  id: string;
  name: string;
  price: number;
  images: ProductImage[];
  description: string;
  rating: number;
  reviews: number;
  category: string;
  metal: string;
  sizeOptions: string[];
  metalOptions: string[];
  relatedIds: string[];
  limitedEdition?: boolean;
  discountLabel?: string;
  boutique: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    location: string;
    avatarTint: string;
  };
  boutiquesAvailable: number;
  specs: { metal: string; weight: string; diamond: string; dimensions: string };
  priceBreakup: { gold: number; gemstone: number; making: number; gst: number };
};

function relatedIdsForCategory(category: string, excludeId: string): string[] {
  return categoryProducts
    .filter((x) => x.category === category && x.id !== excludeId)
    .slice(0, 4)
    .map((x) => x.id);
}

function relatedFallback(): string[] {
  return categoryProducts.slice(0, 4).map((x) => x.id);
}

export function priceBreakupFromTotal(total: number) {
  const gold = Math.round(total * 0.86);
  const gemstone = Math.round(total * 0.015);
  const making = Math.round(total * 0.03);
  const gst = Math.max(0, total - gold - gemstone - making);
  return { gold, gemstone, making, gst };
}

function parsePriceInr(s: string): number {
  const digits = s.replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
}

function metalOptionsFor(current: string): string[] {
  const base = ['Gold', 'Rose Gold', 'White Gold', 'Platinum', 'Silver'];
  const merged = [current, ...base];
  return [...new Set(merged)].slice(0, 6);
}

function specsFor(metal: string, price: number): ProductDetail['specs'] {
  const w = 2.5 + (price % 5000) / 10_000;
  const d = price > 100_000 ? '0.35 CT' : price > 50_000 ? '0.25 CT' : '0.12 CT';
  return {
    metal,
    weight: `${w.toFixed(2)} g`,
    diamond: d,
    dimensions: '20mm × 5mm',
  };
}

function createFromCategory(p: CategoryProduct, index: number): ProductDetail {
  const images: ProductImage[] = productSlideImages(p.id, p.category);
  const relatedIds = relatedIdsForCategory(p.category, p.id);
  const description = `Handcrafted in ${p.metal}, this ${p.name.toLowerCase()} features heritage craftsmanship with a contemporary silhouette. A timeless piece from our ${p.category} collection — designed for daily elegance and special moments alike.`;
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    images,
    description,
    rating: 4.5 + (index % 5) * 0.08,
    reviews: 80 + index * 12,
    category: p.category,
    metal: p.metal,
    sizeOptions: ['14', '15', '16', '17', '18', '19', '20'],
    metalOptions: metalOptionsFor(p.metal),
    relatedIds: relatedIds.length ? relatedIds : relatedFallback().filter((id) => id !== p.id).slice(0, 4),
    limitedEdition: index === 0 || index === 3,
    discountLabel: index % 4 === 0 ? '10% OFF on Making Charges' : undefined,
    boutique: {
      id: 'shyam-boutique',
      name: 'Shyam Boutique',
      rating: 4.8,
      reviewCount: 120,
      location: 'NCR, Delhi',
      avatarTint: '#c4a574',
    },
    boutiquesAvailable: 3,
    specs: specsFor(`${p.metal.includes('kt') ? p.metal : `18kt ${p.metal}`}`, p.price),
    priceBreakup: priceBreakupFromTotal(p.price),
  };
}

function createTrendingDetail(t: TrendingProduct): ProductDetail {
  const price = parsePriceInr(t.price);
  const images: ProductImage[] = productSlideImages(t.id, t.category);
  const related = relatedIdsForCategory(t.category, t.id);
  const rid = related.length ? related : relatedFallback();
  return {
    id: t.id,
    name: t.title,
    price,
    images,
    description: `${t.description}. ${t.badge ? `Marked as ${t.badge.replace('_', ' ')}.` : ''} Curated for discerning collectors.`,
    rating: 4.65,
    reviews: 210,
    category: t.category,
    metal: t.description.includes('Gold') ? '18kt Rose Gold' : t.description.includes('Platinum') ? 'Platinum' : '18kt Gold',
    sizeOptions: ['14', '15', '16', '17', '18', '19', '20'],
    metalOptions: metalOptionsFor('Gold'),
    relatedIds: rid.slice(0, 4),
    limitedEdition: t.badge === 'BESTSELLER',
    discountLabel: '10% OFF on Making Charges',
    boutique: {
      id: 'shyam-boutique',
      name: 'Shyam Boutique',
      rating: 4.8,
      reviewCount: 120,
      location: 'NCR, Delhi',
      avatarTint: '#c4a574',
    },
    boutiquesAvailable: 3,
    specs: specsFor('18kt Rose Gold', price),
    priceBreakup: priceBreakupFromTotal(price),
  };
}

function createSearchDetail(s: SearchSpotlightProduct): ProductDetail {
  const price = parsePriceInr(s.price);
  const images: ProductImage[] = productSlideImages(s.id, 'RINGS');
  return {
    id: s.id,
    name: s.title,
    price,
    images,
    description: `${s.description}. Spotlight pick from our curated catalogue.`,
    rating: 4.4,
    reviews: 64,
    category: 'RINGS',
    metal: '18kt Gold',
    sizeOptions: ['14', '15', '16', '17', '18'],
    metalOptions: metalOptionsFor('Gold'),
    relatedIds: relatedFallback().slice(0, 4),
    discountLabel: undefined,
    boutique: {
      id: 'shyam-boutique',
      name: 'Shyam Boutique',
      rating: 4.8,
      reviewCount: 120,
      location: 'NCR, Delhi',
      avatarTint: '#c4a574',
    },
    boutiquesAvailable: 2,
    specs: specsFor('18kt Gold', price),
    priceBreakup: priceBreakupFromTotal(price),
  };
}

const catalog = new Map<string, ProductDetail>();

categoryProducts.forEach((p, i) => {
  catalog.set(p.id, createFromCategory(p, i));
});

trendingProducts.forEach((t) => {
  catalog.set(t.id, createTrendingDetail(t));
});

searchSpotlightProducts.forEach((s) => {
  catalog.set(s.id, createSearchDetail(s));
});

/** Hero-style demo product matching marketing screenshots (optional fallback) */
const showcaseDetail: ProductDetail = {
  id: 'showcase-ethereal',
  name: 'Ethereal Diamond Solitaire Ring - 18kt Rose Gold',
  price: 145000,
  images: productSlideImages('showcase-ethereal', 'RINGS'),
  description:
    'Handcrafted in 18k solid gold, this minimalist solitaire ring features a brilliant-cut diamond of exceptional clarity. A timeless piece designed for daily elegance and special moments alike.',
  rating: 4.9,
  reviews: 342,
  category: 'RINGS',
  metal: '18kt Rose Gold',
  sizeOptions: ['14', '15', '16', '17', '18', '19', '20'],
  metalOptions: ['18kt Rose Gold', '18kt Yellow Gold', '18kt White Gold', 'Platinum'],
  relatedIds: ['p3', 'p2', 'p20', 't6'],
  limitedEdition: true,
  discountLabel: '10% OFF on Making Charges',
  boutique: {
    id: 'shyam-boutique',
    name: 'Shyam Boutique',
    rating: 4.8,
    reviewCount: 120,
    location: 'NCR, Delhi',
    avatarTint: '#c4a574',
  },
  boutiquesAvailable: 3,
  specs: {
    metal: '18kt Rose Gold',
    weight: '3.45 g',
    diamond: '0.25 CT',
    dimensions: '20mm × 5mm',
  },
  priceBreakup: priceBreakupFromTotal(145000),
};

catalog.set(showcaseDetail.id, showcaseDetail);

/** Wishlist / marketing demo — matches wishlist mock screen */
const wishlistChainDetail: ProductDetail = {
  id: 'wishlist-chain-necklace',
  name: 'Chain Necklace',
  price: 8500,
  images: productSlideImages('wishlist-chain-necklace', 'NECKLACES'),
  description:
    'A delicate gold chain necklace with a refined circular pendant. Lightweight and versatile — crafted for everyday elegance.',
  rating: 4.7,
  reviews: 128,
  category: 'NECKLACES',
  metal: '18kt Gold',
  sizeOptions: ['14', '15', '16', '17', '18'],
  metalOptions: metalOptionsFor('Gold'),
  relatedIds: ['p5', 'p6', 'p24', 'p2'],
  limitedEdition: false,
  boutique: {
    id: 'shyam-boutique',
    name: 'Shyam Boutique',
    rating: 4.8,
    reviewCount: 120,
    location: 'NCR, Delhi',
    avatarTint: '#c4a574',
  },
  boutiquesAvailable: 3,
  specs: specsFor('18kt Gold', 8500),
  priceBreakup: priceBreakupFromTotal(8500),
};

catalog.set(wishlistChainDetail.id, wishlistChainDetail);

export function getProductById(id: string | undefined): ProductDetail | null {
  if (!id) return null;
  return catalog.get(id) ?? null;
}

export function getProductsByIds(ids: string[]): ProductDetail[] {
  return ids.map((i) => catalog.get(i)).filter((x): x is ProductDetail => x != null);
}

export const promiseTiles = [
  {
    title: '100% REFUND',
    body: 'Return within 30 Days of Delivery',
    icon: 'inventory' as const,
  },
  {
    title: 'LIFETIME EXCHANGE & BUYBACK',
    body: 'Exchange for current value or get cash',
    icon: 'sync' as const,
  },
  {
    title: '100% CERTIFIED JEWELLERY',
    body: 'BIS Hallmark, IGI, SGL, GIA, HKD',
    icon: 'verified' as const,
  },
  {
    title: 'EXCLUSIVE DESIGNS',
    body: '6000+ designs by award-winning designers',
    icon: 'brush' as const,
  },
];
