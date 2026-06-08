import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
    ListingProductCard,
    type ListingProductCardItem,
} from "@/lib/components/common/ListingProductCard";
import { SectionHeader } from "@/lib/components/common/SectionHeader";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import { fetchTrendingProductsUi } from "@/lib/services/catalogApi";
import { snapshotFromListingFields } from "@/lib/services/mock/wishlist";
import { useWishlistIds, useWishlistStore } from "@/lib/stores/wishlistStore";
import { PLACEHOLDER_IMAGE_URI } from "@/lib/services/mock/imageUrls";
import { FLAT_LIST_WINDOWED_PROPS } from "@/lib/constants/flatListPerformance";
import { BottomTabBar } from "@/src/components/navigation/BottomTabBar";
import { fontSizes, radius, spacing } from "@/src/constants/theme";
type TrendingProduct = Awaited<
  ReturnType<typeof fetchTrendingProductsUi>
>[number];

const INTRO_BODY =
  "Discover our most-coveted jewelry pieces. From handcrafted diamonds to ethereal gold silhouettes, explore what's shaping the modern luxury landscape.";

function toListingItem(item: TrendingProduct): ListingProductCardItem {
  return {
    id: item.id,
    name: item.title,
    price: item.price,
    imageUri: item.imageUri ?? PLACEHOLDER_IMAGE_URI,
    imageTint: item.imageTint,
    boutiqueName: item.boutiqueName,
    boutiqueRating: item.boutiqueRating,
    boutiqueVerified: item.boutiqueVerified,
  };
}

export default function TrendingScreen() {
  const router = useRouter();
  const wishIds = useWishlistIds();
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const trendingFocusNonce = useRef(false);

  const loadTrending = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const rows = await fetchTrendingProductsUi();
      setTrendingProducts(rows);
      setError(null);
    } catch (err) {
      console.error("Failed to load trending products", err);
      if (!silent) setError("Unable to load trending products");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTrending({ silent: trendingFocusNonce.current });
      trendingFocusNonce.current = true;
    }, [loadTrending]),
  );

  const { refreshControl } = usePullToRefresh(
    useCallback(() => loadTrending({ silent: true }), [loadTrending]),
  );

  const openProduct = useCallback(
    (id: string) => {
      pushProductDetails(router, id);
    },
    [router],
  );

  const onEyebrowPress = useCallback(() => {
    console.log("[Trending] Curated selection tapped");
  }, []);

  const onViewMore = useCallback(() => {
    console.log("[Trending] View more pieces");
  }, []);

  const listingData = useMemo(
    () => trendingProducts.map(toListingItem),
    [trendingProducts],
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.topIcon}
          >
            <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
          </Pressable>
          <Text style={styles.topTitle}>Trending Now</Text>
          <View style={styles.topIcon} />
        </View>

        <FlatList
          {...FLAT_LIST_WINDOWED_PROPS}
          style={styles.listFlex}
          data={listingData}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <SectionHeader
              eyebrow="CURATED SELECTION"
              title="THE SEASON'S FINEST"
              body={
                loading
                  ? "Loading trending pieces..."
                  : error
                    ? error
                    : INTRO_BODY
              }
              onEyebrowPress={onEyebrowPress}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No trending products</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ListingProductCard
              item={item}
              onPress={() => openProduct(item.id)}
              isWishlisted={wishIds.includes(item.id)}
              onWishlistPress={() =>
                void toggleWishlist(
                  item.id,
                  snapshotFromListingFields({
                    id: item.id,
                    name: item.name,
                    priceLabel: item.price,
                    imageUri: item.imageUri,
                    imageTint: item.imageTint,
                    boutiqueName: item.boutiqueName,
                    boutiqueRating: item.boutiqueRating,
                    boutiqueVerified: item.boutiqueVerified,
                  }),
                )
              }
            />
          )}
          ListFooterComponent={
            loading ? null : (
              <View style={styles.footer}>
                <Pressable
                  accessibilityRole="button"
                  onPress={onViewMore}
                  style={({ pressed }) => [
                    styles.viewMoreBtn,
                    pressed && styles.viewMorePressed,
                  ]}
                >
                  <Text style={styles.viewMoreText}>VIEW MORE PIECES</Text>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={20}
                    color="#fff"
                  />
                </Pressable>
                <Text style={styles.countLine}>
                  SHOWING {trendingProducts.length} TRENDING{" "}
                  {trendingProducts.length === 1 ? "PIECE" : "PIECES"}
                </Text>
              </View>
            )
          }
        />
      </View>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#FFFFFF",
  },
  topIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#0f172a",
  },
  listFlex: { flex: 1, backgroundColor: "#FFFFFF" },
  listContent: {
    paddingTop: 10,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: "#0f172a",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing["2xl"],
    borderRadius: radius.full,
    minWidth: 260,
  },
  viewMorePressed: {
    opacity: 0.88,
  },
  viewMoreText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  countLine: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: "#94a3b8",
  },
  emptyWrap: { paddingVertical: 24, alignItems: "center" },
  emptyText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
});
