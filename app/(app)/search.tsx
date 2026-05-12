import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductSkeletonLoader } from "@/components/loaders";
import { useProductSearch } from "@/hooks/useProductCatalog";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import { CategoryCard } from "@/lib/components/common/CategoryCard";
import {
    ListingProductCard,
    type ListingProductCardItem,
} from "@/lib/components/common/ListingProductCard";
import { PressScale } from "@/lib/components/common/PressScale";
import { ProductCard } from "@/lib/components/common/ProductCard";
import { RemoteImage } from "@/lib/components/common/RemoteImage";
import { SearchBar } from "@/lib/components/common/SearchBar";
import { SearchItem } from "@/lib/components/common/SearchItem";
import { categoryImageUri } from "@/lib/services/mock/imageUrls";
import {
    recentSearches as initialRecent,
    searchPlaceholder,
    searchSpotlightProducts,
    shopByCategoryIcons,
    shopByOccasion,
    shopByOccasionFallback,
    shopByRelationship,
    trendingSearches,
    type OccasionCardItem,
} from "@/lib/services/mock/search";
import type { CatalogProduct } from "@/lib/services/productCatalog";
import {
    snapshotFromListingFields,
    snapshotFromSpotlight,
} from "@/lib/services/mock/wishlist";
import {
    catalogProductToSearchable,
    formatCategoryLabel,
} from "@/lib/services/searchCatalog";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { BottomTabBar } from "@/src/components/navigation/BottomTabBar";
import { fontSizes, spacing } from "@/src/constants/theme";

const SCREEN_W = Dimensions.get("window").width;

const H_PADDING = 20;
const PRODUCT_CARD_W = Math.min(200, (SCREEN_W - H_PADDING * 2) * 0.56);

/** Occasion banners run almost full-width to feel premium */
const OCCASION_CARD_W = SCREEN_W - H_PADDING * 2;
const OCCASION_CARD_H = 200;

/** Cap the recent-searches memory (matches Amazon-style chip rail). */
const MAX_RECENT = 5;

/** Last-resort fallback to guarantee non-empty section */
const DEFAULT_SEARCH_OCCASIONS: OccasionCardItem[] = [
  {
    id: "occ-fb-1",
    title: "Wedding",
    imageUri:
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=85&auto=format&fit=crop",
    categoryParam: "Wedding",
  },
  {
    id: "occ-fb-2",
    title: "Anniversary",
    imageUri:
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1200&q=85&auto=format&fit=crop",
    categoryParam: "Anniversary",
  },
  {
    id: "occ-fb-3",
    title: "Engagement",
    imageUri:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=85&auto=format&fit=crop",
    categoryParam: "Engagement",
  },
  {
    id: "occ-fb-4",
    title: "Festive",
    imageUri:
      "https://images.unsplash.com/photo-1627293509201-cd0c780043d3?w=1200&q=85&auto=format&fit=crop",
    categoryParam: "Festive",
  },
];

const OCCASION_SUBTITLES: Record<string, string> = {
  Wedding: "Timeless pieces for the big day",
  Anniversary: "Celebrate love that endures",
  Engagement: "Say yes in sparkle",
  Festive: "Radiance for every ritual",
};

const RELATIONSHIP_IMAGES: Record<string, string> = {
  r1: categoryImageUri("NECKLACES"),
  r2: categoryImageUri("RINGS"),
  r3: categoryImageUri("EARRINGS"),
};

function toListingCardItem(p: CatalogProduct): ListingProductCardItem {
  const priceLabel =
    Number.isFinite(p.price) && p.price > 0
      ? `₹ ${p.price.toLocaleString("en-IN")}`
      : "Price on request";
  return {
    id: p.id,
    name: p.name,
    price: priceLabel,
    imageUri: p.imageUri,
    imageTint: p.imageTint,
    boutiqueName: p.boutiqueName,
    boutiqueRating: p.boutiqueRating,
    boutiqueVerified: p.boutiqueVerified,
    /** Category label retained as a fallback if a product is unlinked. */
    tag: formatCategoryLabel(p.category).toUpperCase(),
  };
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>(() => [...initialRecent]);
  const wishIds = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const { results, loading: searchLoading } = useProductSearch(query);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const showEmptyState = isSearching && !searchLoading && results.length === 0;

  const shopOccasionItems = useMemo((): OccasionCardItem[] => {
    const primary =
      shopByOccasion.length > 0 ? shopByOccasion : shopByOccasionFallback;
    return primary.length > 0 ? primary : DEFAULT_SEARCH_OCCASIONS;
  }, []);

  const addRecentSearch = useCallback((text: string) => {
    const label = text.trim();
    if (!label) return;
    setRecent((prev) =>
      [label, ...prev.filter((i) => i !== label)].slice(0, MAX_RECENT),
    );
  }, []);

  const openCategoryProducts = useCallback(
    (category: string) => {
      router.push({
        pathname: "/(app)/category-products",
        params: { category },
      });
    },
    [router],
  );

  const openProduct = useCallback(
    (id: string, trackedQuery?: string) => {
      if (trackedQuery) addRecentSearch(trackedQuery);
      pushProductDetails(router, id);
    },
    [addRecentSearch, router],
  );

  const openOccasionProducts = useCallback(
    (occasion: string) => {
      router.push({
        pathname: "/(app)/occasion-products",
        params: { occasion },
      });
    },
    [router],
  );

  const onRecentChipPress = useCallback((label: string) => {
    setQuery(label);
  }, []);

  const onTrendingChipPress = useCallback((label: string) => {
    setQuery(label);
  }, []);

  const removeRecent = useCallback((label: string) => {
    setRecent((prev) => prev.filter((x) => x !== label));
  }, []);

  const renderResultItem = useCallback(
    ({ item }: { item: CatalogProduct }) => {
      const cardItem = toListingCardItem(item);
      return (
        <ListingProductCard
          item={cardItem}
          onPress={() => openProduct(item.id, trimmedQuery)}
          isWishlisted={wishIds.includes(item.id)}
          onWishlistPress={() =>
            void toggleWishlist(
              item.id,
              snapshotFromListingFields({
                id: cardItem.id,
                name: cardItem.name,
                priceLabel: cardItem.price,
                imageUri: cardItem.imageUri,
                imageTint: cardItem.imageTint,
                boutiqueName: cardItem.boutiqueName,
                boutiqueRating: cardItem.boutiqueRating,
                boutiqueVerified: cardItem.boutiqueVerified,
              }),
            )
          }
        />
      );
    },
    [openProduct, toggleWishlist, trimmedQuery, wishIds],
  );

  const resultsHeader = useMemo(() => {
    if (!isSearching) return null;
    const countLabel =
      results.length === 1 ? "1 result" : `${results.length} results`;
    return (
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{countLabel}</Text>
        <Text style={styles.resultsFor} numberOfLines={1}>
          for &ldquo;{trimmedQuery}&rdquo;
        </Text>
      </View>
    );
  }, [isSearching, results.length, trimmedQuery]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.headerIcon}
          >
            <MaterialIcons name="arrow-back" size={22} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Discover</Text>
          <View style={styles.headerIcon} />
        </View>

        {/* Unified search bar — same UI as Home */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder || "Search jewellery, designs..."}
            autoFocus
            onVoicePress={() => {
              /* voice search placeholder */
            }}
            onSubmitEditing={() => {
              if (trimmedQuery) addRecentSearch(trimmedQuery);
            }}
          />
        </View>

        {isSearching ? (
          searchLoading && results.length === 0 ? (
            <View style={styles.resultsListContent}>
              <View style={styles.searchLoadingRow}>
                <ActivityIndicator size="small" color="#0B1C2C" />
                <Text style={styles.searchLoadingText}>
                  Looking through the latest catalog...
                </Text>
              </View>
              <ProductSkeletonLoader count={4} />
            </View>
          ) : showEmptyState ? (
            <ScrollView
              contentContainerStyle={styles.emptyStateScroll}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="search-off" size={32} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptySubtitle}>
                We couldn&apos;t find anything for &ldquo;{trimmedQuery}&rdquo;.
                Try a different keyword or explore trending below.
              </Text>
              <View style={styles.emptyChipsRow}>
                {trendingSearches.map((item) => (
                  <View key={item.id} style={styles.chipSpacer}>
                    <SearchItem
                      variant="trending"
                      item={item}
                      onPress={() => onTrendingChipPress(item.label)}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderResultItem}
              numColumns={2}
              columnWrapperStyle={styles.resultsColumnWrap}
              contentContainerStyle={styles.resultsListContent}
              ListHeaderComponent={resultsHeader}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            />
          )
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
            nestedScrollEnabled
          >
            {recent.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Recent" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsHScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {recent.map((label) => (
                    <View key={label} style={styles.chipSpacer}>
                      <SearchItem
                        variant="recent"
                        label={label}
                        onPress={() => onRecentChipPress(label)}
                        onRemove={() => removeRecent(label)}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeader title="Trending" accent />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsHScroll}
                keyboardShouldPersistTaps="handled"
              >
                {trendingSearches.map((item) => (
                  <View key={item.id} style={styles.chipSpacer}>
                    <SearchItem
                      variant="trending"
                      item={item}
                      onPress={() => onTrendingChipPress(item.label)}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Product right now"
                actionLabel="View all"
                onActionPress={() => router.push("/trending")}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
              >
                {searchSpotlightProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    cardWidth={PRODUCT_CARD_W}
                    onPress={() => openProduct(p.id)}
                    isWishlisted={wishIds.includes(p.id)}
                    onWishlistPress={() =>
                      void toggleWishlist(p.id, snapshotFromSpotlight(p))
                    }
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Shop by category" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryHScroll}
              >
                {shopByCategoryIcons.map((item) => (
                  <View key={item.id} style={styles.categoryItem}>
                    <CategoryCard
                      item={item}
                      size={72}
                      onPress={() => openCategoryProducts(item.categoryParam)}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Shop by occasion" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={OCCASION_CARD_W + spacing.md}
                snapToAlignment="start"
                contentContainerStyle={styles.occasionHScroll}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {shopOccasionItems.map((item) => (
                  <View key={item.id} style={styles.occasionCardShadowWrap}>
                    <PressScale
                      onPress={() => openOccasionProducts(item.title)}
                      style={styles.occasionCardClip}
                      accessibilityRole="button"
                      accessibilityLabel={`Shop ${item.title}`}
                    >
                      <RemoteImage
                        uri={item.imageUri}
                        fallbackTint="#1f2937"
                        style={styles.occasionImg}
                      />
                      <LinearGradient
                        colors={[
                          "rgba(0,0,0,0)",
                          "rgba(0,0,0,0.15)",
                          "rgba(0,0,0,0.78)",
                        ]}
                        locations={[0, 0.45, 1]}
                        style={styles.occasionScrim}
                        pointerEvents="none"
                      />
                      <View
                        style={styles.occasionLabelWrap}
                        pointerEvents="none"
                      >
                        <Text style={styles.occasionSubLabel}>
                          {OCCASION_SUBTITLES[item.title] ?? "Explore the edit"}
                        </Text>
                        <Text style={styles.occasionCardText}>
                          {item.title}
                        </Text>
                        <View style={styles.occasionCtaRow}>
                          <Text style={styles.occasionCtaText}>SHOP NOW</Text>
                          <MaterialIcons
                            name="arrow-forward"
                            size={14}
                            color="#fff"
                          />
                        </View>
                      </View>
                    </PressScale>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionRel}>
              <View style={styles.sectionHeaderPad}>
                <SectionHeader title="Shop by relationship" noPad />
              </View>

              <View style={styles.relRow}>
                {shopByRelationship.map((item) => (
                  <View key={item.id} style={styles.relThird}>
                    <PressScale
                      onPress={() => openCategoryProducts(item.categoryParam)}
                      style={styles.relThirdPress}
                    >
                      <RemoteImage
                        uri={RELATIONSHIP_IMAGES[item.id]}
                        fallbackTint="#374151"
                        style={styles.relCardBg}
                      />
                      <LinearGradient
                        colors={[
                          "rgba(0,0,0,0)",
                          "rgba(0,0,0,0.25)",
                          "rgba(0,0,0,0.75)",
                        ]}
                        locations={[0.35, 0.65, 1]}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                      />
                      <View style={styles.relThirdLabel} pointerEvents="none">
                        <Text style={styles.relThirdTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.relThirdSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </PressScale>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      <BottomTabBar />
    </SafeAreaView>
  );
}

/* ------------------------------ Section header ----------------------------- */

type SectionHeaderProps = {
  title: string;
  accent?: boolean;
  actionLabel?: string;
  onActionPress?: () => void;
  noPad?: boolean;
};

function SectionHeader({
  title,
  accent,
  actionLabel,
  onActionPress,
  noPad,
}: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, noPad && { paddingHorizontal: 0 }]}>
      <Text style={[styles.sectionTitle, accent && styles.sectionTitleAccent]}>
        {title}
      </Text>
      {actionLabel ? (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={styles.viewAll}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------------------------------- Styles --------------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  keyboard: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#fff",
  },
  headerIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },
  searchWrap: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  scroll: {
    paddingBottom: 120,
    backgroundColor: "#fafafa",
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionRel: {
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  sectionHeaderPad: {
    paddingHorizontal: H_PADDING,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.3,
  },
  sectionTitleAccent: {
    color: "#b8860b",
  },
  viewAll: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.6,
  },
  chipsHScroll: {
    paddingHorizontal: H_PADDING,
    paddingRight: H_PADDING + 4,
  },
  chipSpacer: {
    marginRight: 8,
  },
  hScroll: {
    paddingHorizontal: H_PADDING,
    paddingBottom: spacing.sm,
    paddingTop: 4,
  },
  categoryHScroll: {
    paddingHorizontal: H_PADDING,
    paddingBottom: spacing.xs,
    paddingTop: 4,
    gap: spacing.xl,
  },
  categoryItem: {},
  occasionHScroll: {
    paddingHorizontal: H_PADDING,
    paddingBottom: spacing.sm,
    paddingTop: 4,
  },
  occasionCardShadowWrap: {
    width: OCCASION_CARD_W,
    height: OCCASION_CARD_H,
    marginRight: spacing.md,
    borderRadius: 22,
    backgroundColor: "#e5e7eb",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  occasionCardClip: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    overflow: "hidden",
  },
  occasionImg: {
    width: "100%",
    height: "100%",
  },
  occasionScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  occasionLabelWrap: {
    position: "absolute",
    bottom: 18,
    left: 20,
    right: 20,
  },
  occasionSubLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  occasionCardText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
  },
  occasionCtaRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  occasionCtaText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  relRow: {
    flexDirection: "row",
    width: "100%",
  },
  relThird: {
    width: "33.3333%",
    height: 170,
    overflow: "hidden",
  },
  relThirdPress: {
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  relCardBg: { ...StyleSheet.absoluteFillObject },
  relThirdLabel: {
    position: "absolute",
    bottom: 14,
    left: 12,
    right: 12,
  },
  relThirdTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    letterSpacing: 0.2,
  },
  relThirdSubtitle: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.85)",
  },

  /* ----- Results grid ----- */
  resultsListContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  resultsColumnWrap: {
    justifyContent: "space-between",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.md,
    gap: 6,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
  },
  resultsFor: {
    flex: 1,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },

  /* ----- Empty state ----- */
  emptyStateScroll: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing["2xl"],
    paddingBottom: 120,
    alignItems: "center",
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  emptyChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  searchLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.md,
  },
  searchLoadingText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
});
