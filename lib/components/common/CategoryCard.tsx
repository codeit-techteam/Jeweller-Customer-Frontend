import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import type { CategoryIconItem } from '@/lib/services/mock/search';
import { spacing } from '@/src/constants/theme';

type Props = {
  item: CategoryIconItem;
  onPress: () => void;
  size?: number;
};

export function CategoryCard({ item, onPress, size = 72 }: Props) {
  const radius = size / 2;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: radius,
          },
        ]}
      >
        <RemoteImage
          uri={item.imageUri?.trim() || undefined}
          placeholder="category"
          fallbackTint="#f5f0e6"
          style={[StyleSheet.absoluteFillObject, { borderRadius: radius }]}
        />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  circle: {
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  label: {
    marginTop: spacing.sm,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#111827',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
