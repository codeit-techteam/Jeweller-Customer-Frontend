import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetView,
    type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { ProductSkeletonLoader } from "@/components/loaders";
import { useCollectionProducts } from "@/hooks/useProductCatalog";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import { CollectionHero } from "@/lib/components/common/CollectionHero";
import {
    CollectionProductCard,
    type CollectionProductCardItem,
} from "@/lib/components/common/CollectionProductCard";
import { EditorialCard } from "@/lib/components/common/EditorialCard";
import { FilterChip } from "@/lib/components/listingFilters/FilterChip";
import { PriceRangeSlider } from "@/lib/components/listingFilters/PriceRangeSlider";
import { RadioOption } from "@/lib/components/listingFilters/RadioOption";
import {
    getEditorialExploreTarget,
    type CollectionScreenConfig,
} from "@/lib/services/mock/collections/collectionScreenConfig";
import { snapshotFromListingFields } from "@/lib/services/mock/wishlist";
import type { CatalogProduct } from "@/lib/services/productCatalog";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { fontSizes, spacing } from "@/src/constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const PAD = spacing.lg;
const GAP = spacing.md;
const COL_W = (SCREEN_W - PAD * 2 - GAP) / 2;

/* ---------------- filter model ---------------- */

const PRICE_MIN = 5_000;
const PRICE_MAX = 1_000_000;
const PRICE_STEP = 1_000;

const METAL_OPTIONS = ["Gold", "Silver", "Platinum", "Rose Gold"] as const;

/**
 * Sort identifiers match the unified Rings filter vocabulary.
 *
 * `null`  — no sort applied (catalog order, nothing pre-selected in the sheet).
 * `"relevance"` / `"popularity"` — explicit user picks; also catalog order, but
 *           visually selected so the user gets feedback they "sorted".
 */
type SortKey =
  | null
  | "relevance"
  | "popularity"
  | "lowToHigh"
  | "highToLow"
  | "newest";

type CollectionFilters = {
  price: [number, number];
  sort: SortKey;
  metal: string[];
};

const defaultFilters: CollectionFilters = {
  price: [PRICE_MIN, PRICE_MAX],
  sort: null,
  metal: [],
};

const SORT_ROWS: { value: Exclude<SortKey, null>; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "lowToHigh", label: "Price — Low to High" },
  { value: "highToLow", label: "Price — High to Low" },
  { value: "newest", label: "Newest First" },
];

function inferProductMetals(product: CatalogProduct): string[] {
  if (product.metals.length > 0) {
    return product.metals.map((m) => m.trim()).filter(Boolean);
  }
  const d = `${product.description ?? ""} ${product.name ?? ""}`.toLowerCase();
  const out = new Set<string>();
  if (d.includes("rose gold")) out.add("Rose Gold");
  if (d.includes("platinum")) out.add("Platinum");
  if (d.includes("silver")) out.add("Silver");
  const nonRose = d.replace(/rose gold/g, "");
  if (/gold/.test(nonRose)) out.add("Gold");
  return [...out];
}

/** `null` and `"relevance"` both mean "no real sort applied". */
function isNoOpSort(sort: SortKey): boolean {
  return sort === null || sort === "relevance";
}

function isDefaultFilters(f: CollectionFilters): boolean {
  return (
    f.price[0] === defaultFilters.price[0] &&
    f.price[1] === defaultFilters.price[1] &&
    isNoOpSort(f.sort) &&
    f.metal.length === 0
  );
}

function applyCollectionFilters(
  products: CatalogProduct[],
  f: CollectionFilters,
): CatalogProduct[] {
  let list = [...products];

  if (f.price[0] !== PRICE_MIN || f.price[1] !== PRICE_MAX) {
    list = list.filter((p) => p.price >= f.price[0] && p.price <= f.price[1]);
  }

  if (f.metal.length > 0) {
    const set = new Set(f.metal.map((m) => m.toLowerCase()));
    list = list.filter((p) =>
      inferProductMetals(p).some((m) => set.has(m.toLowerCase())),
    );
  }

  if (f.sort === "lowToHigh") list.sort((a, b) => a.price - b.price);
  else if (f.sort === "highToLow") list.sort((a, b) => b.price - a.price);
  else if (f.sort === "newest") list.sort((a, b) => b.id.localeCompare(a.id));

  return list;
}

function toCardItem(p: CatalogProduct): CollectionProductCardItem {
  return {
    id: p.id,
    name: p.name,
    description:
      p.description?.trim() ||
      [p.category, p.collectionName].filter(Boolean).join(" · ") ||
      "Fine jewellery",
    price: p.price,
    image: p.imageUri,
    tag: p.trending ? "TRENDING" : undefined,
    boutiqueName: p.boutiqueName,
    boutiqueRating: p.boutiqueRating,
    boutiqueVerified: p.boutiqueVerified,
  };
}

function sortChipLabelFor(sort: SortKey): string {
  if (isNoOpSort(sort)) return "Sort";
  const row = SORT_ROWS.find((r) => r.value === sort);
  return row?.label ?? "Sort";
}

function compactInr(n: number): string {
  if (n >= 100_000) {
    const l = n / 100_000;
    const rounded = l % 1 === 0 ? l : Math.round(l * 10) / 10;
    return `${String(rounded).replace(/\.0$/, "")}L`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}

/* ---------------- component ---------------- */

/**
 * Single tall snap — prevents the price slider / last sort row from being
 * clipped behind the Apply bar on shorter devices.
 */
const SHEET_SNAPS = ["90%"] as const;
const SHEET_INDEX = 0;

const renderBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop
    {...props}
    appearsOnIndex={0}
    disappearsOnIndex={-1}
    opacity={0.52}
    pressBehavior="close"
  />
);

type Props = {
  config: CollectionScreenConfig;
  /** Route slug from `collection/[slug]` — drives "Explore collection" destination */
  collectionSlug: string;
};

export function CollectionScreen({ config, collectionSlug }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishIds = useWishlistStore((s) => s.ids);

  const {
    products: backendProducts,
    loading: productsLoading,
    error: productsError,
    refetch,
  } = useCollectionProducts(collectionSlug);

  const allProducts = backendProducts;
  const splitIndex = Math.min(4, allProducts.length);
  const before = useMemo(
    () => allProducts.slice(0, splitIndex),
    [allProducts, splitIndex],
  );
  const after = useMemo(
    () => allProducts.slice(splitIndex),
    [allProducts, splitIndex],
  );

  // Draft (modal-local) vs applied (commits filtering). Initial load: no filtering.
  const [tempFilters, setTempFilters] =
    useState<CollectionFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<CollectionFilters>(defaultFilters);

  const hasActive = useMemo(
    () => !isDefaultFilters(appliedFilters),
    [appliedFilters],
  );

  const filteredAll = useMemo(
    () => applyCollectionFilters(allProducts, appliedFilters),
    [allProducts, appliedFilters],
  );

  /** Live result count for the Apply button — reflects the in-progress draft. */
  const liveCount = useMemo(
    () => applyCollectionFilters(allProducts, tempFilters).length,
    [allProducts, tempFilters],
  );

  const flags = useMemo(
    () => ({
      sort: !isNoOpSort(appliedFilters.sort),
      price:
        appliedFilters.price[0] !== PRICE_MIN ||
        appliedFilters.price[1] !== PRICE_MAX,
      metal: appliedFilters.metal.length > 0,
      filter:
        appliedFilters.metal.length > 0 ||
        !isNoOpSort(appliedFilters.sort) ||
        appliedFilters.price[0] !== PRICE_MIN ||
        appliedFilters.price[1] !== PRICE_MAX,
    }),
    [appliedFilters],
  );

  /**
   * One ref per chip-triggered sheet. Each chip opens ONLY its own sheet,
   * matching the Rings (`ProductListingFilters`) behavior.
   */
  const sortRef = useRef<BottomSheetModal>(null);
  const filterRef = useRef<BottomSheetModal>(null);
  const priceRef = useRef<BottomSheetModal>(null);
  const metalRef = useRef<BottomSheetModal>(null);

  /** Seed the draft from the applied state every time a sheet opens. */
  const syncDraftFromApplied = useCallback(() => {
    setTempFilters({
      price: [...appliedFilters.price] as [number, number],
      sort: appliedFilters.sort,
      metal: [...appliedFilters.metal],
    });
  }, [appliedFilters]);

  const openSort = useCallback(() => {
    void Haptics.selectionAsync();
    syncDraftFromApplied();
    sortRef.current?.present();
  }, [syncDraftFromApplied]);

  const openFilter = useCallback(() => {
    void Haptics.selectionAsync();
    syncDraftFromApplied();
    filterRef.current?.present();
  }, [syncDraftFromApplied]);

  const openPrice = useCallback(() => {
    void Haptics.selectionAsync();
    syncDraftFromApplied();
    priceRef.current?.present();
  }, [syncDraftFromApplied]);

  const openMetal = useCallback(() => {
    void Haptics.selectionAsync();
    syncDraftFromApplied();
    metalRef.current?.present();
  }, [syncDraftFromApplied]);

  const closeAllModals = useCallback(() => {
    sortRef.current?.dismiss();
    filterRef.current?.dismiss();
    priceRef.current?.dismiss();
    metalRef.current?.dismiss();
  }, []);

  /* apply / reset
   * `applyFilters` commits the full draft (used by the combined Filter sheet).
   * The *Only variants commit a single slice so the chip-level sheets never
   * accidentally overwrite a sibling filter the user didn't touch.
   */

  const applyFilters = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppliedFilters(tempFilters);
    closeAllModals();
  }, [tempFilters, closeAllModals]);

  const applyPriceOnly = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppliedFilters((prev) => ({
      ...prev,
      price: [...tempFilters.price] as [number, number],
    }));
    priceRef.current?.dismiss();
  }, [tempFilters.price]);

  const applySortOnly = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppliedFilters((prev) => ({ ...prev, sort: tempFilters.sort }));
    sortRef.current?.dismiss();
  }, [tempFilters.sort]);

  const applyMetalOnly = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppliedFilters((prev) => ({ ...prev, metal: [...tempFilters.metal] }));
    metalRef.current?.dismiss();
  }, [tempFilters.metal]);

  const resetFilters = useCallback(() => {
    void Haptics.selectionAsync();
    setTempFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  }, []);

  const toggleDraftMetal = useCallback((metal: string) => {
    void Haptics.selectionAsync();
    setTempFilters((prev) => {
      const lower = metal.toLowerCase();
      const has = prev.metal.some((m) => m.toLowerCase() === lower);
      return {
        ...prev,
        metal: has
          ? prev.metal.filter((m) => m.toLowerCase() !== lower)
          : [...prev.metal, metal],
      };
    });
  }, []);

  const setDraftSort = useCallback((value: SortKey) => {
    void Haptics.selectionAsync();
    setTempFilters((prev) => ({ ...prev, sort: value }));
  }, []);

  const resetDraftPrice = useCallback(() => {
    void Haptics.selectionAsync();
    setTempFilters((prev) => ({ ...prev, price: [PRICE_MIN, PRICE_MAX] }));
  }, []);

  const setDraftPrice = useCallback((low: number, high: number) => {
    setTempFilters((prev) => ({ ...prev, price: [low, high] }));
  }, []);

  /* shared helpers */

  const isWishlisted = useCallback(
    (id: string) => wishIds.includes(id),
    [wishIds],
  );

  const openProduct = useCallback(
    (id: string) => {
      pushProductDetails(router, id);
    },
    [router],
  );

  const onEditorialExplore = useCallback(() => {
    const { category, title } = getEditorialExploreTarget(
      collectionSlug,
      config.navTitle,
    );
    router.push({
      pathname: "/(app)/category-products",
      params: { category, title },
    });
  }, [router, collectionSlug, config.navTitle]);

  /* chip labels reflect the applied state */

  const sortChipLabel = useMemo(
    () => sortChipLabelFor(appliedFilters.sort),
    [appliedFilters.sort],
  );

  const priceChipLabel = useMemo(() => {
    if (!flags.price) return "₹ Price";
    return `₹${compactInr(appliedFilters.price[0])}–₹${compactInr(
      appliedFilters.price[1],
    )}`;
  }, [flags.price, appliedFilters.price]);

  const metalChipLabel = useMemo(() => {
    if (!flags.metal) return "Metal";
    if (appliedFilters.metal.length === 1) return appliedFilters.metal[0];
    return `Metal · ${appliedFilters.metal.length}`;
  }, [flags.metal, appliedFilters.metal]);

  /* ------- render helpers ------- */

  const renderChipsRow = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      <FilterChip
        label={sortChipLabel}
        icon="chevron-down"
        active={flags.sort}
        onPress={openSort}
      />
      <FilterChip
        label="Filter"
        icon="sliders"
        active={flags.filter}
        onPress={openFilter}
      />
      <FilterChip
        label={priceChipLabel}
        icon="dollar-sign"
        active={flags.price}
        onPress={openPrice}
      />
      <FilterChip
        label={metalChipLabel}
        icon="circle"
        active={flags.metal}
        onPress={openMetal}
      />
      {hasActive ? (
        <Pressable
          onPress={resetFilters}
          hitSlop={8}
          style={styles.resetInline}
        >
          <Text style={styles.resetInlineText}>Reset</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );

  const renderProductGrid = (items: CatalogProduct[]) => (
    <View style={styles.grid}>
      {items.map((item) => {
        const card = toCardItem(item);
        return (
          <CollectionProductCard
            key={item.id}
            item={card}
            width={COL_W}
            wishlisted={isWishlisted(item.id)}
            onPress={() => openProduct(item.id)}
            onToggleWishlist={() =>
              void toggleWishlist(
                item.id,
                snapshotFromListingFields({
                  id: item.id,
                  name: item.name,
                  priceLabel: `₹ ${item.price.toLocaleString("en-IN")}`,
                  imageUri: item.imageUri,
                  imageTint: item.imageTint,
                  boutiqueName: item.boutiqueName,
                  boutiqueRating: item.boutiqueRating,
                  boutiqueVerified: item.boutiqueVerified,
                }),
              )
            }
          />
        );
      })}
    </View>
  );

  /* Sheet-internal rows */

  const renderSortRows = () => (
    <>
      {SORT_ROWS.map((row) => (
        <RadioOption
          key={row.value}
          label={row.label}
          value={row.value}
          selectedValue={tempFilters.sort ?? undefined}
          onChange={(val) => setDraftSort(val as Exclude<SortKey, null>)}
        />
      ))}
    </>
  );

  const renderMetalChips = () => (
    <View style={sheet.metalRow}>
      {METAL_OPTIONS.map((m) => {
        const on = tempFilters.metal.some(
          (x) => x.toLowerCase() === m.toLowerCase(),
        );
        return (
          <Pressable
            key={m}
            onPress={() => toggleDraftMetal(m)}
            style={[sheet.metalChip, on && sheet.metalChipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[sheet.metalChipText, on && sheet.metalChipTextOn]}>
              {m}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderApplyBar = () => (
    <View style={sheet.applyBar}>
      <Pressable onPress={resetFilters} style={sheet.resetBtn} hitSlop={6}>
        <Text style={sheet.resetBtnText}>Reset</Text>
      </Pressable>
      <Pressable onPress={applyFilters} style={sheet.applyBtn}>
        <Text style={sheet.applyBtnText}>
          Apply filters ({liveCount} {liveCount === 1 ? "result" : "results"})
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color="#1f2937" />
        </Pressable>
        <Text style={styles.navTitle}>{config.navTitle}</Text>
        <View style={styles.backSlot} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        stickyHeaderIndices={[1]}
      >
        <CollectionHero
          imageUri={config.heroUri}
          label={config.heroLabel}
          title={config.heroTitle}
          subtitle={config.heroSubtitle}
        />

        <View style={styles.stickyChips}>{renderChipsRow()}</View>

        {productsLoading && allProducts.length === 0 ? (
          <View style={styles.skeletonPad}>
            <ProductSkeletonLoader count={6} />
          </View>
        ) : productsError && allProducts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              We couldn’t load this collection just now.
            </Text>
            <Pressable onPress={() => void refetch()} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Try again</Text>
            </Pressable>
          </View>
        ) : allProducts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No pieces published in this collection yet.
            </Text>
            <Pressable onPress={() => void refetch()} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Refresh</Text>
            </Pressable>
          </View>
        ) : hasActive ? (
          <>
            <Text style={styles.countLine}>
              {filteredAll.length}{" "}
              {filteredAll.length === 1 ? "result" : "results"}
            </Text>
            {filteredAll.length > 0 ? (
              renderProductGrid(filteredAll)
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>
                  No pieces match these filters
                </Text>
                <Pressable onPress={resetFilters} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Reset filters</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <>
            {renderProductGrid(before)}

            <View style={styles.editorialPad}>
              <EditorialCard
                imageUri={config.editorial.image}
                label={config.editorial.label}
                title={config.editorial.title}
                body={config.editorial.body}
                buttonLabel="EXPLORE COLLECTION"
                onPressExplore={onEditorialExplore}
              />
            </View>

            {after.length > 0 ? renderProductGrid(after) : null}
          </>
        )}

        <View style={styles.footerBlock}>
          <Text style={styles.footerTitle}>{config.footer.title}</Text>
          <Text style={styles.footerBody}>{config.footer.body}</Text>
        </View>
      </ScrollView>

      {/* ---------- Sort sheet (chip-only, mirrors Rings `ProductListingFilters`) ---------- */}
      <BottomSheetModal
        ref={sortRef}
        name="collection-sort"
        index={SHEET_INDEX}
        snapPoints={[...SHEET_SNAPS]}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={sheet.handle}
        backgroundStyle={sheet.sheetBg}
      >
        <BottomSheetView style={sheet.inner}>
          <Text style={sheet.sectionTop}>Sort by</Text>
          <View style={sheet.rule} />
          <BottomSheetScrollView
            style={sheet.flex}
            contentContainerStyle={sheet.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {renderSortRows()}
            <Pressable onPress={applySortOnly} style={sheet.applySolo}>
              <Text style={sheet.applySoloText}>Apply sort</Text>
            </Pressable>
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>

      {/* ---------- Price sheet (chip-only, mirrors Rings `ProductListingFilters`) ---------- */}
      <BottomSheetModal
        ref={priceRef}
        name="collection-price"
        index={SHEET_INDEX}
        snapPoints={[...SHEET_SNAPS]}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={sheet.handle}
        backgroundStyle={sheet.sheetBg}
      >
        <BottomSheetView style={sheet.inner}>
          <Text style={sheet.sectionTop}>Price</Text>
          <View style={sheet.rule} />
          <BottomSheetScrollView
            style={sheet.flex}
            contentContainerStyle={sheet.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            <PriceRangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              low={tempFilters.price[0]}
              high={tempFilters.price[1]}
              step={PRICE_STEP}
              heroTextStyle={sheet.priceHero}
              onChange={setDraftPrice}
            />
            <Pressable onPress={resetDraftPrice} style={sheet.resetChip}>
              <Text style={sheet.resetChipText}>
                Reset to ₹{compactInr(PRICE_MIN)} — ₹{compactInr(PRICE_MAX)}
              </Text>
            </Pressable>
            <Pressable onPress={applyPriceOnly} style={sheet.applySolo}>
              <Text style={sheet.applySoloText}>Apply price</Text>
            </Pressable>
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>

      {/* ---------- Metal sheet (chip-only, multi-select) ---------- */}
      <BottomSheetModal
        ref={metalRef}
        name="collection-metal"
        index={SHEET_INDEX}
        snapPoints={[...SHEET_SNAPS]}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={sheet.handle}
        backgroundStyle={sheet.sheetBg}
      >
        <BottomSheetView style={sheet.inner}>
          <Text style={sheet.sectionTop}>Metal</Text>
          <View style={sheet.rule} />
          <BottomSheetScrollView
            style={sheet.flex}
            contentContainerStyle={sheet.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {renderMetalChips()}
            <Pressable onPress={applyMetalOnly} style={sheet.applySolo}>
              <Text style={sheet.applySoloText}>Apply metal</Text>
            </Pressable>
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheetModal>

      {/* ---------- Combined Filter sheet (Sort → Price → Metal, mirrors Rings) ---------- */}
      <BottomSheetModal
        ref={filterRef}
        name="collection-filter"
        index={SHEET_INDEX}
        snapPoints={[...SHEET_SNAPS]}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={sheet.handle}
        backgroundStyle={sheet.sheetBg}
      >
        <BottomSheetView style={sheet.inner}>
          <Text style={sheet.title}>Filters</Text>
          <View style={sheet.rule} />
          <BottomSheetScrollView
            style={sheet.flex}
            contentContainerStyle={sheet.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            <Text style={sheet.section}>Sort</Text>
            {renderSortRows()}

            <View style={sheet.sectionDivider} />
            <Text style={sheet.section}>Price</Text>
            <PriceRangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              low={tempFilters.price[0]}
              high={tempFilters.price[1]}
              step={PRICE_STEP}
              heroTextStyle={sheet.priceHero}
              onChange={setDraftPrice}
            />
            <Pressable onPress={resetDraftPrice} style={sheet.resetChip}>
              <Text style={sheet.resetChipText}>
                Reset to ₹{compactInr(PRICE_MIN)} — ₹{compactInr(PRICE_MAX)}
              </Text>
            </Pressable>

            <View style={sheet.sectionDivider} />
            <Text style={sheet.section}>Metal</Text>
            {renderMetalChips()}

            <View style={{ height: 24 }} />
          </BottomSheetScrollView>
          {renderApplyBar()}
          <View style={{ height: Math.max(insets.bottom, 12) }} />
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: { width: 40 },
  backSlot: { width: 40 },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#374151",
  },
  scroll: {
    paddingBottom: spacing["2xl"],
  },
  stickyChips: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resetInline: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetInlineText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textDecorationLine: "underline",
  },
  countLine: {
    paddingHorizontal: PAD,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: PAD,
    paddingTop: spacing.sm,
  },
  editorialPad: {
    paddingHorizontal: PAD,
  },
  skeletonPad: {
    paddingHorizontal: PAD,
    paddingTop: spacing.md,
  },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: "#0B1C2C",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: fontSizes.sm },
  footerBlock: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing["2xl"],
    alignItems: "center",
  },
  footerTitle: {
    fontSize: fontSizes["2xl"],
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  footerBody: {
    fontSize: fontSizes.sm,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 340,
  },
});

const sheet = StyleSheet.create({
  handle: { width: 40, backgroundColor: "#cbd5e1" },
  sheetBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#fff",
  },
  inner: { flex: 1, paddingHorizontal: 20 },
  flex: { flex: 1 },
  scrollPad: { paddingTop: 8, paddingBottom: 40 },
  title: {
    paddingTop: 4,
    paddingBottom: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1C2C",
  },
  /** Uppercase label used at the top of chip-only sheets (Rings parity). */
  sectionTop: {
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
  section: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#6B7280",
    textTransform: "uppercase",
  },
  sectionDivider: { height: 8 },
  metalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  metalChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  metalChipOn: {
    borderColor: "#0B1C2C",
    backgroundColor: "#0B1C2C",
  },
  metalChipText: { fontSize: 13, fontWeight: "600", color: "#111827" },
  metalChipTextOn: { color: "#fff" },
  priceHero: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0B1C2C",
    textAlign: "center",
    marginBottom: 12,
  },
  resetChip: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
  },
  resetChipText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  applyBar: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e8f0",
  },
  resetBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  resetBtnText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  applyBtn: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#0B1C2C",
  },
  applyBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  /** Full-width single-action CTA (Apply price / Apply sort / Apply metal). */
  applySolo: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#0B1C2C",
  },
  applySoloText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
