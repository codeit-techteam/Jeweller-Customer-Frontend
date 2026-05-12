import type { CategoryFiltersState } from '@/lib/stores/categoryFiltersStore';
import { isEmptyFilters } from '@/lib/stores/categoryFiltersStore';

export type CategoryProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  metal: string;
  styles: string[];
  distanceKm: number;
  boutiqueVerified: boolean;
  boutiqueRatedHigh: boolean;
  services: ('walkin' | 'appointment' | 'call' | 'whatsapp')[];
  openNow: boolean;
};

/** Mock catalogue for filter demos (~24 items) */
export const categoryProducts: CategoryProduct[] = [
  { id: 'p1', name: 'Heritage Solitaire Ring', category: 'RINGS', price: 125000, metal: 'Gold', styles: ['Bridal', 'Temple Jewellery'], distanceKm: 1.2, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['walkin', 'whatsapp'], openNow: true },
  { id: 'p2', name: 'Temple Gold Band', category: 'RINGS', price: 48000, metal: 'Gold', styles: ['Temple Jewellery'], distanceKm: 3, boutiqueVerified: true, boutiqueRatedHigh: false, services: ['appointment'], openNow: false },
  { id: 'p3', name: 'Contemporary Stack Ring', category: 'RINGS', price: 22000, metal: 'Rose Gold', styles: ['Contemporary'], distanceKm: 8, boutiqueVerified: false, boutiqueRatedHigh: true, services: ['walkin', 'call'], openNow: true },
  { id: 'p4', name: 'Custom Design Signet', category: 'RINGS', price: 350000, metal: 'Platinum', styles: ['Custom Design'], distanceKm: 4, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['whatsapp', 'appointment'], openNow: true },
  { id: 'p5', name: 'Pearl Drop Necklace', category: 'NECKLACES', price: 89000, metal: 'Silver', styles: ['Bridal'], distanceKm: 2, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['walkin'], openNow: true },
  { id: 'p6', name: 'Layered Chain', category: 'NECKLACES', price: 45000, metal: 'Gold', styles: ['Contemporary'], distanceKm: 6, boutiqueVerified: true, boutiqueRatedHigh: false, services: ['call'], openNow: false },
  { id: 'p7', name: 'Choker Heritage', category: 'NECKLACES', price: 210000, metal: 'Gold', styles: ['Temple Jewellery', 'Bridal'], distanceKm: 1, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['appointment', 'walkin'], openNow: true },
  { id: 'p8', name: 'Minimal Bar Pendant', category: 'NECKLACES', price: 18000, metal: 'Silver', styles: ['Contemporary'], distanceKm: 12, boutiqueVerified: false, boutiqueRatedHigh: true, services: ['whatsapp'], openNow: true },
  { id: 'p9', name: 'Chandelier Earrings', category: 'EARRINGS', price: 156000, metal: 'Gold', styles: ['Bridal'], distanceKm: 2, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['walkin', 'whatsapp'], openNow: true },
  { id: 'p10', name: 'Stud Classics', category: 'EARRINGS', price: 12000, metal: 'Gold', styles: ['Contemporary'], distanceKm: 5, boutiqueVerified: true, boutiqueRatedHigh: false, services: ['walkin'], openNow: false },
  { id: 'p11', name: 'Temple Jhumkas', category: 'EARRINGS', price: 67000, metal: 'Gold', styles: ['Temple Jewellery'], distanceKm: 3, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['appointment'], openNow: true },
  { id: 'p12', name: 'Hoops Silver', category: 'EARRINGS', price: 8000, metal: 'Silver', styles: ['Contemporary'], distanceKm: 15, boutiqueVerified: false, boutiqueRatedHigh: false, services: ['call'], openNow: false },
  { id: 'p13', name: 'Kada Set', category: 'BANGLES', price: 98000, metal: 'Gold', styles: ['Bridal', 'Temple Jewellery'], distanceKm: 2, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['walkin'], openNow: true },
  { id: 'p14', name: 'Slim Bangles', category: 'BANGLES', price: 34000, metal: 'Rose Gold', styles: ['Contemporary'], distanceKm: 7, boutiqueVerified: true, boutiqueRatedHigh: false, services: ['whatsapp'], openNow: true },
  { id: 'p15', name: 'Antique Cuff', category: 'BANGLES', price: 189000, metal: 'Gold', styles: ['Temple Jewellery'], distanceKm: 4, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['appointment', 'walkin'], openNow: false },
  { id: 'p16', name: 'Platinum Band', category: 'RINGS', price: 420000, metal: 'Platinum', styles: ['Custom Design'], distanceKm: 1, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['appointment'], openNow: true },
  { id: 'p17', name: 'Silver Anklet', category: 'BRACELETS', price: 9500, metal: 'Silver', styles: ['Contemporary'], distanceKm: 20, boutiqueVerified: false, boutiqueRatedHigh: false, services: ['call', 'whatsapp'], openNow: true },
  { id: 'p18', name: 'Diamond Tennis', category: 'NECKLACES', price: 510000, metal: 'Gold', styles: ['Bridal'], distanceKm: 2, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['walkin', 'appointment'], openNow: true },
  { id: 'p19', name: 'Mangalsutra Lite', category: 'NECKLACES', price: 78000, metal: 'Gold', styles: ['Bridal', 'Temple Jewellery'], distanceKm: 3, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['walkin'], openNow: true },
  { id: 'p20', name: 'Kids Charm Ring', category: 'RINGS', price: 6500, metal: 'Silver', styles: ['Contemporary'], distanceKm: 9, boutiqueVerified: true, boutiqueRatedHigh: false, services: ['walkin'], openNow: true },
  { id: 'p21', name: 'Office Pendant', category: 'PENDANTS', price: 28000, metal: 'Gold', styles: ['Contemporary'], distanceKm: 11, boutiqueVerified: false, boutiqueRatedHigh: true, services: ['whatsapp'], openNow: false },
  { id: 'p22', name: 'Bridal Set Full', category: 'RINGS', price: 890000, metal: 'Gold', styles: ['Bridal', 'Custom Design'], distanceKm: 1, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['appointment', 'walkin', 'whatsapp'], openNow: true },
  { id: 'p23', name: 'Oxidised Earrings', category: 'EARRINGS', price: 4500, metal: 'Silver', styles: ['Temple Jewellery'], distanceKm: 14, boutiqueVerified: false, boutiqueRatedHigh: false, services: ['call'], openNow: false },
  { id: 'p24', name: 'Rose Gold Chain', category: 'NECKLACES', price: 56000, metal: 'Rose Gold', styles: ['Contemporary', 'Bridal'], distanceKm: 5, boutiqueVerified: true, boutiqueRatedHigh: true, services: ['walkin', 'call'], openNow: true },
];

export function distanceMatches(option: string, km: number): boolean {
  if (option === 'any') return true;
  const max = Number(option);
  return km <= max;
}

function sortProducts(list: CategoryProduct[], sort: CategoryFiltersState['sort']): CategoryProduct[] {
  switch (sort) {
    case 'price_asc':
      return [...list].sort((a, b) => a.price - b.price);
    case 'price_desc':
      return [...list].sort((a, b) => b.price - a.price);
    case 'newest':
      return [...list].sort((a, b) => b.id.localeCompare(a.id));
    default:
      return list;
  }
}

export function applyCategoryFilters(products: CategoryProduct[], f: CategoryFiltersState): CategoryProduct[] {
  if (isEmptyFilters(f)) {
    return sortProducts([...products], f.sort);
  }

  let list = products.filter((p) => {
    if (p.price < f.priceMin || p.price > f.priceMax) return false;
    if (!distanceMatches(f.distanceKm, p.distanceKm)) return false;
    if (f.jewelleryTypes.length > 0 && !f.jewelleryTypes.includes(p.category)) return false;
    if (f.metals.length > 0 && !f.metals.some((m) => p.metal.toLowerCase() === m.toLowerCase())) return false;
    if (f.styles.length > 0 && !f.styles.some((s) => p.styles.includes(s))) return false;
    if (f.boutiqueVerified && !p.boutiqueVerified) return false;
    if (f.boutiqueRated && !p.boutiqueRatedHigh) return false;
    if (f.services.length > 0 && !f.services.some((s) => p.services.includes(s))) return false;
    if (f.openNow && !p.openNow) return false;
    return true;
  });

  return sortProducts(list, f.sort);
}

/** JSON payload from filters screen → category-products */
export type AppliedFiltersPayload = {
  price: { min: number; max: number } | null;
  metal: string | null;
  sort: string | null;
};

export const emptyAppliedFilters: AppliedFiltersPayload = {
  price: null,
  metal: null,
  sort: null,
};

export function parseAppliedFiltersJson(raw: unknown): AppliedFiltersPayload {
  if (raw == null || typeof raw !== 'string') return { ...emptyAppliedFilters };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const price = o.price;
    const priceOk =
      price &&
      typeof price === 'object' &&
      price !== null &&
      'min' in price &&
      'max' in price &&
      typeof (price as { min: unknown }).min === 'number' &&
      typeof (price as { max: unknown }).max === 'number';
    return {
      price: priceOk ? { min: (price as { min: number }).min, max: (price as { max: number }).max } : null,
      metal: typeof o.metal === 'string' ? o.metal : null,
      sort: typeof o.sort === 'string' ? o.sort : null,
    };
  } catch {
    return { ...emptyAppliedFilters };
  }
}

export function normalizeCategoryParam(category: string | undefined): string {
  if (!category || category === 'ALL') return 'ALL';
  return category.toUpperCase().replace(/\s+/g, '');
}

export function filterByAppliedPayload(
  products: CategoryProduct[],
  category: string,
  applied: AppliedFiltersPayload,
): CategoryProduct[] {
  const cat = normalizeCategoryParam(category);
  let list = cat === 'ALL' ? [...products] : products.filter((p) => p.category === cat);

  if (applied.price) {
    const { min, max } = applied.price;
    list = list.filter((p) => p.price >= min && p.price <= max);
  }
  if (applied.metal) {
    const m = applied.metal.toLowerCase();
    list = list.filter((p) => p.metal.toLowerCase() === m);
  }

  if (applied.sort === 'price_asc') return [...list].sort((a, b) => a.price - b.price);
  if (applied.sort === 'price_desc') return [...list].sort((a, b) => b.price - a.price);
  if (applied.sort === 'newest') return [...list].sort((a, b) => b.id.localeCompare(a.id));
  return list;
}
