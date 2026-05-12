import React, { useCallback } from 'react';
import {
  FlatList,
  type ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import type { ProductDetail } from '@/lib/services/catalogApi';
import { formatBoutiqueMeta } from '@/lib/utils/formatBoutiqueMeta';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

type Props = {
  title?: string;
  items: ProductDetail[];
  onSelect: (id: string) => void;
  onViewAll?: () => void;
};

const CARD_WIDTH = 140;
const CARD_GAP = 12;
const IMAGE_HEIGHT = 120;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

type CardProps = {
  product: ProductDetail;
  onPress: (id: string) => void;
};

function SimilarProductCard({ product, onPress }: CardProps) {
  const handlePress = useCallback(() => onPress(product.id), [onPress, product.id]);
  const boutiqueLine = product.boutique?.name
    ? formatBoutiqueMeta({
        name: product.boutique.name,
        rating: product.boutique.rating ?? null,
        verified: product.boutique.verified ?? false,
      })
    : product.metal;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
    >
      <View style={styles.imageWrap}>
        <RemoteImage
          uri={product.images[0]?.uri}
          fallbackTint={product.images[0]?.tint ?? '#e5e7eb'}
          style={styles.image}
        />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>₹{product.price.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {boutiqueLine}
      </Text>
    </Pressable>
  );
}

export function RelatedProducts({ title = 'Similar Pieces', items, onSelect, onViewAll }: Props) {
  const renderItem: ListRenderItem<ProductDetail> = useCallback(
    ({ item }) => <SimilarProductCard product={item} onPress={onSelect} />,
    [onSelect],
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>{title}</Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={{ width: CARD_GAP }} />;
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md - 2,
  },
  heading: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  viewAll: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: CARD_WIDTH,
  },
  cardPressed: {
    opacity: 0.9,
  },
  imageWrap: {
    width: '100%',
    height: IMAGE_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  priceText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: '#111827',
  },
  title: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#777777',
  },
});
