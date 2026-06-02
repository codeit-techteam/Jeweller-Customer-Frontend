import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useUserLocation } from '@/hooks/useUserLocation';
import { haversineDistanceKm } from '@/lib/boutiques/boutiqueUi';
import { parseCoord } from '@/utils/calculateDistance';
import type { SavedBoutique } from '@/lib/services/mock/savedBoutiques';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MyHeader } from '@/lib/components/common/MyHeader';
import { SavedBoutiqueCard } from '@/lib/components/common/SavedBoutiqueCard';
import { BoutiqueSkeletonLoader } from '@/components/loaders';
import { showPopup } from '@/lib/stores/popupStore';
import { useSavedBoutiquesStore } from '@/lib/stores/savedBoutiquesStore';
import { useAuth } from '@/context/AuthContext';

const BG = '#f5f5f5';
const TITLE_COLOR = '#0B1B2B';
const SUBTITLE = '#7A869A';
const ITINERARY_BG = '#F5F6F8';
const MAP_BTN_BG = '#E9ECEF';

const H_PAD = 16;

export default function SavedBoutiquesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const ids = useSavedBoutiquesStore((s) => s.ids);
  const itemsById = useSavedBoutiquesStore((s) => s.itemsById);
  const loading = useSavedBoutiquesStore((s) => s.loading);
  const hydrateForUser = useSavedBoutiquesStore((s) => s.hydrateForUser);
  const unsaveForUser = useSavedBoutiquesStore((s) => s.unsaveForUser);

  const items = useMemo(
    () => ids.map((id) => itemsById[id]).filter(Boolean),
    [ids, itemsById],
  );

  const { coords: userCoords } = useUserLocation(true);

  const itemsWithDistance = useMemo((): SavedBoutique[] => {
    if (!userCoords) {
      return items.map((b) => ({ ...b, distanceKm: null }));
    }
    return items.map((b) => {
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
  }, [items, userCoords]);

  React.useEffect(() => {
    if (!user?.id) return;
    void hydrateForUser(user.id);
  }, [hydrateForUser, user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      void hydrateForUser(user.id);
    }, [hydrateForUser, user?.id]),
  );

  const { refreshControl } = usePullToRefresh(
    useCallback(async () => {
      if (!user?.id) return;
      await hydrateForUser(user.id, { silent: true });
    }, [hydrateForUser, user?.id]),
    { enabled: Boolean(user?.id) },
  );

  const itinerarySummary = useMemo(() => {
    const totalPieces = itemsWithDistance.reduce((acc, b) => acc + b.itineraryPieces, 0);
    const boutiques = itemsWithDistance.length;
    return { totalPieces, boutiques };
  }, [itemsWithDistance]);

  const openProfile = useCallback(
    (id: string) => {
      router.push({ pathname: '/(app)/boutique-profile', params: { id } });
    },
    [router],
  );

  const openBookVisit = useCallback(
    (id: string) => {
      router.push({ pathname: '/(app)/book-appointment', params: { boutiqueId: id } });
    },
    [router],
  );

  const openDirections = useCallback((item: SavedBoutique) => {
    const la = item.latitude != null ? Number(item.latitude) : NaN;
    const lo = item.longitude != null ? Number(item.longitude) : NaN;
    if (Number.isFinite(la) && Number.isFinite(lo)) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${la},${lo}`).catch(() => {});
      return;
    }
    const q = encodeURIComponent(`${item.location} jewellery boutique`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
  }, []);

  const callBoutique = useCallback((phone?: string | null) => {
    const raw = phone?.trim();
    if (!raw) return;
    Linking.openURL(`tel:${raw.replace(/\s/g, '')}`).catch(() => {});
  }, []);

  const openMenu = useCallback(
    (item: (typeof items)[number]) => {
      showPopup({
        type: 'confirm',
        title: item.name,
        message: 'Remove this boutique from your saved list?',
        confirmLabel: 'Remove',
        destructive: true,
        onConfirm: () => {
          if (!user?.id) return;
          void unsaveForUser(user.id, item.id);
        },
      });
    },
    [unsaveForUser, user?.id],
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>My Visit List</Text>
        <Text style={styles.pageSubtitle}>Curate your boutique journeys</Text>

        {itinerarySummary.boutiques > 0 ? (
          <View style={styles.itineraryCard}>
            <View style={styles.itineraryTextBlock}>
              <Text style={styles.smallLabel}>CURRENT ITINERARY</Text>
              <Text style={styles.itineraryText}>
                {itinerarySummary.totalPieces} items across {itinerarySummary.boutiques}{' '}
                {itinerarySummary.boutiques === 1 ? 'boutique' : 'boutiques'}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.mapBtn, pressed && styles.pressed]}
              onPress={() => {
                const first = itemsWithDistance.find(
                  (b) => b.latitude != null && b.longitude != null,
                );
                if (first && first.latitude != null && first.longitude != null) {
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${first.latitude},${first.longitude}`,
                  ).catch(() => {});
                  return;
                }
                showPopup({
                  type: 'info',
                  title: 'Map view',
                  message: 'Add boutiques with map locations to open them here.',
                });
              }}
            >
              <MaterialIcons name="map" size={16} color={TITLE_COLOR} />
              <Text style={styles.mapBtnLabel}>Map View</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    ),
    [itinerarySummary.boutiques, itinerarySummary.totalPieces, itemsWithDistance],
  );

  const Empty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No saved boutiques</Text>
        <Text style={styles.emptySub}>Save boutiques from their profile to see them here.</Text>
        <Pressable style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]} onPress={() => router.push('/(app)/boutiques')}>
          <Text style={styles.emptyCtaText}>Find boutiques</Text>
        </Pressable>
      </View>
    ),
    [router],
  );

  if (!user?.id) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.headerPad}>
          <MyHeader title="My Visit" showBack />
        </View>
        <View style={styles.guestWrap}>
          <Text style={styles.emptyTitle}>Please sign in to save boutiques</Text>
          <Text style={styles.emptySub}>
            Sign in to keep your favourite boutiques in sync across all your devices.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.emptyCtaText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerPad}>
        <MyHeader title="My Visit" showBack />
      </View>

      {loading && items.length === 0 ? (
        <View style={[styles.listContent, styles.loaderWrap]}>
          {ListHeader}
          <BoutiqueSkeletonLoader count={3} />
        </View>
      ) : (
        <FlatList
          data={itemsWithDistance}
          keyExtractor={(item) => item.id}
          extraData={[ids, userCoords]}
          nestedScrollEnabled
          refreshControl={refreshControl}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<View>{Empty}</View>}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SavedBoutiqueCard
              item={item}
              onNamePress={() => openProfile(item.id)}
              onMenuPress={() => openMenu(item)}
              onPlanVisit={() => openBookVisit(item.id)}
              onDirections={() => openDirections(item)}
              onCall={() => callBoutique(item.phone)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  headerPad: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: BG,
  },
  listContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 32,
    flexGrow: 1,
  },
  loaderWrap: {
    paddingTop: 16,
  },
  headerBlock: {
    paddingTop: 8,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: TITLE_COLOR,
  },
  pageSubtitle: {
    fontSize: 14,
    color: SUBTITLE,
    marginTop: 6,
  },
  itineraryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: ITINERARY_BG,
    marginTop: 16,
  },
  itineraryTextBlock: { flex: 1, marginRight: 12, minWidth: 0 },
  smallLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#C9A646',
    marginBottom: 6,
  },
  itineraryText: {
    fontSize: 15,
    fontWeight: '700',
    color: TITLE_COLOR,
    lineHeight: 20,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: MAP_BTN_BG,
    borderRadius: 20,
  },
  mapBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TITLE_COLOR,
  },
  pressed: { opacity: 0.9 },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: H_PAD,
  },
  guestWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: H_PAD,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TITLE_COLOR,
  },
  emptySub: {
    marginTop: 8,
    fontSize: 14,
    color: SUBTITLE,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 20,
    backgroundColor: TITLE_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
