import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { pushCollection } from '@/lib/navigation/collectionNavigation';
import { colors, fontSizes, radius, spacing } from '@/src/constants/theme';

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#0B1B2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  android: { elevation: 6 },
  default: {},
});

export type CollectionExploreCardProps = {
  title: string;
  subtitle: string;
  imageUri: string;
  /** Passed to `/(app)/collection/[slug]` */
  slug: string;
};

/**
 * Shared “Explore Collection” tile — full card tappable (Home, Categories, Occasions).
 */
export function CollectionExploreCard({ title, subtitle, imageUri, slug }: CollectionExploreCardProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardW = Math.min(300, Math.max(172, width * 0.54));

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={[styles.collectionCard, CARD_SHADOW, { width: cardW }]}
      onPress={() => pushCollection(router, slug)}
    >
      <RemoteImage uri={imageUri} fallbackTint="#e8e4dc" style={styles.collectionImage} />
      <Text style={styles.collectionTitle} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.collectionSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  collectionCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg + 4,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(11, 27, 43, 0.06)',
  },
  collectionImage: {
    width: '100%',
    height: 136,
    borderRadius: radius.md + 4,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  collectionTitle: { fontSize: fontSizes.lg, fontWeight: '700', color: '#0B1B2B', letterSpacing: -0.2 },
  collectionSubtitle: { marginTop: 4, fontSize: fontSizes.sm, color: '#64748B', fontWeight: '500' },
});
