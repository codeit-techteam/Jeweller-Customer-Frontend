import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
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
import Animated, { FadeIn } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProductSkeletonLoader } from "@/components/loaders";
import { useAuth } from "@/context/AuthContext";
import { useProductSearch } from "@/hooks/useProductCatalog";
import { pushCollection } from "@/lib/navigation/collectionNavigation";
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
import {
    fetchCategoriesUi,
    fetchCollectionsUi,
    fetchOccasionsUi,
    fetchRelationshipSectionsUi,
    fetchTrendingCollectionChipsUi,
    fetchTrendingProductsUi,
} from "@/lib/services/catalogApi";
import { SEARCH_ROTATING_PLACEHOLDERS } from "@/lib/constants/searchRotatingPlaceholders";
import {
    buildSearchSuggestions,
    type SearchSuggestion,
    type SearchSuggestionKind,
} from "@/lib/services/buildSearchSuggestions";
import { categoryImageUri } from "@/lib/services/mock/imageUrls";
import {
    searchPlaceholder,
    trendingSearches,
    type CategoryIconItem,
    type OccasionCardItem,
    type TrendingSearchChip,
    type SearchSpotlightProduct,
} from "@/lib/services/mock/search";
import type { CatalogProduct } from "@/lib/services/productCatalog";
import {
    snapshotFromListingFields,
    snapshotFromSpotlight,
} from "@/lib/services/mock/wishlist";
import {
    formatCategoryLabel,
} from "@/lib/services/searchCatalog";
import {
    addSearchHistory,
    getSearchHistory,
    removeSearchHistoryEntry,
} from "@/services/api";
import { normalizeSearchKeyword } from "@/lib/utils/normalizeSearchKeyword";
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
const MAX_RECENT = 8;
const RECENT_LOCAL_KEY = "discover_recent_searches_v1";
/** Do not record very short partial queries as completed searches. */
const MIN_RECENT_KEYWORD_LEN = 3;

const OCCASION_SUBTITLES: Record<string, string> = {
  Wedding: "Timeless pieces for the big day",
  Anniversary: "Celebrate love that endures",
  Engagement: "Say yes in sparkle",
  Festive: "Radiance for every ritual",
};

type OccasionNavCard = OccasionCardItem & {
  collectionSlug: string;
  lineSubtitle: string;
};

type RelationshipNavCard = {
  id: string;
  title: string;
  subtitle: string;
  imageUri: string;
  collectionSlug: string | null;
  productIds: string[];
};

type RecentSearchEntry = {
  id?: string;
  keyword: string;
};

function suggestionMaterialIcon(
  kind: SearchSuggestionKind,
): React.ComponentProps<typeof MaterialIcons>["name"] {
  switch (kind) {
    case "product":
      return "local-mall";
    case "category":
      return "category";
    case "occasion":
      return "event";
    case "collection":
      return "layers";
    case "trending_chip":
      return "trending-up";
    case "relationship_section":
      return "favorite-border";
    default:
      return "search";
  }
}

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
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentSearchEntry[]>([]);
  const [trendingChips, setTrendingChips] = useState<TrendingSearchChip[]>([]);
  const wishIds = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);

  const {
    results,
    loading: searchLoading,
    debouncedQuery,
    isDebouncing,
  } = useProductSearch(query);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;
  const showEmptyState = isSearching && !searchLoading && results.length === 0;

  const [spotlightProducts, setSpotlightProducts] = useState<
    SearchSpotlightProduct[]
  >([]);
  const [occasionCards, setOccasionCards] = useState<OccasionNavCard[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<CategoryIconItem[]>([]);
  const [relationshipCards, setRelationshipCards] = useState<
    RelationshipNavCard[]
  >([]);
  const [collectionsList, setCollectionsList] = useState<
    { id: string; title: string; slug: string }[]
  >([]);

  const loadRecents = useCallback(async () => {
    if (userId) {
      try {
        const rows = await getSearchHistory(userId);
        setRecent(
          rows
            .map((row) => ({
              id: row.id,
              keyword: normalizeSearchKeyword(row.keyword),
            }))
            .filter((e) => e.keyword.length >= MIN_RECENT_KEYWORD_LEN),
        );
        return;
      } catch {
        /* fall through to local */
      }
    }
    try {
      const raw = await AsyncStorage.getItem(RECENT_LOCAL_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      if (Array.isArray(parsed)) {
        const keywords = parsed
          .map((entry) =>
            typeof entry === "string"
              ? normalizeSearchKeyword(entry)
              : entry &&
                  typeof entry === "object" &&
                  "keyword" in entry &&
                  typeof (entry as { keyword?: unknown }).keyword === "string"
                ? normalizeSearchKeyword(
                    (entry as { keyword: string }).keyword,
                  )
                : "",
          )
          .filter((k) => k.length >= MIN_RECENT_KEYWORD_LEN);
        const deduped: RecentSearchEntry[] = [];
        const seen = new Set<string>();
        for (const raw of keywords) {
          const keyword = normalizeSearchKeyword(raw);
          if (keyword.length < MIN_RECENT_KEYWORD_LEN) continue;
          const k = keyword.toLowerCase();
          if (seen.has(k)) continue;
          seen.add(k);
          deduped.push({ keyword });
          if (deduped.length >= MAX_RECENT) break;
        }
        setRecent(deduped);
        return;
      }
    } catch {
      /* ignore */
    }
    setRecent([]);
  }, [userId]);

  const persistLocalRecents = useCallback(async (entries: RecentSearchEntry[]) => {
    try {
      await AsyncStorage.setItem(
        RECENT_LOCAL_KEY,
        JSON.stringify(entries.map((e) => e.keyword)),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const loadDiscoverContent = useCallback(async () => {
    const [
      spotRes,
      occRes,
      catRes,
      relRes,
      chipRes,
      colRes,
    ] = await Promise.allSettled([
      fetchTrendingProductsUi(),
      fetchOccasionsUi(),
      fetchCategoriesUi(),
      fetchRelationshipSectionsUi(),
      fetchTrendingCollectionChipsUi(),
      fetchCollectionsUi(),
    ]);

    if (spotRes.status === "fulfilled") {
      setSpotlightProducts(
        spotRes.value.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          price: row.price,
          imageUri: row.imageUri ?? "",
          imageTint: row.imageTint,
        })),
      );
    } else {
      setSpotlightProducts([]);
    }

    if (occRes.status === "fulfilled") {
      setOccasionCards(
        occRes.value.map((row) => {
          const slug = row.collectionSlug.trim();
          return {
            id: row.id,
            title: row.title,
            imageUri:
              row.image?.trim() ||
              categoryImageUri(row.title.toUpperCase()),
            categoryParam: slug,
            collectionSlug: slug,
            lineSubtitle:
              row.subtitle?.trim() ||
              OCCASION_SUBTITLES[row.title] ||
              "Explore the edit",
          };
        }),
      );
    } else {
      setOccasionCards([]);
    }

    if (catRes.status === "fulfilled") {
      setCategoryIcons(
        catRes.value.map((row) => ({
          id: row.id,
          label: row.name,
          categoryParam: row.name,
          imageUri:
            row.image?.trim() ||
            categoryImageUri(row.name.toUpperCase()),
        })),
      );
    } else {
      setCategoryIcons([]);
    }

    if (relRes.status === "fulfilled") {
      setRelationshipCards(
        relRes.value.map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle?.trim() || "Curated picks",
          imageUri:
            row.image?.trim() ||
            categoryImageUri(row.title.toUpperCase()),
          collectionSlug: row.collectionSlug,
          productIds: row.productIds,
        })),
      );
    } else {
      setRelationshipCards([]);
    }

    if (chipRes.status === "fulfilled") {
      setTrendingChips(chipRes.value);
    } else {
      setTrendingChips([]);
    }

    if (colRes.status === "fulfilled") {
      setCollectionsList(
        colRes.value.map((row) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
        })),
      );
    } else {
      setCollectionsList([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        await loadDiscoverContent();
        if (!cancelled) await loadRecents();
      })();
      return () => {
        cancelled = true;
      };
    }, [loadDiscoverContent, loadRecents]),
  );

  const addRecentSearch = useCallback(
    async (text: string) => {
      const label = normalizeSearchKeyword(text);
      if (!label || label.length < MIN_RECENT_KEYWORD_LEN) return;
      const lower = label.toLowerCase();
      setRecent((prev) => {
        const next = [
          { keyword: label },
          ...prev.filter((e) => e.keyword.toLowerCase() !== lower),
        ].slice(0, MAX_RECENT);
        void persistLocalRecents(next);
        return next;
      });
      if (userId) {
        try {
          const rows = await addSearchHistory(label, userId);
          setRecent(
            rows.map((row) => ({
              id: row.id,
              keyword: normalizeSearchKeyword(row.keyword),
            })),
          );
        } catch {
          /* local recents already updated */
        }
      }
    },
    [persistLocalRecents, userId],
  );

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
      if (trackedQuery) void addRecentSearch(trackedQuery);
      pushProductDetails(router, id);
    },
    [addRecentSearch, router],
  );

  const openMarketingSlug = useCallback(
    (collectionSlug: string) => {
      const key = collectionSlug.trim().toLowerCase();
      if (!key) return;
      pushCollection(router, key);
    },
    [router],
  );

  const openRelationshipCard = useCallback(
    (card: RelationshipNavCard) => {
      if (card.productIds.length > 0) {
        router.push({
          pathname: "/(app)/category-products",
          params: {
            relationshipSectionId: card.id,
            title: card.title,
            category: "ALL",
          },
        });
        return;
      }
      if (card.collectionSlug?.trim()) {
        openMarketingSlug(card.collectionSlug);
      }
    },
    [openMarketingSlug, router],
  );

  const onRecentChipPress = useCallback((keyword: string) => {
    setQuery(keyword);
  }, []);

  const onTrendingChipPress = useCallback((label: string) => {
    setQuery(label);
  }, []);

  const removeRecent = useCallback(
    async (entry: RecentSearchEntry) => {
      if (entry.id && userId) {
        try {
          await removeSearchHistoryEntry(entry.id, userId);
        } catch {
          /* still update UI */
        }
      }
      setRecent((prev) => {
        const next = prev.filter(
          (x) =>
            !(
              (entry.id && x.id === entry.id) ||
              x.keyword.toLowerCase() === entry.keyword.toLowerCase()
            ),
        );
        void persistLocalRecents(next);
        return next;
      });
    },
    [persistLocalRecents, userId],
  );

  const commitSearchToRecents = useCallback(() => {
    void addRecentSearch(trimmedQuery);
  }, [addRecentSearch, trimmedQuery]);

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

  const trendingChipItems = useMemo(
    () => (trendingChips.length ? trendingChips : trendingSearches),
    [trendingChips],
  );

  const debouncedTrim = debouncedQuery.trim();

  const suggestions = useMemo(
    () =>
      buildSearchSuggestions({
        q: trimmedQuery,
        debouncedQ: debouncedTrim,
        categories: categoryIcons.map((c) => ({
          id: c.id,
          label: c.label,
          categoryParam: c.categoryParam,
        })),
        occasions: occasionCards.map((o) => ({
          id: o.id,
          title: o.title,
          collectionSlug: o.collectionSlug,
        })),
        relationships: relationshipCards.map((r) => ({
          id: r.id,
          title: r.title,
        })),
        collections: collectionsList,
        chips: trendingChipItems.map((t) => ({ id: t.id, label: t.label })),
        productHits: results,
      }),
    [
      trimmedQuery,
      debouncedTrim,
      categoryIcons,
      occasionCards,
      relationshipCards,
      collectionsList,
      trendingChipItems,
      results,
    ],
  );

  const onSuggestionPress = useCallback(
    (s: SearchSuggestion) => {
      switch (s.kind) {
        case "product":
          if (s.productId) openProduct(s.productId, trimmedQuery);
          break;
        case "category":
          if (s.categoryParam) openCategoryProducts(s.categoryParam);
          break;
        case "occasion":
        case "collection":
          if (s.collectionSlug) openMarketingSlug(s.collectionSlug);
          break;
        case "trending_chip":
          if (s.chipLabel) setQuery(s.chipLabel);
          break;
        case "relationship_section": {
          const card = relationshipCards.find(
            (r) => r.id === s.relationshipSectionId,
          );
          if (card) openRelationshipCard(card);
          break;
        }
      }
    },
    [
      trimmedQuery,
      openProduct,
      openCategoryProducts,
      openMarketingSlug,
      relationshipCards,
      openRelationshipCard,
    ],
  );

  const renderSuggestionRow = useCallback(
    ({ item }: { item: SearchSuggestion }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.label}, ${item.subtitle ?? "suggestion"}`}
        onPress={() => onSuggestionPress(item)}
        style={({ pressed }) => [
          styles.suggestionRow,
          pressed && styles.suggestionRowPressed,
        ]}
      >
        <MaterialIcons
          name={suggestionMaterialIcon(item.kind)}
          size={18}
          color="#64748b"
        />
        <View style={styles.suggestionTextCol}>
          <Text style={styles.suggestionTitle} numberOfLines={1}>
            {item.label}
          </Text>
          {item.subtitle ? (
            <Text style={styles.suggestionMeta}>{item.subtitle}</Text>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={18} color="#cbd5e1" />
      </Pressable>
    ),
    [onSuggestionPress],
  );

  const resultsHeader = useMemo(() => {
    if (!isSearching) return null;
    const countLabel =
      results.length === 1 ? "1 result" : `${results.length} results`;
    return (
      <View style={styles.resultsHeaderOuter}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{countLabel}</Text>
          <Text style={styles.resultsFor} numberOfLines={1}>
            for &ldquo;{trimmedQuery}&rdquo;
          </Text>
        </View>
        {isDebouncing ? (
          <Text style={styles.debounceHint}>Updating…</Text>
        ) : null}
      </View>
    );
  }, [isSearching, results.length, trimmedQuery, isDebouncing]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 6 : 0}
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
            rotatingPlaceholders={SEARCH_ROTATING_PLACEHOLDERS}
            autoFocus
            onSubmitEditing={commitSearchToRecents}
            onVoicePress={() => {
              /* voice search placeholder */
            }}
          />
        </View>

        {isSearching ? (
          <View style={styles.searchBody}>
            {suggestions.length > 0 ? (
              <View style={styles.suggestionsWrap}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.key}
                  renderItem={renderSuggestionRow}
                  keyboardShouldPersistTaps="handled"
                  style={styles.suggestionsList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                />
              </View>
            ) : null}
            {searchLoading && results.length === 0 ? (
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
              style={styles.searchScrollFill}
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
                {trendingChipItems.map((item) => (
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
              style={styles.searchScrollFill}
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
          )}
          </View>
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
                  {recent.map((entry, index) => (
                    <Animated.View
                      key={entry.id ?? entry.keyword}
                      entering={FadeIn.duration(260).delay(
                        Math.min(index * 36, 180),
                      )}
                      style={styles.chipSpacer}
                    >
                      <SearchItem
                        variant="recent"
                        label={entry.keyword}
                        onPress={() => onRecentChipPress(entry.keyword)}
                        onRemove={() => void removeRecent(entry)}
                      />
                    </Animated.View>
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
                {trendingChipItems.map((item) => (
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

            {spotlightProducts.length > 0 ? (
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
                  {spotlightProducts.map((p) => (
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
            ) : null}

            {categoryIcons.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Shop by category" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryHScroll}
                >
                  {categoryIcons.map((item) => (
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
            ) : null}

            {occasionCards.length > 0 ? (
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
                  {occasionCards.map((item) => (
                    <View key={item.id} style={styles.occasionCardShadowWrap}>
                      <PressScale
                        onPress={() => openMarketingSlug(item.collectionSlug)}
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
                            {item.lineSubtitle}
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
            ) : null}

            {relationshipCards.length > 0 ? (
              <View style={styles.sectionRel}>
                <View style={styles.sectionHeaderPad}>
                  <SectionHeader title="Shop by relationship" noPad />
                </View>

                <View style={styles.relRow}>
                  {relationshipCards.map((item) => (
                    <View key={item.id} style={styles.relThird}>
                      <PressScale
                        onPress={() => openRelationshipCard(item)}
                        style={styles.relThirdPress}
                      >
                        <RemoteImage
                          uri={item.imageUri}
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
            ) : null}
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
  searchBody: {
    flex: 1,
    minHeight: 0,
  },
  searchScrollFill: {
    flex: 1,
  },
  suggestionsWrap: {
    maxHeight: 200,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: H_PADDING,
    gap: 10,
    backgroundColor: "#fff",
  },
  suggestionRowPressed: {
    backgroundColor: "#f9fafb",
  },
  suggestionTextCol: {
    flex: 1,
    minWidth: 0,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  suggestionMeta: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    letterSpacing: 0.3,
  },
  debounceHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
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
  resultsHeaderOuter: {
    marginBottom: spacing.md,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "baseline",
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
  resultsListContent: {
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  resultsColumnWrap: {
    justifyContent: "space-between",
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
