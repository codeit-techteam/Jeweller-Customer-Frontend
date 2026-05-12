import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';

export function ProfileSkeletonLoader() {
  return (
    <View style={styles.wrap}>
      <View style={styles.avatarWrap}>
        <ShimmerBlock width={108} height={108} borderRadius={54} />
        <ShimmerBlock width={160} height={16} style={styles.mt12} />
        <ShimmerBlock width={140} height={12} style={styles.mt8} />
      </View>
      <View style={styles.menu}>
        {Array.from({ length: 7 }).map((_, idx) => (
          <View key={`menu-skeleton-${idx}`} style={styles.row}>
            <ShimmerBlock width={22} height={22} borderRadius={11} />
            <ShimmerBlock width="72%" height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  mt12: { marginTop: 12 },
  mt8: { marginTop: 8 },
  menu: { gap: 12 },
  row: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
