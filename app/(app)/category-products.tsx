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
import { fetchCategoryProductsUi } from "@/lib/services/catalogApi";
import {
    normalizeCategoryParam,
    parseAppliedFiltersJson,
    type CategoryProduct,
} from "@/lib/services/mock/categoryProducts";
import { snapshotFromListingFields } from "@/lib/services/mock/wishlist";
import { useProductListingFiltersStore } from "@/lib/stores/productListingFiltersStore";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

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

export default function CategoryProductsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const wishIds = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const params = useLocalSearchParams<{
    category?: string;
    filters?: string;
    title?: string;
  }>();
  const categoryRaw = params.category?.toString() || "RINGS";
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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const rows = await fetchCategoryProductsUi();
        if (!mounted) return;
        setApiProducts(rows as ApiCategoryProduct[]);
        setError(null);
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
  }, []);

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

  const filteredProducts = useFilteredListingProducts(category, apiProducts);

  const displayTitle =
    titleOverride || (category === "ALL" ? "All jewellery" : category);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchCategoryProductsUi();
      setApiProducts(rows as ApiCategoryProduct[]);
      setError(null);
    } catch {
      setError("Unable to load products");
    } finally {
      setLoading(false);
    }
  }, []);

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
          style={styles.list}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.content}
          columnWrapperStyle={styles.rowWrap}
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
