import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUserLocation } from '@/hooks/useUserLocation';
import { haversineDistanceKm } from '@/lib/boutiques/boutiqueUi';
import { pushProductDetails } from '@/lib/navigation/productNavigation';
import { parseCoord } from '@/utils/calculateDistance';
import {
  RecentlyViewedBoutiqueCard,
  recentlyViewedProductCardWidth,
} from '@/lib/components/common/RecentlyViewedBoutiqueCard';
import type { RecentlyViewedBoutique } from '@/lib/services/mock/recentlyViewed';
import { showPopup } from '@/lib/stores/popupStore';
import { useRecentlyViewedStore } from '@/lib/stores/recentlyViewedStore';
import { useAuth } from '@/context/AuthContext';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const BG = '#f5f5f5';
const GOLD = '#b8860b';

function sortByRecent(items: RecentlyViewedBoutique[]): RecentlyViewedBoutique[] {
  return [...items].sort((a, b) => b.lastViewedAt - a.lastViewedAt);
}

export default function RecentlyViewedScreen() {
  const router = useRouter();
  const boutiques = useRecentlyViewedStore((s) => s.boutiques);
  const { coords: userCoords } = useUserLocation(true);

  const boutiquesWithDistance = useMemo((): RecentlyViewedBoutique[] => {
    if (!userCoords) {
      return boutiques.map((b) => ({ ...b, distanceKm: null }));
    }
    return boutiques.map((b) => {
      const la = parseCoord(b.latitude);
      const lo = parseCoord(b.longitude);
      if (la == null || lo == null) {
        return { ...b, distanceKm: null };
      }
      return {
        ...b,
        distanceKm: haversineDistanceKm(userCoords.lat, userCoords.lng, la, lo),
      };
    });
  }, [boutiques, userCoords]);
  const remove = useRecentlyViewedStore((s) => s.remove);
  const clearAll = useRecentlyViewedStore((s) => s.clearAll);
  const refresh = useRecentlyViewedStore((s) => s.refresh);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void refresh(user.id);
    }, [refresh, user?.id]),
  );

  const cardW = useMemo(() => recentlyViewedProductCardWidth(), []);

  const data = useMemo(() => sortByRecent(boutiquesWithDistance), [boutiquesWithDistance]);

  const confirmClearAll = useCallback(() => {
    showPopup({
      type: 'confirm',
      title: 'Clear all?',
      message: 'Remove every boutique from your recently viewed list.',
      confirmLabel: 'Clear',
      destructive: true,
      onConfirm: () => {
        void clearAll(user?.id);
      },
    });
  }, [clearAll, user?.id]);

  const openProduct = useCallback(
    (id: string) => {
      pushProductDetails(router, id);
    },
    [router],
  );

  const openBoutique = useCallback(
    (boutiqueId: string) => {
      router.push({ pathname: '/(app)/boutique-profile', params: { id: boutiqueId } });
    },
    [router],
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Text style={styles.kicker}>PICK UP WHERE YOU LEFT OFF</Text>
        <View style={styles.titleRow}>
          <Text style={styles.heroTitle}>Your Selection</Text>
        </View>
      </View>
    ),
    [],
  );

  const Empty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <MaterialIcons name="history" size={56} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No recently viewed items</Text>
        <Text style={styles.emptySub}>
          Products and boutiques you explore will appear here so you can quickly return to your favourites.
        </Text>
        <Pressable
          style={styles.emptyCta}
          onPress={() =>
            router.push({
              pathname: '/(app)/home',
            })
          }
        >
          <Text style={styles.emptyCtaText}>Explore Jewellery</Text>
        </Pressable>
      </View>
    ),
    [router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backSlot}>
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text style={styles.navTitle}>Recently Viewed</Text>
        <Pressable hitSlop={12} onPress={confirmClearAll} style={styles.backSlot}>
          <MaterialIcons name="more-vert" size={24} color="#0f172a" />
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        extraData={[boutiquesWithDistance, userCoords]}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={Empty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <RecentlyViewedBoutiqueCard
            item={item}
            productCardWidth={cardW}
            onPressBoutique={() => openBoutique(item.boutiqueId)}
            onPressProduct={openProduct}
            onContinueExploring={() => openBoutique(item.boutiqueId)}
            onViewProducts={() =>
              router.push({
                pathname: '/(app)/category-products',
                params: { category: 'ALL' },
              })
            }
            onRemove={() =>
              showPopup({
                type: 'confirm',
                title: 'Remove this boutique?',
                message: 'It will disappear from your recently viewed list.',
                confirmLabel: 'Remove',
                destructive: true,
                onConfirm: () => {
                  void remove(item.id);
                },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: BG,
  },
  backSlot: { width: 40, alignItems: 'center' },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#0f172a',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  headerBlock: {
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: GOLD,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSizes['3xl'],
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: GOLD,
  },
  emptyCtaText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#ffffff',
  },
});
