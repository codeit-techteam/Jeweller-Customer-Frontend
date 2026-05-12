import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';

export function BoutiqueSkeletonLoader({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={`boutique-skeleton-${idx}`} style={styles.card}>
          <ShimmerBlock width={72} height={72} borderRadius={12} />
          <View style={styles.meta}>
            <ShimmerBlock height={14} width="70%" />
            <ShimmerBlock height={11} width="45%" style={styles.mt8} />
            <ShimmerBlock height={11} width="60%" style={styles.mt8} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  meta: { flex: 1, justifyContent: 'center' },
  mt8: { marginTop: 8 },
});
