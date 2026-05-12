import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { WISHLIST_HEART_ACTIVE, WISHLIST_HEART_INACTIVE } from '@/lib/constants/wishlistHeart';
import { formatBoutiqueMeta } from '@/lib/utils/formatBoutiqueMeta';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

export type CollectionProductCardItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tag?: string;
  /** Linked boutique info (from products ↔ boutiques relation). */
  boutiqueName?: string | null;
  boutiqueRating?: number | null;
  boutiqueVerified?: boolean | null;
};

type Props = {
  item: CollectionProductCardItem;
  width: number;
  wishlisted: boolean;
  onPress: () => void;
  onToggleWishlist: () => void;
};

export function CollectionProductCard({
  item,
  width,
  wishlisted,
  onPress,
  onToggleWishlist,
}: Props) {
  const priceLabel = `₹ ${item.price.toLocaleString('en-IN')}`;
  const hasBoutique =
    typeof item.boutiqueName === 'string' && item.boutiqueName.trim().length > 0;
  const boutiqueLine = hasBoutique
    ? formatBoutiqueMeta({
        name: item.boutiqueName,
        rating: item.boutiqueRating ?? null,
        verified: item.boutiqueVerified ?? false,
      })
    : null;

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.imageWrap}>
        <Pressable style={styles.imagePress} onPress={onPress}>
          <RemoteImage uri={item.image} fallbackTint="#1f2937" style={styles.image} />
        </Pressable>
        {item.tag ? (
          <View style={styles.tag} pointerEvents="none">
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        ) : null}
        <Pressable style={styles.heartBtn} onPress={onToggleWishlist} hitSlop={8}>
          <MaterialIcons
            name={wishlisted ? 'favorite' : 'favorite-border'}
            size={18}
            color={wishlisted ? WISHLIST_HEART_ACTIVE : WISHLIST_HEART_INACTIVE}
          />
        </Pressable>
      </View>
      <Pressable onPress={onPress}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.price}>{priceLabel}</Text>
        {boutiqueLine ? (
          <Text style={styles.boutiqueMeta} numberOfLines={1}>
            {boutiqueLine}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  imageWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  imagePress: {
    width: '100%',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
  },
  tag: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    backgroundColor: '#0f172a',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  tagText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heartBtn: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  desc: {
    marginTop: 4,
    fontSize: fontSizes.xs,
    color: '#64748b',
    lineHeight: 16,
  },
  price: {
    marginTop: spacing.sm,
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#111827',
  },
  boutiqueMeta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: 0.2,
  },
});
