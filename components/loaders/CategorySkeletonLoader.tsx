import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';

export function CategorySkeletonLoader({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, idx) => (
        <View key={`category-skeleton-${idx}`} style={styles.item}>
          <ShimmerBlock width={64} height={64} borderRadius={32} />
          <ShimmerBlock width={70} height={10} style={styles.mt8} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  item: { alignItems: 'center', width: 80 },
  mt8: { marginTop: 8 },
});
