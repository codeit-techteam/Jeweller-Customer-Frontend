import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { pushCollection } from '@/lib/navigation/collectionNavigation';
import { pushProductDetails } from '@/lib/navigation/productNavigation';
import { OCCASION_HERO_URI } from '@/lib/services/mock/imageUrls';
import { fetchOccasionsUi, fetchTrendingProductsUi } from '@/lib/services/catalogApi';
import { formatBoutiqueMeta } from '@/lib/utils/formatBoutiqueMeta';
import { BottomTabBar } from '@/src/components/navigation/BottomTabBar';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const BG = '#F7F7F7';
const NAVY = '#0A1F44';
const GOLD = '#C19D5F';
const OCCASION_FALLBACK = [
  { id: 'fallback-wedding', title: 'Wedding', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1000&q=88&auto=format&fit=crop', collectionSlug: 'wedding' },
  { id: 'fallback-anniversary', title: 'Anniversary', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&q=88&auto=format&fit=crop', collectionSlug: 'anniversary' },
  { id: 'fallback-engagement', title: 'Engagement', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&q=88&auto=format&fit=crop', collectionSlug: 'engagement' },
  { id: 'fallback-festive', title: 'Festive', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1000&q=88&auto=format&fit=crop', collectionSlug: 'festive' },
  { id: 'fallback-daily-wear', title: 'Daily Wear', image: 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=1000&q=88&auto=format&fit=crop', collectionSlug: 'everyday' },
  { id: 'fallback-birthday', title: 'Birthday', image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=1000&q=88&auto=format&fit=crop', collectionSlug: 'birthday' },
];

export default function OccasionsScreen() {
  const [occasionCollections, setOccasionCollections] = React.useState<Array<{ id: string; title: string; image: string | null; collectionSlug: string }>>([]);
  const [trendingInWedding, setTrendingInWedding] = React.useState<
    Array<{
      id: string;
      title: string;
      price: string;
      subtitle: string;
      boutiqueLine: string | null;
      image: string | null;
    }>
  >([]);
  const [loadingOccasions, setLoadingOccasions] = React.useState(true);
  const [loadingTrending, setLoadingTrending] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [occasionsResult, trendingResult] = await Promise.allSettled([
          fetchOccasionsUi(),
          fetchTrendingProductsUi(),
        ]);

        if (!mounted) return;

        if (occasionsResult.status === 'fulfilled') {
          const occasions = occasionsResult.value;
          setOccasionCollections(
            occasions.map((item) => ({
              id: item.id,
              title: item.title,
              image: item.image,
              collectionSlug: item.collectionSlug,
            })),
          );
          console.log('Occasions:', occasions.length);
        } else {
          console.error('Failed to load occasions, using fallback', occasionsResult.reason);
          setOccasionCollections(OCCASION_FALLBACK);
          console.log('Occasions:', OCCASION_FALLBACK.length);
        }

        if (trendingResult.status === 'fulfilled') {
          const trending = trendingResult.value;
          setTrendingInWedding(
            trending.slice(0, 4).map((item) => ({
              id: item.id,
              title: item.title,
              price: item.price,
              subtitle: item.description,
              boutiqueLine:
                typeof item.boutiqueName === 'string' && item.boutiqueName.trim()
                  ? formatBoutiqueMeta({
                      name: item.boutiqueName,
                      rating: item.boutiqueRating,
                      verified: item.boutiqueVerified,
                    })
                  : null,
              image: item.imageUri ?? null,
            })),
          );
        } else {
          console.error('Failed to load trending products', trendingResult.reason);
          setTrendingInWedding([]);
        }
      } finally {
        if (mounted) {
          setLoadingOccasions(false);
          setLoadingTrending(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const tileW = useMemo(() => Math.max(0, (width - 16 * 2 - 12) / 2), [width]);
  const trendingW = useMemo(() => Math.min(240, Math.max(160, width * 0.42)), [width]);

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: { id: string; title: string; image: string | null; collectionSlug: string } }) => (
      <TouchableOpacity
        activeOpacity={0.92}
        style={[styles.card, { width: tileW }]}
        onPress={() => pushCollection(router, item.collectionSlug)}
      >
        <View style={styles.cardImageWrap}>
          <RemoteImage uri={item.image} fallbackTint="#cbd5e1" style={styles.cardImage} />
          <View style={styles.label}>
            <Text style={styles.labelText}>{item.title.toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [router, tileW],
  );

  const ListHeader = useMemo(
    () => (
      <>
        <View style={styles.banner}>
          <ImageBackground
            source={{ uri: OCCASION_HERO_URI }}
            style={styles.bannerImage}
            imageStyle={styles.bannerImageRadius}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.72)']}
              locations={[0.35, 1]}
              style={styles.bannerGradient}
            />
            <Text style={styles.bannerText}>Find the Perfect Jewellery for Every Occasion</Text>
          </ImageBackground>
        </View>
        <Text style={styles.sectionTitle}>Explore Collections</Text>
        {loadingOccasions ? <Text style={{ marginHorizontal: 16, color: '#64748b' }}>Loading occasions...</Text> : null}
      </>
    ),
    [loadingOccasions],
  );

  const ListFooter = useMemo(
    () => (
      <>
        <View style={styles.trendingHeader}>
          <View style={styles.trendingHeaderText}>
            <Text style={styles.trendingTitle}>Trending in Wedding</Text>
            <Text style={styles.sectionSub}>Curated for your special day</Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/trending')} hitSlop={8}>
            <Text style={styles.viewAll}>VIEW ALL</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          nestedScrollEnabled
        >
          {trendingInWedding.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.trendingCard,
                { width: trendingW },
                pressed && styles.trendingPressed,
              ]}
              onPress={() => pushProductDetails(router, item.id)}
            >
              <RemoteImage uri={item.image} fallbackTint="#e2e8f0" style={styles.trendingImage} />
              <Text style={styles.trendingProductTitle}>{item.title}</Text>
              <Text style={styles.trendingPrice}>{item.price}</Text>
              <Text style={styles.trendingBoutique} numberOfLines={1}>
                {item.boutiqueLine ?? item.subtitle}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {!loadingTrending && trendingInWedding.length === 0 ? (
          <Text style={{ paddingHorizontal: 16, marginTop: -8, marginBottom: 16, color: '#6b7280' }}>
            No trending products available right now.
          </Text>
        ) : null}

        <View style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>Bespoke Design Service</Text>
          <Text style={styles.serviceBody}>
            Let our master craftsmen bring your dream occasion jewellery to life with our exclusive atelier service.
          </Text>
          <View style={styles.serviceBtn}>
            <Text style={styles.serviceBtnText}>Consult an Expert</Text>
          </View>
        </View>
      </>
    ),
    [router, trendingW],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.inner}>
        <View style={styles.topBar}>
          <Pressable onPress={onBack} hitSlop={12} style={styles.topIcon} accessibilityRole="button">
            <MaterialIcons
              name={Platform.OS === 'android' ? 'arrow-back' : 'arrow-back-ios'}
              size={22}
              color={NAVY}
            />
          </Pressable>
          <Text style={styles.screenTitle}>Shop by Occasion</Text>
          <Pressable onPress={() => router.push('/(app)/cart')} hitSlop={12} style={styles.topIcon}>
            <MaterialIcons name="shopping-bag" size={22} color={NAVY} />
          </Pressable>
        </View>

        <FlatList
          data={occasionCollections}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  inner: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8e8',
  },
  topIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: NAVY,
  },
  list: { flex: 1 },
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  banner: {
    padding: 16,
  },
  bannerImage: {
    height: 200,
    width: '100%',
    justifyContent: 'flex-end',
    padding: 16,
    overflow: 'hidden',
  },
  bannerImageRadius: {
    borderRadius: 20,
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  bannerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    maxWidth: '92%',
    zIndex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 10,
    color: NAVY,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    marginBottom: 0,
  },
  cardImageWrap: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  label: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    color: NAVY,
    letterSpacing: 0.4,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: spacing.sm,
  },
  trendingHeaderText: { flex: 1, paddingRight: spacing.sm },
  trendingTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: NAVY,
  },
  sectionSub: { fontSize: fontSizes.xs, color: '#6b7280', marginTop: 4 },
  viewAll: { fontSize: fontSizes.xs, color: GOLD, fontWeight: '700', letterSpacing: 0.5 },
  horizontalList: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 16,
    marginBottom: spacing.lg,
  },
  trendingCard: {},
  trendingPressed: { opacity: 0.92 },
  trendingImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: '#f3f4f6',
  },
  trendingProductTitle: { fontSize: fontSizes.md, fontWeight: '700', color: NAVY },
  trendingPrice: { marginTop: 4, fontSize: fontSizes.lg, fontWeight: '700', color: NAVY },
  trendingBoutique: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: 0.2,
  },
  trendingSub: { fontSize: fontSizes.sm, fontWeight: '600', color: GOLD },
  serviceCard: {
    backgroundColor: '#0b1f48',
    borderRadius: 20,
    padding: spacing.xl,
    marginHorizontal: 16,
    marginBottom: spacing.lg,
  },
  serviceTitle: { fontSize: fontSizes['2xl'], fontWeight: '700', color: '#fff', textAlign: 'center' },
  serviceBody: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: '#d6def0',
    lineHeight: 19,
    textAlign: 'center',
  },
  serviceBtn: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    backgroundColor: GOLD,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  serviceBtnText: { fontSize: fontSizes.md, color: '#fff', fontWeight: '700' },
});
