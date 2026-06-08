import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
} from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductSkeletonLoader } from "@/components/loaders";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { EmptyState } from "@/lib/components/common/EmptyState";
import {
    ListingProductCard,
    type ListingProductCardItem,
} from "@/lib/components/common/ListingProductCard";
import type { ListingSheetModalRef } from "@/lib/components/listingFilters/listingSheetRefs";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import {
    ProductListingFilterChips,
    ProductListingFilterSheets,
    useFilteredListingProducts,
} from "@/lib/components/listingFilters/ProductListingFilters";
import {
  fetchCategoriesUi,
  fetchCategoryListingUi,
  fetchCategoryProductsUi,
  inferMetalFromName,
  type CategoryUi,
} from "@/lib/services/catalogApi";
import {
    normalizeCategoryParam,
    parseAppliedFiltersJson,
    type CategoryProduct,
} from "@/lib/services/mock/categoryProducts";
import { snapshotFromListingFields } from "@/lib/services/mock/wishlist";
import { getRelationshipSectionListing } from "@/services/api";
import { useProductListingFiltersStore } from "@/lib/stores/productListingFiltersStore";
import { useWishlistIds, useWishlistStore } from "@/lib/stores/wishlistStore";
import { FLAT_LIST_WINDOWED_PROPS } from "@/lib/constants/flatListPerformance";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

const UUID_V4_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ApiCategoryProduct = CategoryProduct & {
  thumbnail_image?: string | null;
  boutiqueId?: string | null;
  boutiqueName?: string | null;
  boutiqueRating?: number | null;
};

function toListingItem(item: ApiCategoryProduct): ListingProductCardItem {
  return {
    id: item.id,
    name: item.name,
    price: `₹ ${item.price.toLocaleString("en-IN")}`,
    imageUri:
      item.thumbnail_image ??
      "https://placehold.co/600x600/1f2937/e5e7eb?text=No+Image",
    boutiqueName: item.boutiqueName ?? null,
    boutiqueRating: item.boutiqueRating ?? null,
    boutiqueVerified: item.boutiqueVerified,
  };
}

function mapRelationshipListingRow(
  row: Awaited<ReturnType<typeof getRelationshipSectionListing>>["products"][number],
  index: number,
): ApiCategoryProduct {
  const boutique = row.boutique ?? null;
  const ratingRaw = boutique?.rating;
  const ratingNumber = ratingRaw == null ? null : Number(ratingRaw);
  const boutiqueRating =
    ratingNumber != null && Number.isFinite(ratingNumber) && ratingNumber > 0
      ? ratingNumber
      : null;
  const boutiqueVerified = Boolean(
    boutique?.is_verified ?? boutique?.verified ?? false,
  );
  const thumb =
    row.thumbnail_image ??
    row.primary_image ??
    row.featured_image ??
    row.image ??
    (Array.isArray(row.gallery_images) ? row.gallery_images[0] : null) ??
    null;
  return {
    id: row.id,
    name: row.name,
    category: row.category?.name ?? "RINGS",
    price: Number(row.price),
    metal: inferMetalFromName(row.name),
    styles: ["Contemporary"],
    distanceKm: 1.2 + (index % 6),
    boutiqueVerified,
    boutiqueRatedHigh: (boutiqueRating ?? 0) >= 4.7,
    services: ["walkin", "appointment"],
    openNow: true,
    thumbnail_image: thumb,
    boutiqueId: boutique?.id ?? row.boutique_id ?? null,
    boutiqueName: boutique?.name?.trim() ? boutique.name.trim() : null,
    boutiqueRating,
  };
}

export default function CategoryProductsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const wishIds = useWishlistIds();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const params = useLocalSearchParams<{
    category?: string;
    filters?: string;
    title?: string;
    relationshipSectionId?: string;
  }>();
  const relationshipSectionIdRaw = params.relationshipSectionId;
  const relationshipSectionId = (
    Array.isArray(relationshipSectionIdRaw)
      ? relationshipSectionIdRaw[0]
      : relationshipSectionIdRaw
  )
    ?.toString()
    ?.trim();
  const relationshipMode = Boolean(
    relationshipSectionId && UUID_V4_LIKE.test(relationshipSectionId),
  );

  const categoryRaw = relationshipMode ? "ALL" : params.category?.toString() || "RINGS";
  const category = normalizeCategoryParam(categoryRaw);
  const titleRaw = params.title;
  const titleOverride = (Array.isArray(titleRaw) ? titleRaw[0] : titleRaw)
    ?.toString()
    ?.trim();

  const filtersRaw = params.filters;
  const parsedFilters = useMemo(
    () =>
      parseAppliedFiltersJson(
        typeof filtersRaw === "string" ? filtersRaw : filtersRaw?.[0],
      ),
    [filtersRaw],
  );

  const hydrateFromRoutePayload = useProductListingFiltersStore(
    (s) => s.hydrateFromRoutePayload,
  );
  const clearAll = useProductListingFiltersStore((s) => s.clearAll);
  const [apiProducts, setApiProducts] = React.useState<ApiCategoryProduct[]>(
    [],
  );
  const [adminCategories, setAdminCategories] = React.useState<CategoryUi[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        if (relationshipMode && relationshipSectionId) {
          const res = await getRelationshipSectionListing(relationshipSectionId);
          if (!mounted) return;
          const mapped = (res.products ?? []).map((row, index) =>
            mapRelationshipListingRow(row, index),
          );
          setApiProducts(mapped);
          setAdminCategories([]);
          setError(null);
        } else {
          try {
            const listing = await fetchCategoryListingUi(category);
            if (!mounted) return;
            setApiProducts(listing.products as ApiCategoryProduct[]);
            setAdminCategories([
              {
                id: listing.category.id,
                name: listing.category.name,
                image: null,
                slug: listing.category.slug ?? null,
                productIds: listing.productIds,
              },
            ]);
            setError(null);
          } catch {
            const [rows, cmsCategories] = await Promise.all([
              fetchCategoryProductsUi(),
              fetchCategoriesUi().catch(() => [] as CategoryUi[]),
            ]);
            if (!mounted) return;
            setApiProducts(rows as ApiCategoryProduct[]);
            setAdminCategories(cmsCategories);
            setError(null);
          }
        }
      } catch {
        if (!mounted) return;
        setError("Unable to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [relationshipMode, relationshipSectionId, category]);

  useEffect(() => {
    clearAll();
    hydrateFromRoutePayload(parsedFilters);
  }, [category, parsedFilters, clearAll, hydrateFromRoutePayload]);

  const filterSheetRef = useRef<ListingSheetModalRef | null>(null);
  const sortSheetRef = useRef<ListingSheetModalRef | null>(null);
  const priceSheetRef = useRef<ListingSheetModalRef | null>(null);
  const metalSheetRef = useRef<ListingSheetModalRef | null>(null);

  const sheetRefs = useMemo(
    () => ({
      filter: filterSheetRef,
      sort: sortSheetRef,
      price: priceSheetRef,
      metal: metalSheetRef,
    }),
    [],
  );

  /**
   * If the admin has attached products to this category, restrict the listing
   * to those products in admin's exact sort_order. The user can still narrow
   * the result with price/metal/rating filters or re-sort via the bottom
   * sheet — but with the default "relevance" sort, admin order is honoured
   * 1:1 (no name / created_at / random shuffle).
   */
  const adminOverride = useMemo(() => {
    if (relationshipMode) return null;
    if (!adminCategories.length || !apiProducts.length) return null;
    const normalize = (value: string) =>
      value.trim().toUpperCase().replace(/\s+/g, "");
    const target = normalize(category);
    const match = adminCategories.find((row) => {
      const name = normalize(row.name ?? "");
      const slug = normalize(row.slug ?? "");
      return name === target || slug === target;
    });
    if (!match || match.productIds.length === 0) return null;
    const productById = new Map(apiProducts.map((row) => [row.id, row]));
    const ordered: ApiCategoryProduct[] = [];
    for (const id of match.productIds) {
      const hit = productById.get(id);
      if (hit) ordered.push(hit);
    }
    if (!ordered.length) return null;
    return ordered;
  }, [adminCategories, apiProducts, category, relationshipMode]);

  // When admin has curated this category, bypass the category-name filter
  // inside `useFilteredListingProducts` — our list is already pre-scoped to
  // the right category in admin's exact order. The remaining filters (price,
  // metal, rating, etc.) still apply on top.
  const filteredProducts = useFilteredListingProducts(
    adminOverride ? "ALL" : category,
    adminOverride ?? apiProducts,
  );

  const displayTitle =
    titleOverride ||
    (relationshipMode ? "Curated picks" : category === "ALL" ? "All jewellery" : category);

  const fetchProducts = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    try {
      if (relationshipMode && relationshipSectionId) {
        const res = await getRelationshipSectionListing(relationshipSectionId);
        const mapped = (res.products ?? []).map((row, index) =>
          mapRelationshipListingRow(row, index),
        );
        setApiProducts(mapped);
        setAdminCategories([]);
      } else {
        try {
          const listing = await fetchCategoryListingUi(category);
          setApiProducts(listing.products as ApiCategoryProduct[]);
          setAdminCategories([
            {
              id: listing.category.id,
              name: listing.category.name,
              image: null,
              slug: listing.category.slug ?? null,
              productIds: listing.productIds,
            },
          ]);
        } catch {
          const [rows, cmsCategories] = await Promise.all([
            fetchCategoryProductsUi(),
            fetchCategoriesUi().catch(() => [] as CategoryUi[]),
          ]);
          setApiProducts(rows as ApiCategoryProduct[]);
          setAdminCategories(cmsCategories);
        }
      }
      setError(null);
    } catch {
      setError("Unable to load products");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [relationshipMode, relationshipSectionId, category]);

  const { refreshControl } = usePullToRefresh(
    useCallback(() => fetchProducts({ silent: true }), [fetchProducts]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: displayTitle });
  }, [navigation, displayTitle]);

  const renderItem = useCallback(
    ({ item }: { item: ApiCategoryProduct }) => {
      const listing = toListingItem(item);
      return (
        <ListingProductCard
          item={listing}
          onPress={() => pushProductDetails(router, item.id)}
          isWishlisted={wishIds.includes(item.id)}
          onWishlistPress={() =>
            void toggleWishlist(
              item.id,
              snapshotFromListingFields({
                id: listing.id,
                name: listing.name,
                priceLabel: listing.price,
                imageUri: listing.imageUri,
                imageTint: listing.imageTint,
                boutiqueName: listing.boutiqueName,
                boutiqueRating: listing.boutiqueRating,
                boutiqueVerified: listing.boutiqueVerified,
              }),
            )
          }
        />
      );
    },
    [router, toggleWishlist, wishIds],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.flex}>
        <FlatList
          {...FLAT_LIST_WINDOWED_PROPS}
          style={styles.list}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.content}
          columnWrapperStyle={styles.rowWrap}
          refreshControl={refreshControl}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{displayTitle}</Text>
              <Text style={styles.headerSub}>
                Discover our curated selection of artisanal pieces, where
                heritage craftsmanship meets contemporary elegance.
              </Text>
              <ProductListingFilterChips sheetRefs={sheetRefs} />
              <Text style={styles.countLine}>
                {filteredProducts.length} items
              </Text>
              {loading ? (
                <Text style={styles.infoLine}>Loading products...</Text>
              ) : null}
              {error ? <Text style={styles.errorLine}>{error}</Text> : null}
            </View>
          }
          renderItem={renderItem}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            loading ? (
              <ProductSkeletonLoader count={6} />
            ) : (
              <View style={styles.empty}>
                <EmptyState
                  icon="inventory-2"
                  title="No products available"
                  subtitle={
                    error
                      ? "Try again or adjust your filters."
                      : "No products match these filters."
                  }
                  actionLabel={error ? "Retry" : "Change filters"}
                  onAction={
                    error
                      ? fetchProducts
                      : () => filterSheetRef.current?.present()
                  }
                />
              </View>
            )
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>
                  Experience Luxury in Person
                </Text>
                <Text style={styles.previewBody}>
                  Browse our curated selection at partnered boutiques. Book a
                  private viewing for personalized consultation.
                </Text>
              </View>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>EXPLORE MORE DESIGNS</Text>
              </View>
            </View>
          }
        />
        <ProductListingFilterSheets
          sheetRefs={sheetRefs}
          category={category}
          products={apiProducts}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },
  flex: { flex: 1 },
  list: { flex: 1 },
  content: {
    padding: spacing.md,
    backgroundColor: "#f5f5f5",
    paddingBottom: 120,
    flexGrow: 1,
  },
  header: { marginBottom: spacing.md },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: "700", color: "#15223a" },
  headerSub: {
    marginTop: spacing.sm,
    fontSize: fontSizes.xs,
    color: "#56606d",
    lineHeight: 16,
  },
  countLine: {
    marginTop: 6,
    fontSize: 12,
    color: "#666666",
    fontWeight: "600",
    marginLeft: 16,
  },
  infoLine: { marginTop: 4, marginLeft: 16, fontSize: 12, color: "#64748b" },
  errorLine: {
    marginTop: 4,
    marginLeft: 16,
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: "600",
  },
  rowWrap: { justifyContent: "space-between" },
  empty: { padding: spacing.xl, alignItems: "center" },
  emptyTitle: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: "#0f172a",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: fontSizes.sm },
  footer: { marginTop: spacing.md },
  previewCard: {
    borderRadius: 14,
    backgroundColor: "#1b2a3a",
    padding: spacing.lg,
  },
  previewTitle: { color: "#fff", fontSize: fontSizes.xl, fontWeight: "700" },
  previewBody: {
    marginTop: spacing.sm,
    color: "#d5d9df",
    fontSize: fontSizes.xs,
    lineHeight: 16,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: "#0b1f48",
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
