import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import type { BoutiqueProductItemUi } from '@/lib/boutiques/boutiqueUi';

const CATEGORY_GOLD = '#C6A85B';

function formatPrice(price: number): string {
  return price.toLocaleString('en-IN');
}

type Props = {
  item: BoutiqueProductItemUi;
  width: number;
  onPress: () => void;
};

const shadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  android: {
    elevation: 3,
  },
  default: {},
});

/** Premium 2-col grid card — Figma: soft shadow, image top, gold category, title, ₹ en-IN. */
export function BoutiqueProductCard({ item, width, onPress }: Props) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.cardWrap, { width }, shadowStyle]}
    >
      <View style={styles.card}>
        <RemoteImage
          uri={item.imageUri}
          fallbackTint={item.imageTint}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.category}>
            {(item.categoryLabel ?? item.tag).toUpperCase()}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.price}>₹{formatPrice(item.price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  cardContent: {
    padding: 10,
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    color: CATEGORY_GOLD,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    lineHeight: 18,
  },
  price: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    marginTop: 4,
  },
});
