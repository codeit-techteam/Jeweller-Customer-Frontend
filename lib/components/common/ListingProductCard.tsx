import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { WISHLIST_HEART_ACTIVE, WISHLIST_HEART_INACTIVE } from '@/lib/constants/wishlistHeart';
import {
  formatBoutiqueMeta,
  safeBoutiqueRating,
} from '@/lib/utils/formatBoutiqueMeta';
import { fontSizes, spacing } from '@/src/constants/theme';

export type ListingProductCardItem = {
  id: string;
  name: string;
  price: string;
  imageUri: string;
  imageTint?: string;
  /**
   * Live boutique metadata pulled from the products ↔ boutiques relation.
   * When `boutiqueName` is present it renders as `Name · 4.8` and replaces
   * the legacy "VERIFIED BOUTIQUE" placeholder.
   */
  boutiqueName?: string | null;
  boutiqueRating?: number | null;
  boutiqueVerified?: boolean | null;
  /** Legacy fallbacks — kept so old callers keep compiling. Prefer the boutique fields above. */
  tag?: string;
  rating?: string;
};

type Props = {
  item: ListingProductCardItem;
  onPress: () => void;
  isWishlisted?: boolean;
  onWishlistPress?: () => void;
};

/**
 * Byte-for-byte structural match to `CollectionProductCard` (Wedding Collection)
 * — single `imageWrap` (overflow:hidden + position:relative) with:
 *   • image Pressable
 *   • optional tag badge (top-left)
 *   • heart Pressable (top-right, absolute)
 *
 * IMPORTANT: the heart uses a STATIC style object (not a function) because on
 * some Android/Expo Go builds, function-returned style arrays drop
 * `position: 'absolute'` during merge — which caused the heart to render as
 * a block element below the image on Trending/Rings.
 */
export function ListingProductCard({
  item,
  onPress,
  isWishlisted,
  onWishlistPress,
}: Props) {
  const hasBoutique =
    typeof item.boutiqueName === 'string' && item.boutiqueName.trim().length > 0;
  const fallbackRating = safeBoutiqueRating(
    item.rating != null ? Number(item.rating) : null,
  );
  const metaLine = hasBoutique
    ? formatBoutiqueMeta({
        name: item.boutiqueName,
        rating: item.boutiqueRating ?? null,
        verified: item.boutiqueVerified ?? false,
      })
    : `${item.tag ?? 'Partner Boutique'}${fallbackRating ? ` · ${fallbackRating}` : ''}`;
  const showWishlist = typeof onWishlistPress === 'function';

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Pressable style={styles.imagePress} onPress={onPress}>
          <RemoteImage
            uri={item.imageUri}
            fallbackTint={item.imageTint ?? '#2d2d2d'}
            style={styles.image}
          />
        </Pressable>

        {showWishlist ? (
          <Pressable
            style={styles.heartBtn}
            onPress={onWishlistPress}
            hitSlop={10}
            android_ripple={{ color: '#f3f4f6', borderless: true, radius: 20 }}
            accessibilityRole="button"
            accessibilityLabel={
              isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
            }
          >
            <MaterialIcons
              name={isWishlisted ? 'favorite' : 'favorite-border'}
              size={18}
              color={isWishlisted ? WISHLIST_HEART_ACTIVE : WISHLIST_HEART_INACTIVE}
            />
          </Pressable>
        ) : null}
      </View>

      <Pressable onPress={onPress}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {metaLine}
        </Text>
        <Text style={styles.details}>VIEW DETAILS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    marginBottom: 16,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: spacing.sm,
  },
  imagePress: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  heartBtn: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  name: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: '#1e1f23',
    marginTop: 4,
  },
  price: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#1e1f23',
    marginTop: 8,
  },
  meta: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: 0.2,
    marginTop: 8,
  },
  details: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#2b3451',
    textAlign: 'center',
  },
});
