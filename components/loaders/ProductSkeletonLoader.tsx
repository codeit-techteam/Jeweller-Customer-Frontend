import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';

type Props = {
  count?: number;
};

export function ProductSkeletonLoader({ count = 6 }: Props) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={`skeleton-${index}`} style={styles.card}>
          <ShimmerBlock height={130} borderRadius={12} />
          <ShimmerBlock height={12} width="75%" style={styles.title} />
          <ShimmerBlock height={10} width="55%" style={styles.sub} />
          <ShimmerBlock height={14} width="45%" style={styles.price} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  title: { marginTop: 10 },
  sub: { marginTop: 8 },
  price: { marginTop: 10 },
});
