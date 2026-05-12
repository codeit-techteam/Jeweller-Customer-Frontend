import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { WISHLIST_HEART_ACTIVE, WISHLIST_HEART_INACTIVE } from '@/lib/constants/wishlistHeart';
import type { SearchSpotlightProduct } from '@/lib/services/mock/search';
import { fontSizes, spacing } from '@/src/constants/theme';

type Props = {
  product: SearchSpotlightProduct;
  onPress: () => void;
  onWishlistPress: () => void;
  cardWidth: number;
  /** When true, heart renders filled red (wishlisted). */
  isWishlisted?: boolean;
};

export function ProductCard({ product, onPress, onWishlistPress, cardWidth, isWishlisted }: Props) {
  const onShare = async () => {
    try {
      await Share.share({
        message: `${product.title} — ${product.price}`,
        title: product.title,
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={styles.imageShadow}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.imageWrap, pressed && styles.pressed]}
        >
          <RemoteImage uri={product.imageUri} fallbackTint={product.imageTint} style={styles.image} />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.35)']}
            locations={[0.55, 1]}
            style={styles.gradient}
            pointerEvents="none"
          />
          <View style={styles.pricePill} pointerEvents="none">
            <Text style={styles.pricePillText}>{product.price}</Text>
          </View>
        </Pressable>

        <View style={styles.iconRow}>
          <Pressable
            accessibilityLabel="Share"
            hitSlop={10}
            onPress={onShare}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
          >
            <MaterialIcons name="share" size={15} color="#374151" />
          </Pressable>
          <Pressable
            accessibilityLabel="Wishlist"
            hitSlop={10}
            onPress={onWishlistPress}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconPressed]}
          >
            <MaterialIcons
              name={isWishlisted ? 'favorite' : 'favorite-border'}
              size={15}
              color={isWishlisted ? WISHLIST_HEART_ACTIVE : WISHLIST_HEART_INACTIVE}
            />
          </Pressable>
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {product.description}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: spacing.md,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.98 }],
  },
  imageShadow: {
    borderRadius: 18,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  imageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 0.9,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  pricePill: {
    position: 'absolute',
    zIndex: 1,
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  pricePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.2,
  },
  iconRow: {
    position: 'absolute',
    zIndex: 2,
    right: 10,
    top: 10,
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  iconPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.92 }],
  },
  title: {
    marginTop: spacing.md,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    lineHeight: 19,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    letterSpacing: 0.2,
  },
});
