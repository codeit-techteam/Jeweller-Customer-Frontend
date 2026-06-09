import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    ImageBackground,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    BoutiqueSkeletonLoader,
    CategorySkeletonLoader,
    ProductSkeletonLoader,
} from "@/components/loaders";
import { ShimmerBlock } from "@/components/loaders/ShimmerBlock";
import { useNetworkReachable } from "@/hooks/useNetworkReachable";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useDiscoveryLocation } from "@/hooks/useDiscoveryLocation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import {
    boutiqueHasCoordinates,
    formatBoutiqueDistanceLine,
} from "@/lib/utils/formatBoutiqueDistance";
import {
    ListingProductCard,
    type ListingProductCardItem,
} from "@/lib/components/common/ListingProductCard";
import { RemoteImage } from "@/lib/components/common/RemoteImage";
import { SearchBar } from "@/lib/components/common/SearchBar";
import { VoiceSearchModal } from "@/lib/components/common/VoiceSearchModal";
import { SEARCH_ROTATING_PLACEHOLDERS } from "@/lib/constants/searchRotatingPlaceholders";
import { WishlistNavIcon } from "@/lib/components/common/WishlistNavIcon";
import { FeaturedBoutiqueCard } from "@/lib/components/home/FeaturedBoutiqueCard";
import { WhyChooseGehnaHubSection } from "@/lib/components/home/WhyChooseGehnaHub";
import { lazyNamedScreen } from "@/lib/utils/lazyScreen";
import { FLAT_LIST_HORIZONTAL_PROPS, FLAT_LIST_WINDOWED_PROPS } from "@/lib/constants/flatListPerformance";

const FeaturedSectionRail = lazyNamedScreen(
  () => import("@/lib/components/home/FeaturedSectionRail"),
  "FeaturedSectionRail",
);
import { pushCollection } from "@/lib/navigation/collectionNavigation";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import {
    fetchBoutiquesUi,
    fetchFeaturedBoutiquesUi,
    fetchCategoriesUi,
    fetchCollectionsUi,
    fetchFeaturedSectionsUi,
    fetchOccasionsUi,
    fetchTrendingProductsUi,
    type FeaturedSectionUi,
} from "@/lib/services/catalogApi";
import {
    HERO_JEWELLERY_URI,
    PLACEHOLDER_IMAGE_URI,
} from "@/lib/services/mock/imageUrls";
import { snapshotFromListingFields } from "@/lib/services/mock/wishlist";
import { NotificationBadge } from "@/lib/components/common/NotificationBadge";
import { useNotificationsStore } from "@/lib/stores/notificationsStore";
import { useWishlistIds, useWishlistStore } from "@/lib/stores/wishlistStore";
import { ApiError } from "@/services/api";
import { applyUserLocationToBoutiqueList, type UserCoords } from "@/services/boutique.service";
import { BottomTabBar } from "@/src/components/navigation/BottomTabBar";
import { colors, fontSizes, radius, spacing } from "@/src/constants/theme";

type Boutique = Awaited<ReturnType<typeof fetchBoutiquesUi>>[number];
type TrendingProduct = Awaited<
  ReturnType<typeof fetchTrendingProductsUi>
>[number];

function toHomeTrendingListing(item: TrendingProduct): ListingProductCardItem {
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

function SectionTitle({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onPress} disabled={!onPress}>
        <Text style={styles.viewAll}>VIEW ALL</Text>
      </Pressable>
    </View>
  );
}

function HomeContent({ onVoicePress }: { onVoicePress?: () => void }) {
  const requireAuth = useAuthGuard();
  const [homeCategoryPreview, setHomeCategoryPreview] = useState<string[]>([]);
  const [homeCategoryImageByName, setHomeCategoryImageByName] = useState<
    Record<string, string>
  >({});
  const [homeTrendingPreview, setHomeTrendingPreview] = useState<
    TrendingProduct[]
  >([]);
  const [rawBoutiques, setRawBoutiques] = useState<Boutique[]>([]);
  const [featuredBoutiques, setFeaturedBoutiques] = useState<Boutique[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const featuredLoadedRef = useRef(false);
  const featuredFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [occasionData, setOccasionData] = useState<
    Array<{
      id: string;
      title: string;
      subtitle: string;
      image: string | null;
      collectionSlug: string;
    }>
  >([]);
  const [collectionsData, setCollectionsData] = useState<
    Array<{ id: string; title: string; slug: string }>
  >([]);
  const [featuredSections, setFeaturedSections] = useState<
    FeaturedSectionUi[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reachable = useNetworkReachable();
  const { effectiveCoords: userCoords } = useDiscoveryLocation();
  const {
    coords: gpsCoords,
    loading: locationLoading,
    permission: locationPermission,
    permissionDenied,
    gpsFailed: locationGpsFailed,
  } = useUserLocation(true);

  const boutiquesData = useMemo(
    () => applyUserLocationToBoutiqueList(rawBoutiques, gpsCoords ?? userCoords),
    [rawBoutiques, gpsCoords, userCoords],
  );
  const featuredBoutiquesData = useMemo(
    () => applyUserLocationToBoutiqueList(featuredBoutiques, gpsCoords ?? userCoords),
    [featuredBoutiques, gpsCoords, userCoords],
  );
  const showLocationBanner = permissionDenied;
  const router = useRouter();
  const wishIds = useWishlistIds();
  const wishlistCount = useWishlistStore((s) => s.count);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const unreadNotificationsCount = useNotificationsStore((s) => s.unreadCount);
  const openWishlist = useCallback(
    () => router.push("/(app)/wishlist"),
    [router],
  );
  const { width: winW } = useWindowDimensions();
  /** Scroll content uses paddingHorizontal: 16; four columns with sm gaps between. */
  const categoryColW = useMemo(
    () => Math.max(64, (winW - 32 - spacing.sm * 3) / 4),
    [winW],
  );
  /** Horizontal card width (scroll rail). */
  const occasionHCardW = useMemo(
    () => Math.min(280, Math.max(200, Math.round(winW * 0.58))),
    [winW],
  );
  const loadFeaturedBoutiques = useCallback(async (coords: UserCoords | null) => {
    setFeaturedLoading(true);
    try {
      const rows = await fetchFeaturedBoutiquesUi(coords, 10, coords ? 50 : undefined);
      setFeaturedBoutiques(rows);
      featuredLoadedRef.current = true;
      if (__DEV__) {
        console.log("[Featured] Home state updated, count:", rows.length);
      }
    } catch (error) {
      console.error("[Featured] Fetch error:", error);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  useEffect(() => {
    featuredFallbackTimerRef.current = setTimeout(() => {
      if (!featuredLoadedRef.current) {
        if (__DEV__) {
          console.log("[Featured] 3s fallback — fetching without location");
        }
        void loadFeaturedBoutiques(null);
      }
    }, 3000);
    return () => {
      if (featuredFallbackTimerRef.current) {
        clearTimeout(featuredFallbackTimerRef.current);
      }
    };
  }, [loadFeaturedBoutiques]);

  useEffect(() => {
    if (locationLoading) return;
    if (featuredFallbackTimerRef.current) {
      clearTimeout(featuredFallbackTimerRef.current);
      featuredFallbackTimerRef.current = null;
    }
    void loadFeaturedBoutiques(gpsCoords);
  }, [gpsCoords?.lat, gpsCoords?.lng, locationLoading, loadFeaturedBoutiques]);

  const loadHomeData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setErrorMessage(null);
    }
    try {
      const [
        categories,
        boutiques,
        trending,
        occasions,
        trendingCollections,
        featured,
      ] = await Promise.all([
        fetchCategoriesUi(),
        fetchBoutiquesUi(),
        fetchTrendingProductsUi(),
        fetchOccasionsUi(),
        fetchCollectionsUi({ trending: true }),
        fetchFeaturedSectionsUi(),
      ]);
      // Fall back to all active collections when no rows are flagged trending yet
      const collections =
        trendingCollections.length > 0
          ? trendingCollections
          : await fetchCollectionsUi();
      setHomeCategoryPreview(categories.slice(0, 4).map((item) => item.name));
      setHomeCategoryImageByName(
        Object.fromEntries(
          categories.map((item) => [item.name, item.image ?? ""]),
        ),
      );
      setRawBoutiques(boutiques);
      setHomeTrendingPreview(trending.slice(0, 4));
      setOccasionData(occasions);
      setCollectionsData(
        collections.map((item) => ({
          id: item.id,
          title: item.title,
          slug: item.slug,
        })),
      );
      setFeaturedSections(
        featured.filter(
          (section) =>
            section.products.length > 0 &&
            section.slug?.trim().toLowerCase() !== "trending-now",
        ),
      );
      setErrorMessage(null);
    } catch (error) {
      if (!silent) {
        const message =
          error instanceof ApiError
            ? error.message
            : "Something went wrong while loading home data.";
        setErrorMessage(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const homeFocusNonce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      void loadHomeData({ silent: homeFocusNonce.current });
      homeFocusNonce.current = true;
    }, [loadHomeData]),
  );

  const { refreshControl } = usePullToRefresh(
    useCallback(async () => {
      await loadHomeData({ silent: true });
      featuredLoadedRef.current = false;
      await loadFeaturedBoutiques(gpsCoords);
    }, [loadHomeData, loadFeaturedBoutiques, gpsCoords]),
  );

  const renderOccasionItem = useCallback(
    ({ item }: { item: (typeof occasionData)[number] }) => {
      if (!item?.image || !item.id) {
        return null;
      }
      const imageSource =
        typeof item.image === "string" && item.image.trim().startsWith("http")
          ? { uri: item.image.trim() }
          : { uri: PLACEHOLDER_IMAGE_URI };

      return (
        <TouchableOpacity
          activeOpacity={0.92}
          accessibilityRole="button"
          style={[styles.occasionHCard, { width: occasionHCardW }]}
          onPress={() => pushCollection(router, item.collectionSlug)}
        >
          <ImageBackground
            source={imageSource}
            style={[
              styles.occasionImageBg,
              { width: occasionHCardW, height: 200 },
            ]}
            imageStyle={styles.occasionImageRadius}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
              locations={[0.25, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
            <View style={styles.occasionTextContainer} pointerEvents="none">
              <Text style={styles.occasionTitle}>{item.title}</Text>
              <Text style={styles.occasionSubtitle}>{item.subtitle}</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      );
    },
    [router, occasionHCardW],
  );

  const navigateToCategoryList = () => {
    router.push("/categories");
  };

  const navigateToCategoryDetails = (id: string) => {
    router.push({
      pathname: "/(app)/category-products",
      params: { category: id },
    });
  };

  const openAllBoutiques = () => {
    router.push("/boutiques");
  };

  const openBoutiquesLoadMore = (type: "featured" | "nearest") => {
    router.push({ pathname: "/boutiques", params: { type } });
  };

  const openOccasions = () => {
    router.push("/(app)/occasions");
  };

  const openTrending = () => {
    router.push("/trending");
  };

  const openBoutiqueProfile = useCallback(
    (boutiqueId: string) => {
      router.push({ pathname: "/(app)/boutique-profile", params: { id: boutiqueId } });
    },
    [router],
  );

  const openFeaturedDirections = useCallback((location: string) => {
    const q = encodeURIComponent(`${location} jewellery boutique`);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
    ).catch(() => {});
  }, []);

  const openFeaturedCall = useCallback((phone?: string | null) => {
    const raw = phone?.trim();
    if (!raw) return;
    Linking.openURL(`tel:${raw.replace(/\s/g, "")}`).catch(() => {});
  }, []);

  const openFeaturedBookAppt = useCallback(
    (id: string) => {
      if (!id) {
        console.log("Missing boutique id");
        return;
      }
      requireAuth(
        () => {
          router.push({
            pathname: "/(app)/book-appointment",
            params: { boutiqueId: id },
          });
        },
        {
          pendingAction: { type: "appointment", boutiqueId: id },
          analyticsEvent: "appointment",
        },
      );
    },
    [requireAuth, router],
  );

  const nearestBoutiqueCardShadow = useMemo(
    () =>
      Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
        },
        android: { elevation: 4 },
        default: {},
      }),
    [],
  );

  const renderNearestBoutiqueItem = useCallback(
    ({ item }: { item: Boutique }) => (
      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.location}`}
        style={[styles.nearestBoutiqueOuter, nearestBoutiqueCardShadow]}
        onPress={() => openBoutiqueProfile(item.id)}
      >
        <View style={styles.nearestBoutiqueCard}>
          <RemoteImage
            uri={item.image}
            fallbackTint="#bfa67f"
            style={styles.nearestBoutiqueImage}
          />
          <View style={styles.nearestBoutiqueContent}>
            <Text style={styles.nearestBoutiqueName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.nearestBoutiqueLocation} numberOfLines={1}>
              {item.location}
            </Text>
            <View style={styles.nearestBoutiqueRow}>
              <View style={styles.nearestBoutiqueRatingRow}>
                <Text style={styles.nearestBoutiqueStar}>★</Text>
                <Text style={styles.nearestBoutiqueRating}>
                  {item.rating.toFixed(1)}
                </Text>
              </View>
              <Text style={styles.nearestBoutiqueDistance}>
                {formatBoutiqueDistanceLine({
                  distanceKm: item.distanceKm,
                  locationLoading,
                  hasBoutiqueCoords: boutiqueHasCoordinates(item),
                  permission: locationPermission,
                  userLocationGpsFailed: locationGpsFailed,
                })}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [
      nearestBoutiqueCardShadow,
      openBoutiqueProfile,
      locationLoading,
      locationPermission,
      locationGpsFailed,
    ],
  );

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.screenContent}
      nestedScrollEnabled
      refreshControl={refreshControl}
    >
      <View>
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable onPress={() => router.push("/menu")} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
          <Text style={styles.brand}>GehnaHub</Text>
        </View>
        <View style={styles.rightIcons}>
          <Pressable
            accessibilityRole="button"
            hitSlop={spacing.sm}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            onPress={() => router.push("/notifications")}
          >
            <MaterialIcons
              name="notifications-none"
              size={24}
              color={styles.icon.color}
            />
            <NotificationBadge count={unreadNotificationsCount} />
          </Pressable>
          <WishlistNavIcon
            count={wishlistCount}
            onPress={openWishlist}
            iconColor={styles.icon.color}
            bgColor={styles.iconButton.backgroundColor as string}
            borderColor={styles.iconButton.borderColor as string}
          />
        </View>
      </View>

      <View style={styles.searchBarWrap}>
        <SearchBar
          placeholder="Search by Category, Occasion, Relationship"
          rotatingPlaceholders={SEARCH_ROTATING_PLACEHOLDERS}
          onPress={() => router.push("/search")}
          onVoicePress={onVoicePress}
        />
      </View>

      <View style={styles.rateRow}>
        <Text style={styles.rateText}>24K GOLD ₹6,245/g</Text>
        <Text style={styles.rateText}>22K GOLD ₹5,720/g</Text>
      </View>

      <View style={styles.heroCard}>
        <RemoteImage
          uri={HERO_JEWELLERY_URI}
          fallbackTint="#4d3a20"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroScrim} />
        <View style={styles.heroInner}>
          <Text style={styles.heroTitle}>
            Discover India&apos;s Finest Jewellery Boutiques Near You
          </Text>
          <Text style={styles.heroSubtitle}>
            Browse online, visit in-store, book appointments
          </Text>
          <Pressable
            onPress={openAllBoutiques}
            style={styles.heroButtonPrimary}
          >
            <Text style={styles.heroButtonPrimaryText}>Find Boutiques</Text>
          </Pressable>
          <Pressable
            onPress={navigateToCategoryList}
            style={styles.heroButtonSecondary}
          >
            <Text style={styles.heroButtonSecondaryText}>Browse Products</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.collectionsLabel}>COLLECTIONS</Text>
      {loading ? (
        <Text style={styles.loadInfo}>Loading collections…</Text>
      ) : null}
      {!loading && !errorMessage && collectionsData.length === 0 ? (
        <Text style={styles.loadInfo}>No collections available</Text>
      ) : null}
      {!loading && !errorMessage && collectionsData.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collectionsChipsRow}
          nestedScrollEnabled
        >
          {collectionsData.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => pushCollection(router, item.slug)}
              style={styles.collectionChip}
            >
              <Text style={styles.collectionChipText}>{item.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <SectionTitle
        title="Explore Categories"
        onPress={navigateToCategoryList}
      />
      {reachable === false ? (
        <Text style={styles.offlineHint}>
          No network detected. Check your internet connection (EXPO_PUBLIC_API_URL).
        </Text>
      ) : null}
      {errorMessage ? (
        <View style={styles.errorBlock}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading home screen"
            onPress={() => void loadHomeData()}
            style={styles.retryBtn}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {loading ? (
        <View style={styles.sectionSkeletonWrap}>
          <CategorySkeletonLoader count={8} />
        </View>
      ) : (
        <FlatList
          {...FLAT_LIST_WINDOWED_PROPS}
          data={homeCategoryPreview}
          keyExtractor={(item) => item}
          numColumns={4}
          scrollEnabled={false}
          columnWrapperStyle={styles.categoryColumnWrapper}
          contentContainerStyle={styles.categoryFlatListContent}
          renderItem={({ item: id }) => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={id}
              activeOpacity={0.85}
              style={[styles.categoryItem, { width: categoryColW }]}
              onPress={() => navigateToCategoryDetails(id)}
            >
              <RemoteImage
                uri={homeCategoryImageByName[id] || undefined}
                placeholder="category"
                fallbackTint="#f5f0e6"
                style={styles.categoryImage}
              />
              <Text style={styles.categoryLabel}>{id}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <SectionTitle
        title="Featured Boutiques Near You"
        onPress={openAllBoutiques}
      />
      {showLocationBanner ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Enable location in settings"
          activeOpacity={0.85}
          onPress={() => Linking.openSettings().catch(() => {})}
        >
          <View style={styles.locationBanner}>
            <Ionicons name="location-outline" size={16} color="#F59E0B" />
            <Text style={styles.locationBannerText}>
              Enable location to see boutiques nearest to you
            </Text>
            <Text style={styles.locationBannerAction}>Enable</Text>
          </View>
        </TouchableOpacity>
      ) : null}
      {loading || featuredLoading ? (
        <BoutiqueSkeletonLoader count={2} />
      ) : featuredBoutiquesData.length === 0 ? (
        <View style={styles.featuredEmpty}>
          <Text style={styles.featuredEmptyText}>
            No featured boutiques in your area yet
          </Text>
        </View>
      ) : (
        featuredBoutiquesData
          .slice(0, 2)
          .map((item) => (
            <FeaturedBoutiqueCard
              key={item.id}
              item={item}
              onPressCard={() => openBoutiqueProfile(item.id)}
              onDirections={() => openFeaturedDirections(item.location)}
              onCall={() => openFeaturedCall(item.phone)}
              onBookAppt={() => openFeaturedBookAppt(item.id)}
            />
          ))
      )}
      <View style={styles.loadMoreOuter}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Load more boutiques"
          activeOpacity={0.85}
          onPress={() => openBoutiquesLoadMore("featured")}
          style={styles.loadMoreBtn}
        >
          <Text style={styles.loadMoreBtnText}>Load More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.occasionSectionWrap}>
        <SectionTitle title="Shop by Occasion" onPress={openOccasions} />
        {loading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.occasionListHorizontal}
            nestedScrollEnabled
          >
            {[0, 1].map((i) => (
              <View
                key={`occasion-placeholder-${i}`}
                style={[styles.occasionHCard, { width: occasionHCardW }]}
              >
                <ShimmerBlock height={200} borderRadius={20} />
              </View>
            ))}
          </ScrollView>
        ) : !occasionData || occasionData.length === 0 ? (
          <View style={styles.occasionEmpty}>
            <Text style={styles.occasionEmptyText}>
              {errorMessage ? "Couldn't load occasions." : "No data available"}
            </Text>
            {errorMessage ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadHomeData()}
                style={styles.inlineRetryBtn}
              >
                <Text style={styles.inlineRetryBtnText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <FlatList
            {...FLAT_LIST_HORIZONTAL_PROPS}
            data={occasionData}
            horizontal
            nestedScrollEnabled
            keyExtractor={(item, index) =>
              item?.id != null ? String(item.id) : String(index)
            }
            renderItem={renderOccasionItem}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.occasionListHorizontal}
          />
        )}
      </View>

      <View style={styles.nearestSection}>
        <SectionTitle
          title="Visit Nearest Boutiques"
          onPress={openAllBoutiques}
        />
        {loading ? (
          <BoutiqueSkeletonLoader count={3} />
        ) : (
          <FlatList
            {...FLAT_LIST_HORIZONTAL_PROPS}
            data={boutiquesData}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            extraData={{ userCoords, locationLoading, locationPermission }}
            contentContainerStyle={styles.nearestListContent}
            renderItem={renderNearestBoutiqueItem}
          />
        )}
      </View>

      <SectionTitle title="Trending Now" onPress={openTrending} />
      {loading ? (
        <ProductSkeletonLoader count={4} />
      ) : (
        <FlatList
          {...FLAT_LIST_WINDOWED_PROPS}
          data={homeTrendingPreview}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.trendingRow}
          contentContainerStyle={styles.trendingFlatContent}
          renderItem={({ item }) => {
            const listing = toHomeTrendingListing(item);
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
          }}
        />
      )}

      {!loading
        ? featuredSections.map((section) => (
            <FeaturedSectionRail key={section.id} section={section} />
          ))
        : null}

      <WhyChooseGehnaHubSection />
    </View>
    </ScrollView>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.inner}>
        <HomeContent onVoicePress={() => setVoiceModalVisible(true)} />
      </View>
      <VoiceSearchModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onResultSelect={(product) => {
          setVoiceModalVisible(false);
          pushProductDetails(router, product.id);
        }}
        onSearchByText={() => {
          setVoiceModalVisible(false);
          router.push("/search");
        }}
      />
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  inner: { flex: 1 },
  scroll: { flex: 1 },
  screenContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    backgroundColor: "#f5f5f5",
  },
  topBar: {
    marginHorizontal: -16,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexShrink: 1,
  },
  menuBtn: { padding: spacing.xs, marginRight: 2 },
  menuIcon: { fontSize: 18, color: "#0e1d3a" },
  brand: { fontSize: fontSizes.lg, fontWeight: "800", color: "#0e1d3a" },
  rightIcons: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  iconButton: {
    padding: 10,
    borderRadius: radius.full,
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#e7e7e7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: {
    opacity: 0.85,
    backgroundColor: "#ededed",
  },
  notificationBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#dc2626",
    borderWidth: 1.5,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    includeFontPadding: false,
  },
  icon: { color: "#0e1d3a" },
  searchBarWrap: { marginTop: spacing.sm, marginBottom: spacing.md },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  rateText: { fontSize: 11, fontWeight: "700", color: "#353535" },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    width: "100%",
    alignSelf: "center",
    maxWidth: "100%",
    aspectRatio: 1.12,
    marginBottom: spacing.lg,
    position: "relative",
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  heroInner: {
    flex: 1,
    paddingVertical: spacing["2xl"],
    paddingHorizontal: spacing.lg,
    justifyContent: "flex-end",
  },
  heroTitle: { color: "#fff", fontSize: 22, lineHeight: 30, fontWeight: "600" },
  heroSubtitle: {
    marginTop: spacing.md,
    color: "#ececec",
    fontSize: fontSizes.md,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  heroButtonPrimary: {
    backgroundColor: "#d2bd59",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  heroButtonPrimaryText: { color: "#fff", fontWeight: "700" },
  heroButtonSecondary: {
    borderWidth: 1,
    borderColor: "#8ba1ae",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  heroButtonSecondaryText: { color: "#fff", fontWeight: "700" },
  collectionsLabel: {
    color: "#7b7b7b",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
  },
  sectionTitleRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#1a1a1a",
    maxWidth: "75%",
  },
  viewAll: { fontSize: 10, fontWeight: "700", color: "#5f5f5f" },
  categoryFlatListContent: { marginBottom: spacing.lg },
  categoryColumnWrapper: {
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  categoryItem: { alignItems: "center" },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
  },
  categoryLabel: {
    marginTop: spacing.xs,
    fontSize: 9,
    letterSpacing: 1,
    color: "#555",
    fontWeight: "700",
  },
  featuredEmpty: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  featuredEmptyText: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },
  locationBanner: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationBannerText: {
    fontSize: 12,
    color: "#92400E",
    flex: 1,
  },
  locationBannerAction: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "600",
  },
  loadMoreOuter: { marginVertical: 16 },
  loadMoreBtn: {
    backgroundColor: "#0b1f48",
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreBtnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
    fontSize: fontSizes.sm,
  },
  occasionSectionWrap: {
    minHeight: 220,
    marginBottom: spacing.lg,
  },
  occasionEmpty: {
    padding: 20,
    alignItems: "center",
  },
  occasionEmptyText: {
    fontSize: fontSizes.sm,
    color: "#6b7280",
  },
  occasionListHorizontal: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 4,
  },
  occasionHCard: {
    height: 200,
    marginRight: 12,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#e8e8e8",
  },
  occasionImageBg: {
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  occasionImageRadius: {
    borderRadius: 20,
  },
  occasionTextContainer: {
    padding: 12,
    paddingBottom: 14,
  },
  occasionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "left",
  },
  occasionSubtitle: {
    color: "#e5e5e5",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: "left",
  },
  nearestSection: { marginBottom: spacing.lg },
  nearestListContent: { paddingHorizontal: 16, paddingBottom: 4 },
  nearestBoutiqueOuter: {
    width: 260,
    marginRight: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  nearestBoutiqueCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  nearestBoutiqueImage: {
    width: "100%",
    height: 140,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  nearestBoutiqueContent: { padding: 12 },
  nearestBoutiqueName: { fontSize: 15, fontWeight: "600", color: "#111" },
  nearestBoutiqueLocation: { fontSize: 12, color: "#777", marginTop: 2 },
  nearestBoutiqueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    alignItems: "center",
  },
  nearestBoutiqueRatingRow: { flexDirection: "row", alignItems: "center" },
  nearestBoutiqueStar: { color: "#C6A85B", fontSize: 14, marginRight: 4 },
  nearestBoutiqueRating: { fontSize: 12, fontWeight: "500", color: "#111" },
  nearestBoutiqueDistance: { fontSize: 12, color: "#777" },
  trendingFlatContent: { marginBottom: spacing["2xl"] },
  trendingRow: { justifyContent: "space-between" },
  loadInfo: {
    paddingHorizontal: 4,
    marginBottom: 8,
    fontSize: 12,
    color: "#64748B",
  },
  collectionsChipsRow: {
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  collectionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  collectionChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  offlineHint: {
    paddingHorizontal: 4,
    marginBottom: 8,
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
  },
  sectionSkeletonWrap: { marginBottom: 16 },
  errorBlock: {
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  errorText: {
    marginBottom: 4,
    fontSize: 12,
    color: "#b91c1c",
    lineHeight: 17,
  },
  retryBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0b1f48",
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  inlineRetryBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#0b1f48",
    alignSelf: "center",
  },
  inlineRetryBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
