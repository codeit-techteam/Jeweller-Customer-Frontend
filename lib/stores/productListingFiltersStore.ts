import { create } from "zustand";

import {
    clearedListingFilters,
    type ProductListingFilterState,
    type ProductSortOption,
} from "@/lib/services/listingCatalogFilters";
import type { AppliedFiltersPayload } from "@/lib/services/mock/categoryProducts";

export type ProductListingSelectedFilters = {
  types: string[];
  metals: string[];
  minRating: number | null;
  minDiscount: number | null;
};

export type ProductListingPriceRange = {
  min: number;
  max: number;
};

export function mergeProductListingFilters(
  selectedFilters: ProductListingSelectedFilters,
  sortOption: ProductSortOption,
  priceRange: ProductListingPriceRange,
): ProductListingFilterState {
  return {
    types: selectedFilters.types,
    metals: selectedFilters.metals,
    minRating: selectedFilters.minRating,
    minDiscount: selectedFilters.minDiscount,
    sort: sortOption,
    priceMin: priceRange.min,
    priceMax: priceRange.max,
  };
}

function mapLegacySort(raw: string | null): ProductSortOption {
  if (raw === "price_asc" || raw === "price_desc" || raw === "newest")
    return raw;
  return "relevance";
}

type ProductListingFiltersStore = {
  selectedFilters: ProductListingSelectedFilters;
  sortOption: ProductSortOption;
  priceRange: ProductListingPriceRange;
  /** Full merged snapshot for filter engine */
  getMergedFilters: () => ProductListingFilterState;
  setSelectedFilters: (partial: Partial<ProductListingSelectedFilters>) => void;
  setSortOption: (sort: ProductSortOption) => void;
  setPriceRange: (partial: Partial<ProductListingPriceRange>) => void;
  /** Patch any slice (used by legacy sliders / sheets) */
  setFilters: (partial: Partial<ProductListingFilterState>) => void;
  replaceAll: (state: ProductListingFilterState) => void;
  hydrateFromRoutePayload: (payload: AppliedFiltersPayload) => void;
  clearAll: () => void;
};

const clearedSelected: ProductListingSelectedFilters = {
  types: [],
  metals: [],
  minRating: null,
  minDiscount: null,
};

export const useProductListingFiltersStore = create<ProductListingFiltersStore>(
  (set, get) => ({
    selectedFilters: {
      types: [],
      metals: [],
      minRating: null,
      minDiscount: null,
    },
    sortOption: "relevance",
    priceRange: {
      min: clearedListingFilters.priceMin,
      max: clearedListingFilters.priceMax,
    },
    getMergedFilters: () => {
      const { selectedFilters, sortOption, priceRange } = get();
      return mergeProductListingFilters(
        selectedFilters,
        sortOption,
        priceRange,
      );
    },
    setSelectedFilters: (partial) =>
      set((s) => ({
        selectedFilters: { ...s.selectedFilters, ...partial },
      })),
    setSortOption: (sortOption) => set({ sortOption }),
    setPriceRange: (partial) =>
      set((s) => ({
        priceRange: { ...s.priceRange, ...partial },
      })),
    setFilters: (partial) =>
      set((s) => {
        const merged = mergeProductListingFilters(
          s.selectedFilters,
          s.sortOption,
          s.priceRange,
        );
        const next: ProductListingFilterState = { ...merged, ...partial };
        return {
          selectedFilters: {
            types: next.types,
            metals: next.metals,
            minRating: next.minRating,
            minDiscount: next.minDiscount,
          },
          sortOption: next.sort,
          priceRange: { min: next.priceMin, max: next.priceMax },
        };
      }),
    replaceAll: (state) =>
      set({
        selectedFilters: {
          types: state.types,
          metals: state.metals,
          minRating: state.minRating,
          minDiscount: state.minDiscount,
        },
        sortOption: state.sort,
        priceRange: { min: state.priceMin, max: state.priceMax },
      }),
    hydrateFromRoutePayload: (payload) =>
      set(() => {
        const selectedFilters: ProductListingSelectedFilters = {
          ...clearedSelected,
        };
        let priceRange: ProductListingPriceRange = {
          min: clearedListingFilters.priceMin,
          max: clearedListingFilters.priceMax,
        };
        if (payload.price) {
          priceRange = { min: payload.price.min, max: payload.price.max };
        }
        if (payload.metal) {
          selectedFilters.metals = [payload.metal];
        }
        return {
          selectedFilters,
          sortOption: mapLegacySort(payload.sort),
          priceRange,
        };
      }),
    clearAll: () =>
      set({
        selectedFilters: { ...clearedSelected },
        sortOption: clearedListingFilters.sort,
        priceRange: {
          min: clearedListingFilters.priceMin,
          max: clearedListingFilters.priceMax,
        },
      }),
  }),
);
