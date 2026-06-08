import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategorySkeletonLoader } from '@/components/loaders';
import { useNetworkReachable } from '@/hooks/useNetworkReachable';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { CollectionExploreCard } from '@/lib/components/common/CollectionExploreCard';
import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { SearchBar } from '@/lib/components/common/SearchBar';
import { VoiceSearchModal } from '@/lib/components/common/VoiceSearchModal';
import { pushProductDetails } from '@/lib/navigation/productNavigation';
import { SEARCH_ROTATING_PLACEHOLDERS } from '@/lib/constants/searchRotatingPlaceholders';
import { fetchCategoriesUi, fetchCollectionsUi } from '@/lib/services/catalogApi';
import { PLACEHOLDER_IMAGE_URI } from '@/lib/services/mock/imageUrls';
import { ApiError } from '@/services/api';
import { BottomTabBar } from '@/src/components/navigation/BottomTabBar';
import { fontSizes, spacing } from '@/src/constants/theme';

const INK = '#0B1B2B';
const MUTED = '#64748B';
const ACCENT = '#C9A962';

const TILE_SHADOW = Platform.select({
  ios: {
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
  default: {},
});

function formatCategoryLabel(raw: string): string {
  return raw
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

const IMAGE_SIZE = 70;

export default function CategoriesScreen() {
  const router = useRouter();
  const horizontalPad = spacing.lg;
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; image: string | null; slug: string | null }>
  >([]);
  const [collections, setCollections] = useState<Array<{ id: string; title: string; subtitle: string; image: string | null; slug: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const reachable = useNetworkReachable();

  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const [rows, collectionRows] = await Promise.all([fetchCategoriesUi(), fetchCollectionsUi()]);
      setCategories(rows);
      setCollections(collectionRows);
      setError(null);
    } catch (err) {
      console.error('Failed to load categories', err);
      const message = err instanceof ApiError ? err.message : 'Unable to load categories';
      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const { refreshControl } = usePullToRefresh(
    useCallback(() => loadData({ silent: true }), [loadData]),
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categoryByName = useMemo(
    () => new Map(categories.map((item) => [item.name, item])),
    [categories],
  );
  const gridItems = useMemo(() => categories.map((item) => item.name), [categories]);

  const openSearch = () => {
    router.push('/search');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#FAF8F5', '#F2EFE9', '#EDE9E3']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.inner}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPad }]}
            nestedScrollEnabled
            refreshControl={refreshControl}
          >
            <View style={styles.pageHeader}>
              <Text style={styles.pageTitle}>All Categories</Text>
              <Text style={styles.pageSubtitle}>Discover jewellery by type, metal, and occasion</Text>
            </View>

            <View style={styles.searchBarWrap}>
              <SearchBar
                placeholder="Search categories or jewellery"
                rotatingPlaceholders={SEARCH_ROTATING_PLACEHOLDERS}
                onPress={openSearch}
                onVoicePress={() => setVoiceModalVisible(true)}
              />
            </View>
            {reachable === false ? (
              <Text style={styles.offlineHint}>
                No network connection. Connect to the same Wi‑Fi as your dev machine if you use a LAN API URL.
              </Text>
            ) : null}
            {loading ? (
              <>
                <Text style={styles.infoText}>Loading categories...</Text>
                <CategorySkeletonLoader count={12} />
              </>
            ) : null}
            {error && !loading ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading categories"
                  onPress={() => void loadData()}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.exploreSection}>
              <Text style={styles.exploreEyebrow}>SHOP BY TYPE</Text>
              <Text style={styles.exploreTitle}>Explore Categories</Text>
              <LinearGradient
                colors={[ACCENT, 'rgba(201, 169, 98, 0.35)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.exploreAccent}
              />
              <Text style={styles.exploreSubtitle}>Tap a category to browse curated jewellery</Text>
            </View>

            {!loading ? (
              <FlatList
                data={gridItems}
                numColumns={4}
                keyExtractor={(item) => item}
                scrollEnabled={false}
                contentContainerStyle={styles.gridContainer}
                columnWrapperStyle={styles.gridRow}
                renderItem={({ item }) => {
                  const row = categoryByName.get(item);
                  return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.categoryTile,
                      pressed && styles.categoryTilePressed,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/category-products',
                        params: { category: item },
                      })
                    }
                  >
                    <View style={[styles.categoryImageRing, TILE_SHADOW]}>
                      <RemoteImage
                        uri={row?.image ?? undefined}
                        placeholder="category"
                        fallbackTint="#f5f0e6"
                        style={styles.categoryImage}
                      />
                    </View>
                    <Text style={styles.categoryLabel} numberOfLines={2}>
                      {formatCategoryLabel(item)}
                    </Text>
                  </Pressable>
                  );
                }}
              />
            ) : null}

            <View style={styles.trendingHeader}>
              <Text style={styles.trendingEyebrow}>CURATED FOR YOU</Text>
              <Text style={styles.trendingTitle}>Trending Collections</Text>
              <LinearGradient
                colors={[ACCENT, 'rgba(201, 169, 98, 0.35)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.trendingAccent}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRow}
            >
              {!loading && collections.map((item) => (
                <CollectionExploreCard
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  imageUri={item.image ?? PLACEHOLDER_IMAGE_URI}
                  slug={item.slug}
                />
              ))}
            </ScrollView>
          </ScrollView>
        </View>
        <BottomTabBar />
      </SafeAreaView>
      <VoiceSearchModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onResultSelect={(product) => {
          setVoiceModalVisible(false);
          pushProductDetails(router, product.id);
        }}
        onSearchByText={() => {
          setVoiceModalVisible(false);
          router.push('/search');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EDE9E3' },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  inner: { flex: 1 },
  scrollView: { flex: 1 },
  container: { paddingTop: spacing.sm, paddingBottom: 112, flexGrow: 1 },
  pageHeader: { marginBottom: spacing.lg },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: fontSizes.sm,
    color: MUTED,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: '92%',
  },
  searchBarWrap: {
    marginBottom: spacing.lg,
  },
  exploreSection: {
    marginBottom: spacing.lg,
  },
  exploreEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: MUTED,
    marginBottom: 6,
  },
  exploreTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
  },
  exploreAccent: {
    marginTop: 10,
    marginBottom: 10,
    width: 56,
    height: 3,
    borderRadius: 2,
  },
  exploreSubtitle: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  gridContainer: {
    marginBottom: spacing['2xl'],
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  categoryTile: {
    flex: 1,
    alignItems: 'center',
  },
  categoryTilePressed: { opacity: 0.88, transform: [{ scale: 0.96 }] },
  categoryImageRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(201, 169, 98, 0.65)',
    backgroundColor: '#FFFCF8',
  },
  categoryImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
    overflow: 'hidden',
  },
  categoryLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  trendingHeader: {
    marginBottom: spacing.md,
  },
  trendingEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: MUTED,
    marginBottom: 6,
  },
  trendingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
  },
  trendingAccent: {
    marginTop: 10,
    width: 56,
    height: 3,
    borderRadius: 2,
  },
  horizontalRow: { flexDirection: 'row', gap: spacing.md, paddingRight: spacing.lg, paddingBottom: spacing.sm },
  infoText: { marginBottom: spacing.md, color: '#64748B', fontSize: 12 },
  offlineHint: {
    marginBottom: spacing.md,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 17,
  },
  errorBanner: { marginBottom: spacing.lg, gap: 10 },
  errorText: { color: '#b91c1c', fontSize: 12, fontWeight: '600', lineHeight: 17 },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: INK,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
