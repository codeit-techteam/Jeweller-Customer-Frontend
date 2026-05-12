import { create } from 'zustand';

export type DistanceOption = '2' | '5' | '10' | 'any';

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest';

export type ServiceId = 'walkin' | 'appointment' | 'call' | 'whatsapp';

export type CategoryFiltersState = {
  distanceKm: DistanceOption;
  priceMin: number;
  priceMax: number;
  jewelleryTypes: string[];
  styles: string[];
  boutiqueVerified: boolean;
  boutiqueRated: boolean;
  services: ServiceId[];
  openNow: boolean;
  sort: SortOption;
  metals: string[];
};

/** Cleared / “show everything” baseline */
export const emptyFilters: CategoryFiltersState = {
  distanceKm: 'any',
  priceMin: 5000,
  priceMax: 1_000_000,
  jewelleryTypes: [],
  styles: [],
  boutiqueVerified: false,
  boutiqueRated: false,
  services: [],
  openNow: false,
  sort: 'relevance',
  metals: [],
};

/** UI defaults matching design (used when opening filters before first apply) */
export const defaultCategoryFilters: CategoryFiltersState = {
  distanceKm: '2',
  priceMin: 10_000,
  priceMax: 500_000,
  jewelleryTypes: ['RINGS'],
  styles: ['Bridal'],
  boutiqueVerified: true,
  boutiqueRated: false,
  services: ['walkin'],
  openNow: false,
  sort: 'relevance',
  metals: ['Gold'],
};

export function isEmptyFilters(f: CategoryFiltersState): boolean {
  return (
    f.distanceKm === 'any' &&
    f.jewelleryTypes.length === 0 &&
    f.styles.length === 0 &&
    f.metals.length === 0 &&
    f.services.length === 0 &&
    !f.boutiqueVerified &&
    !f.boutiqueRated &&
    !f.openNow &&
    f.sort === 'relevance' &&
    f.priceMin <= 5000 &&
    f.priceMax >= 900_000
  );
}

type Store = {
  filters: CategoryFiltersState;
  setFilters: (partial: Partial<CategoryFiltersState>) => void;
  replaceFilters: (next: CategoryFiltersState) => void;
  reset: () => void;
};

export const useCategoryFiltersStore = create<Store>((set) => ({
  filters: { ...emptyFilters },
  setFilters: (partial) =>
    set((s) => ({
      filters: { ...s.filters, ...partial },
    })),
  replaceFilters: (next) => set({ filters: { ...next } }),
  reset: () => set({ filters: { ...emptyFilters } }),
}));
