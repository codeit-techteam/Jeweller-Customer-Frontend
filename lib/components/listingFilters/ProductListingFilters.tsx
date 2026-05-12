import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FilterBottomSheet } from "@/lib/components/listingFilters/FilterBottomSheet";
import { FilterChip } from "@/lib/components/listingFilters/FilterChip";
import type { ListingSheetRefs } from "@/lib/components/listingFilters/listingSheetRefs";
import { PriceRangeSlider } from "@/lib/components/listingFilters/PriceRangeSlider";
import { RadioOption } from "@/lib/components/listingFilters/RadioOption";
import {
    clearedListingFilters,
    defaultListingFilters,
    filterListingCatalog,
    LISTING_METAL_OPTIONS,
    LISTING_PRICE_ABS_MAX,
    LISTING_PRICE_ABS_MIN,
    type ProductListingFilterState,
    type ProductSortOption,
} from "@/lib/services/listingCatalogFilters";
import type { CategoryProduct } from "@/lib/services/mock/categoryProducts";
import {
    mergeProductListingFilters,
    useProductListingFiltersStore,
} from "@/lib/stores/productListingFiltersStore";
import { useShallow } from "zustand/react/shallow";

const SNAP_POINTS = ["50%", "90%"] as const;
const SNAP_INDEX_MAIN = 1;

const SORT_ROWS: { value: ProductSortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price — Low to High" },
  { value: "price_desc", label: "Price — High to Low" },
  { value: "newest", label: "Newest First" },
];

function isDefaultListing(f: ProductListingFilterState): boolean {
  return (
    f.sort === "relevance" &&
    f.priceMin === clearedListingFilters.priceMin &&
    f.priceMax === clearedListingFilters.priceMax &&
    f.metals.length === 0 &&
    f.types.length === 0 &&
    f.minRating == null &&
    f.minDiscount == null
  );
}

function chipFlags(f: ProductListingFilterState) {
  return {
    sort: f.sort !== "relevance",
    filter: !isDefaultListing(f),
    price:
      f.priceMin !== clearedListingFilters.priceMin ||
      f.priceMax !== clearedListingFilters.priceMax,
    metal: f.metals.length > 0,
  };
}

/** Short INR for filter chips, e.g. 10k / 5L */
function compactInrLakh(n: number): string {
  if (n >= 100_000) {
    const l = n / 100_000;
    const rounded = l % 1 === 0 ? l : Math.round(l * 10) / 10;
    return `${String(rounded).replace(/\.0$/, "")}L`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    disappearsOnIndex={-1}
    appearsOnIndex={0}
    opacity={0.52}
    pressBehavior="close"
  />
);

export type ProductListingFilterChipsProps = {
  sheetRefs: ListingSheetRefs;
};

export function ProductListingFilterChips({
  sheetRefs,
}: ProductListingFilterChipsProps) {
  const filters = useProductListingFiltersStore(
    useShallow((s) =>
      mergeProductListingFilters(s.selectedFilters, s.sortOption, s.priceRange),
    ),
  );
  const flags = useMemo(() => chipFlags(filters), [filters]);

  const openSort = useCallback(() => {
    void Haptics.selectionAsync();
    sheetRefs.sort.current?.present();
  }, [sheetRefs.sort]);

  const openFilter = useCallback(() => {
    void Haptics.selectionAsync();
    sheetRefs.filter.current?.present();
  }, [sheetRefs.filter]);

  const openPrice = useCallback(() => {
    void Haptics.selectionAsync();
    sheetRefs.price.current?.present();
  }, [sheetRefs.price]);

  const openMetal = useCallback(() => {
    void Haptics.selectionAsync();
    sheetRefs.metal.current?.present();
  }, [sheetRefs.metal]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
      }}
      style={{ marginTop: 6 }}
    >
      <FilterChip
        label="Sort"
        icon="chevron-down"
        onPress={openSort}
        active={flags.sort}
      />
      <FilterChip
        label="Filter"
        icon="sliders"
        onPress={openFilter}
        active={flags.filter}
      />
      <FilterChip
        label={
          flags.price
            ? `₹${compactInrLakh(filters.priceMin)}–₹${compactInrLakh(filters.priceMax)}`
            : "Price"
        }
        icon="dollar-sign"
        onPress={openPrice}
        active={flags.price}
      />
      <FilterChip
        label="Metal"
        icon="circle"
        onPress={openMetal}
        active={flags.metal}
      />
    </ScrollView>
  );
}

export type ProductListingFilterSheetsProps = {
  sheetRefs: ListingSheetRefs;
  category: string;
  products: CategoryProduct[];
};

export function ProductListingFilterSheets({
  sheetRefs,
  category,
  products,
}: ProductListingFilterSheetsProps) {
  const insets = useSafeAreaInsets();
  const backdrop = useCallback(renderBackdrop, []);

  const setSortOption = useProductListingFiltersStore((s) => s.setSortOption);
  const setPriceRangeStore = useProductListingFiltersStore(
    (s) => s.setPriceRange,
  );
  const setSelectedFilters = useProductListingFiltersStore(
    (s) => s.setSelectedFilters,
  );

  /** Draft price — only committed to the store when the user taps Apply (never while dragging). */
  const [priceDraft, setPriceDraft] = useState<[number, number]>(() => {
    const pr = useProductListingFiltersStore.getState().priceRange;
    return [pr.min, pr.max];
  });

  const [sortDraft, setSortDraft] = useState<ProductSortOption>(
    () => useProductListingFiltersStore.getState().sortOption,
  );

  const [metalDraft, setMetalDraft] = useState<string[]>(() => [
    ...useProductListingFiltersStore.getState().selectedFilters.metals,
  ]);

  const syncPriceDraftFromStore = useCallback(() => {
    const pr = useProductListingFiltersStore.getState().priceRange;
    setPriceDraft([pr.min, pr.max]);
  }, []);

  const syncSortDraftFromStore = useCallback(() => {
    setSortDraft(useProductListingFiltersStore.getState().sortOption);
  }, []);

  const syncMetalDraftFromStore = useCallback(() => {
    setMetalDraft([
      ...useProductListingFiltersStore.getState().selectedFilters.metals,
    ]);
  }, []);

  const dismissSort = useCallback(() => {
    sheetRefs.sort.current?.dismiss();
  }, [sheetRefs.sort]);

  const dismissPrice = useCallback(() => {
    sheetRefs.price.current?.dismiss();
  }, [sheetRefs.price]);

  const dismissMetal = useCallback(() => {
    sheetRefs.metal.current?.dismiss();
  }, [sheetRefs.metal]);

  const applyPrice = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPriceRangeStore({ min: priceDraft[0], max: priceDraft[1] });
    dismissPrice();
  }, [dismissPrice, priceDraft, setPriceRangeStore]);

  const applySort = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortOption(sortDraft);
    dismissSort();
  }, [dismissSort, setSortOption, sortDraft]);

  const applyMetal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFilters({ metals: metalDraft });
    dismissMetal();
  }, [dismissMetal, metalDraft, setSelectedFilters]);

  const resetPriceDraftToDefaults = useCallback(() => {
    void Haptics.selectionAsync();
    setPriceDraft([
      defaultListingFilters.priceMin,
      defaultListingFilters.priceMax,
    ]);
  }, []);

  return (
    <>
      <FilterBottomSheet
        ref={sheetRefs.filter}
        category={category}
        products={products}
      />

      <BottomSheetModal
        ref={sheetRefs.sort}
        name="listing-sort"
        index={SNAP_INDEX_MAIN}
        snapPoints={[...SNAP_POINTS]}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={backdrop}
        handleIndicatorStyle={sheetStyles.handle}
        backgroundStyle={sheetStyles.sheetBg}
        onAnimate={(fromIndex, toIndex) => {
          if (fromIndex === -1 && toIndex >= 0) {
            syncSortDraftFromStore();
          }
        }}
      >
        <BottomSheetView style={sheetStyles.sheetInner}>
          <Text style={sheetStyles.sheetTitle}>Sort by</Text>
          <View style={sheetStyles.rule} />
          <BottomSheetScrollView
            style={sheetStyles.flexScroll}
            contentContainerStyle={sheetStyles.scrollPad}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {SORT_ROWS.map((row) => (
              <RadioOption
                key={row.value}
                label={row.label}
                value={row.value}
                selectedValue={sortDraft}
                onChange={(val) => setSortDraft(val as ProductSortOption)}
              />
            ))}
            <Pressable onPress={applySort} style={sheetStyles.apply}>
              <Text style={sheetStyles.applyText}>Apply sort</Text>
            </Pressable>
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={sheetRefs.price}
        name="listing-price"
        index={SNAP_INDEX_MAIN}
        snapPoints={[...SNAP_POINTS]}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={backdrop}
        handleIndicatorStyle={sheetStyles.handle}
        backgroundStyle={sheetStyles.sheetBg}
        onAnimate={(fromIndex, toIndex) => {
          if (fromIndex === -1 && toIndex >= 0) {
            syncPriceDraftFromStore();
          }
        }}
      >
        <BottomSheetView style={sheetStyles.sheetInner}>
          <Text style={sheetStyles.sheetTitle}>Price</Text>
          <View style={sheetStyles.rule} />
          <BottomSheetScrollView
            style={sheetStyles.flexScroll}
            contentContainerStyle={sheetStyles.scrollPad}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <PriceRangeSlider
              min={LISTING_PRICE_ABS_MIN}
              max={LISTING_PRICE_ABS_MAX}
              low={priceDraft[0]}
              high={priceDraft[1]}
              step={1000}
              heroTextStyle={sheetStyles.priceHero}
              onChange={(low, high) => setPriceDraft([low, high])}
            />
            <Pressable
              onPress={resetPriceDraftToDefaults}
              style={sheetStyles.resetPriceChip}
            >
              <Text style={sheetStyles.resetPriceChipText}>
                Reset to ₹10k — ₹5L
              </Text>
            </Pressable>
            <Pressable onPress={applyPrice} style={sheetStyles.apply}>
              <Text style={sheetStyles.applyText}>Apply price</Text>
            </Pressable>
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>

      <BottomSheetModal
        ref={sheetRefs.metal}
        name="listing-metal"
        index={SNAP_INDEX_MAIN}
        snapPoints={[...SNAP_POINTS]}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={backdrop}
        handleIndicatorStyle={sheetStyles.handle}
        backgroundStyle={sheetStyles.sheetBg}
        onAnimate={(fromIndex, toIndex) => {
          if (fromIndex === -1 && toIndex >= 0) {
            syncMetalDraftFromStore();
          }
        }}
      >
        <BottomSheetView style={sheetStyles.sheetInner}>
          <Text style={sheetStyles.sheetTitle}>Metal</Text>
          <View style={sheetStyles.rule} />
          <BottomSheetScrollView
            style={sheetStyles.flexScroll}
            contentContainerStyle={sheetStyles.scrollPad}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {(() => {
              const ANY_METAL = "__any__";
              const selectedMetalValue =
                metalDraft.length === 1 ? metalDraft[0] : ANY_METAL;
              const onMetalChange = (val: string) => {
                if (val === ANY_METAL) setMetalDraft([]);
                else setMetalDraft([val]);
              };
              return (
                <>
                  <RadioOption
                    label="Any metal"
                    value={ANY_METAL}
                    selectedValue={selectedMetalValue}
                    onChange={onMetalChange}
                  />
                  {LISTING_METAL_OPTIONS.map((m) => (
                    <RadioOption
                      key={m}
                      label={m}
                      value={m}
                      selectedValue={selectedMetalValue}
                      onChange={onMetalChange}
                    />
                  ))}
                </>
              );
            })()}
            <Pressable onPress={applyMetal} style={sheetStyles.apply}>
              <Text style={sheetStyles.applyText}>Apply metal</Text>
            </Pressable>
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const sheetStyles = StyleSheet.create({
  handle: { width: 40, backgroundColor: "#cbd5e1" },
  sheetBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#fff",
  },
  sheetInner: { flex: 1, paddingHorizontal: 20 },
  flexScroll: { flex: 1 },
  scrollPad: { paddingTop: 8, paddingBottom: 8 },
  sheetTitle: {
    paddingTop: 4,
    paddingBottom: 10,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e2e8f0",
    marginBottom: 4,
  },
  priceHero: {
    fontSize: 20,
    fontWeight: "700",
    color: "#001B39",
    textAlign: "center",
    marginBottom: 12,
  },
  resetPriceChip: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  resetPriceChipText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  apply: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#001B39",
  },
  applyText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

export function useFilteredListingProducts(
  category: string,
  products: CategoryProduct[],
) {
  const filters = useProductListingFiltersStore(
    useShallow((s) =>
      mergeProductListingFilters(s.selectedFilters, s.sortOption, s.priceRange),
    ),
  );
  return useMemo(
    () => filterListingCatalog(products, category, filters),
    [products, category, filters],
  );
}
