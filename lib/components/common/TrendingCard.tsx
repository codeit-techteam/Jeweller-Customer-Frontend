import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { WISHLIST_HEART_ACTIVE, WISHLIST_HEART_INACTIVE } from '@/lib/constants/wishlistHeart';
import type { TrendingProduct } from '@/lib/services/mock/trending';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

type Props = {
  item: TrendingProduct;
  onPress: () => void;
  onWishlistPress: () => void;
  /** When omitted, heart stays outline (not recommended — prefer store-driven state). */
  isWishlisted?: boolean;
  onBadgePress?: (badge: string) => void;
};

export function TrendingCard({
  item,
  onPress,
  onWishlistPress,
  isWishlisted = false,
  onBadgePress,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.imageWrap}>
        <RemoteImage uri={item.imageUri} fallbackTint={item.imageTint} style={styles.image} />
        {item.badge ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={6}
            onPress={() => item.badge && onBadgePress?.(item.badge)}
            style={styles.badge}
            disabled={!onBadgePress}
          >
            <Text style={styles.badgeText}>{item.badge}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onWishlistPress}
          style={styles.heartBtn}
        >
          <MaterialIcons
            name={isWishlisted ? 'favorite' : 'favorite-border'}
            size={16}
            color={isWishlisted ? WISHLIST_HEART_ACTIVE : WISHLIST_HEART_INACTIVE}
          />
        </Pressable>
      </View>
      <Text style={styles.productTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.price}>{item.price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.92,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    height: 150,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    left: spacing.xs,
    top: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.3,
  },
  heartBtn: {
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  productTitle: {
    marginTop: 8,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
  },
  desc: {
    marginTop: 8,
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
  },
  price: {
    marginTop: 8,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#0f172a',
  },
});
