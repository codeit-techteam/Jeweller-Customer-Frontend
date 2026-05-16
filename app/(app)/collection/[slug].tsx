import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollectionScreen } from '@/lib/components/collections/CollectionScreen';
import {
  fetchCollectionBySlugUi,
  fetchGiftCollectionsUi,
  fetchOffersUi,
  type CollectionUi,
  type GiftCollectionUi,
  type OfferUi,
} from '@/lib/services/catalogApi';
import { getCollectionScreenConfig } from '@/lib/services/mock/collections/collectionScreenConfig';
import { fontSizes, spacing } from '@/src/constants/theme';

function paramSlug(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? raw[0] ?? '' : raw;
}

type CmsOverlay = {
  navTitle?: string;
  heroUri?: string;
  heroLabel?: string;
  heroTitle?: string;
  heroSubtitle?: string;
};

function buildOverlayFromCollection(row: CollectionUi): CmsOverlay {
  return {
    navTitle: row.title,
    heroUri: row.bannerImage ?? row.image ?? undefined,
    heroLabel: row.subtitle?.toUpperCase() || undefined,
    heroTitle: row.title,
    heroSubtitle: row.description ?? row.subtitle ?? undefined,
  };
}

function buildOverlayFromOffer(row: OfferUi): CmsOverlay {
  return {
    navTitle: row.title,
    heroUri: row.bannerImage ?? row.image ?? undefined,
    heroLabel: row.badge?.toUpperCase() || row.discountText?.toUpperCase() || undefined,
    heroTitle: row.title,
    heroSubtitle: row.description ?? row.subtitle ?? row.discountText ?? undefined,
  };
}

function buildOverlayFromGift(row: GiftCollectionUi): CmsOverlay {
  return {
    navTitle: row.title,
    heroUri: row.bannerImage ?? row.image ?? undefined,
    heroLabel: row.subtitle?.toUpperCase() || undefined,
    heroTitle: row.title,
    heroSubtitle: row.description ?? row.subtitle ?? undefined,
  };
}

export default function CollectionBySlugScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string | string[]; type?: string | string[] }>();
  const slugParam = paramSlug(params.slug) || paramSlug(params.type);
  const slug = slugParam.trim().toLowerCase();

  const [overlay, setOverlay] = useState<CmsOverlay | null>(null);

  useEffect(() => {
    if (!slug) {
      setOverlay(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const collection = await fetchCollectionBySlugUi(slug);
        if (cancelled) return;
        if (collection) {
          setOverlay(buildOverlayFromCollection(collection));
          return;
        }
        const [offers, gifts] = await Promise.all([
          fetchOffersUi(),
          fetchGiftCollectionsUi(),
        ]);
        if (cancelled) return;
        const offer = offers.find((row) => row.slug === slug);
        if (offer) {
          setOverlay(buildOverlayFromOffer(offer));
          return;
        }
        const gift = gifts.find((row) => row.slug === slug);
        if (gift) {
          setOverlay(buildOverlayFromGift(gift));
          return;
        }
        setOverlay(null);
      } catch (error) {
        if (!cancelled) {
          console.warn('[collection/[slug]] CMS lookup failed', error);
          setOverlay(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const config = useMemo(() => {
    if (!slug) return null;
    const base = getCollectionScreenConfig(slug);
    if (!overlay) return base;
    return {
      ...base,
      navTitle: overlay.navTitle || base.navTitle,
      heroUri: overlay.heroUri || base.heroUri,
      heroLabel: overlay.heroLabel || base.heroLabel,
      heroTitle: overlay.heroTitle || base.heroTitle,
      heroSubtitle: overlay.heroSubtitle || base.heroSubtitle,
    };
  }, [slug, overlay]);

  if (!config) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Collection not found</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <CollectionScreen config={config} collectionSlug={slug} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: fontSizes.md, color: '#64748b', marginBottom: spacing.md },
  emptyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
