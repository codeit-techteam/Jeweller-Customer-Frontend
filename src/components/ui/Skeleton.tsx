import React from 'react';
import { View, StyleSheet, ViewProps, type DimensionValue } from 'react-native';
import { colors, radius } from '@/src/constants/theme';

type Props = ViewProps & { width?: DimensionValue; height?: number; rounded?: boolean };

export function Skeleton({ width = '100%', height = 16, rounded = false, style, ...rest }: Props) {
  return (
    <View
      style={[styles.base, { width, height, borderRadius: rounded ? radius.full : radius.sm }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.border, overflow: 'hidden' },
});

