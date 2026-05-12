import {
  normalizeCategoryParam,
  type CategoryProduct,
} from '@/lib/services/mock/categoryProducts';

export type ProductSortOption =
  | 'relevance'
  | 'popularity'
  | 'price_asc'
  | 'price_desc'
  | 'newest';

export type ProductListingFilterState = {
  priceMin: number;
  priceMax: number;
  /** Empty = any metal */
  metals: string[];
  /** Product categories, e.g. RINGS — empty = any */
  types: string[];
  /** Minimum rating (inclusive), null = any */
  minRating: number | null;
  /** Minimum mock discount %, null = any */
  minDiscount: number | null;
  sort: ProductSortOption;
};

export const LISTING_PRICE_ABS_MIN = 5_000;
export const LISTING_PRICE_ABS_MAX = 1_000_000;

export const defaultListingFilters: ProductListingFilterState = {
  priceMin: 10_000,
  priceMax: 500_000,
  metals: [],
  types: [],
  minRating: null,
  minDiscount: null,
  sort: 'relevance',
};

export const clearedListingFilters: ProductListingFilterState = {
  priceMin: LISTING_PRICE_ABS_MIN,
  priceMax: LISTING_PRICE_ABS_MAX,
  metals: [],
  types: [],
  minRating: null,
  minDiscount: null,
  sort: 'relevance',
};

export function mockListingRating(p: CategoryProduct): number {
  const n = Number.parseInt(p.id.replace(/\D+/g, ''), 10) || 7;
  return Math.round((3.6 + (n % 14) / 10) * 10) / 10;
}

export function mockListingDiscount(p: CategoryProduct): number {
  const n = Number.parseInt(p.id.replace(/\D+/g, ''), 10) || 5;
  return (n * 17) % 78 + 8;
}

export const LISTING_TYPE_OPTIONS = [
  'RINGS',
  'NECKLACES',
  'EARRINGS',
  'BANGLES',
  'BRACELETS',
  'PENDANTS',
] as const;

export const LISTING_METAL_OPTIONS = ['Gold', 'Silver', 'Platinum', 'Rose Gold'] as const;

export const LISTING_RATING_OPTIONS: { id: string; label: string; min: number }[] = [
  { id: 'any', label: 'Any rating', min: 0 },
  { id: '4', label: '4★ & above', min: 4 },
  { id: '3', label: '3★ & above', min: 3 },
];

export const LISTING_DISCOUNT_OPTIONS: { id: string; label: string; min: number }[] = [
  { id: 'any', label: 'Any discount', min: 0 },
  { id: '10', label: '10% or more', min: 10 },
  { id: '25', label: '25% or more', min: 25 },
  { id: '40', label: '40% or more', min: 40 },
];

function sortListingCatalog(list: CategoryProduct[], sort: ProductSortOption): CategoryProduct[] {
  switch (sort) {
    case 'price_asc':
      return [...list].sort((a, b) => a.price - b.price);
    case 'price_desc':
      return [...list].sort((a, b) => b.price - a.price);
    case 'newest':
      return [...list].sort((a, b) => b.id.localeCompare(a.id));
    case 'popularity':
      return [...list].sort((a, b) => {
        const score = (x: CategoryProduct) =>
          (x.boutiqueVerified ? 2 : 0) + (x.boutiqueRatedHigh ? 1 : 0) + (x.openNow ? 1 : 0);
        return score(b) - score(a) || b.price - a.price;
      });
    default:
      return list;
  }
}

export function filterListingCatalog(
  products: CategoryProduct[],
  category: string,
  f: ProductListingFilterState,
): CategoryProduct[] {
  const cat = normalizeCategoryParam(category);
  let list = cat === 'ALL' ? [...products] : products.filter((p) => p.category === cat);

  list = list.filter((p) => p.price >= f.priceMin && p.price <= f.priceMax);

  if (f.metals.length > 0) {
    const set = new Set(f.metals.map((m) => m.toLowerCase()));
    list = list.filter((p) => set.has(p.metal.toLowerCase()));
  }

  if (f.types.length > 0) {
    list = list.filter((p) => f.types.includes(p.category));
  }

  const minRating = f.minRating;
  if (minRating != null && minRating > 0) {
    list = list.filter((p) => mockListingRating(p) >= minRating);
  }

  const minDiscount = f.minDiscount;
  if (minDiscount != null && minDiscount > 0) {
    list = list.filter((p) => mockListingDiscount(p) >= minDiscount);
  }

  return sortListingCatalog(list, f.sort);
}
