import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import React, { forwardRef, useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { useProductListingFiltersStore } from "@/lib/stores/productListingFiltersStore";

/**
 * Inside the sheet, sort is nullable so that no option appears
 * pre-selected when the sheet opens with a default 'relevance' store value.
 * null → treated as 'relevance' only when committed to the store via Apply.
 */
type FilterDraft = Omit<ProductListingFilterState, "sort"> & {
  sort: ProductSortOption | null;
};

const SNAP_POINTS = ["50%", "90%"] as const;
const DEFAULT_SNAP_INDEX = 1;

const SORT_ROWS: { value: ProductSortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "price_asc", label: "Price — Low to High" },
  { value: "price_desc", label: "Price — High to Low" },
  { value: "newest", label: "Newest First" },
];

function toggleMetal(list: string[], m: string): string[] {
  const lower = m.toLowerCase();
  const has = list.some((x) => x.toLowerCase() === lower);
  if (has) return list.filter((x) => x.toLowerCase() !== lower);
  return [...list, m];
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

export type FilterBottomSheetProps = {
  category: string;
  products: CategoryProduct[];
};

export const FilterBottomSheet = forwardRef<
  React.ElementRef<typeof BottomSheetModal>,
  FilterBottomSheetProps
>(function FilterBottomSheet({ category, products }, ref) {
  const insets = useSafeAreaInsets();
  const replaceAll = useProductListingFiltersStore((s) => s.replaceAll);
  const backdrop = useCallback(renderBackdrop, []);

  /** 'relevance' from the store → null so nothing appears pre-selected */
  const storeToFilterDraft = (merged: ProductListingFilterState): FilterDraft => ({
    ...merged,
    sort: merged.sort === "relevance" ? null : merged.sort,
  });

  const [draft, setDraft] = useState<FilterDraft>(() =>
    storeToFilterDraft(useProductListingFiltersStore.getState().getMergedFilters()),
  );

  const syncDraftFromStore = useCallback(() => {
    setDraft(storeToFilterDraft(useProductListingFiltersStore.getState().getMergedFilters()));
  }, []);

  /** null sort → 'relevance' when computing preview count */
  const resolvedDraft: ProductListingFilterState = {
    ...draft,
    sort: draft.sort ?? "relevance",
  };

  const resultCount = useMemo(
    () => filterListingCatalog(products, category, resolvedDraft).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, category, draft],
  );

  const dismissModal = useCallback(() => {
    const r = ref as React.MutableRefObject<React.ElementRef<
      typeof BottomSheetModal
    > | null> | null;
    r?.current?.dismiss();
  }, [ref]);

  const apply = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    replaceAll({ ...draft, sort: draft.sort ?? "relevance" });
    requestAnimationFrame(() => {
      dismissModal();
    });
  }, [dismissModal, draft, replaceAll]);

  const reset = useCallback(() => {
    void Haptics.selectionAsync();
    replaceAll(clearedListingFilters);
    setDraft({ ...clearedListingFilters, sort: null });
  }, [replaceAll]);

  const footerPaddingBottom = Math.max(insets.bottom, 16);

  return (
    <BottomSheetModal
      ref={ref}
      name="listing-filter-main"
      index={DEFAULT_SNAP_INDEX}
      snapPoints={[...SNAP_POINTS]}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={backdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
      onAnimate={(fromIndex, toIndex) => {
        if (fromIndex === -1 && toIndex >= 0) {
          syncDraftFromStore();
        }
      }}
      onDismiss={syncDraftFromStore}
    >
      <BottomSheetView style={styles.sheetRoot}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <Pressable onPress={reset} hitSlop={12} accessibilityRole="button">
            <Text style={styles.reset}>Reset</Text>
          </Pressable>
        </View>

        <BottomSheetScrollView
          style={[styles.scroll, { flex: 1 }]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Sort</Text>
          {SORT_ROWS.map((row) => (
            <RadioOption
              key={row.value}
              label={row.label}
              value={row.value}
              selectedValue={draft.sort}
              onChange={(val) =>
                setDraft((d) => ({ ...d, sort: val as ProductSortOption }))
              }
            />
          ))}

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionLabel}>Price</Text>
          <PriceRangeSlider
            min={LISTING_PRICE_ABS_MIN}
            max={LISTING_PRICE_ABS_MAX}
            low={draft.priceMin}
            high={draft.priceMax}
            step={1000}
            heroTextStyle={styles.priceHero}
            onChange={(low, high) =>
              setDraft((d) => ({ ...d, priceMin: low, priceMax: high }))
            }
          />
          <Pressable
            onPress={() =>
              setDraft((d) => ({
                ...d,
                priceMin: defaultListingFilters.priceMin,
                priceMax: defaultListingFilters.priceMax,
              }))
            }
            style={styles.resetPriceChip}
          >
            <Text style={styles.resetPriceChipText}>Reset to ₹10k — ₹5L</Text>
          </Pressable>

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionLabel}>Metal</Text>
          <View style={styles.metalRow}>
            {LISTING_METAL_OPTIONS.map((m) => {
              const on = draft.metals.some(
                (x) => x.toLowerCase() === m.toLowerCase(),
              );
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setDraft((d) => ({
                      ...d,
                      metals: toggleMetal(d.metals, m),
                    }));
                  }}
                  style={[styles.metalChip, on && styles.metalChipOn]}
                >
                  <Text
                    style={[styles.metalChipText, on && styles.metalChipTextOn]}
                  >
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ height: 24 }} />
        </BottomSheetScrollView>

        <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
          <Pressable
            onPress={apply}
            style={styles.applyBtn}
            accessibilityRole="button"
          >
            <Text style={styles.applyText}>
              Apply filters ({resultCount} results)
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  handle: { width: 40, backgroundColor: "#cbd5e1" },
  sheetBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#fff",
  },
  sheetRoot: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#001B39" },
  reset: { fontSize: 15, fontWeight: "600", color: "#64748b" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  sectionDivider: { height: 8 },
  priceHero: {
    fontSize: 18,
    fontWeight: "700",
    color: "#001B39",
    textAlign: "center",
    marginBottom: 8,
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
  metalRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  metalChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  metalChipOn: {
    borderColor: "#001B39",
    backgroundColor: "#001B39",
  },
  metalChipText: { fontSize: 13, fontWeight: "600", color: "#334155" },
  metalChipTextOn: { color: "#fff" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  applyBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#001B39",
  },
  applyText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
