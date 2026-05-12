import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, spacing, fontSizes } from '@/src/constants/theme';

type Props = ViewProps & { name: string; priceLabel: string };

export function ProductCard({ name, priceLabel, style, ...rest }: Props) {
  return (
    <View style={[styles.card, style]} {...rest}>
      <View style={styles.imagePlaceholder} />
      <Text style={styles.name} numberOfLines={2}>{name}</Text>
      <Text style={styles.price}>{priceLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  imagePlaceholder: { width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.border, marginBottom: spacing.sm },
  name: { fontSize: fontSizes.md, color: colors.text, marginBottom: spacing.xs },
  price: { fontSize: fontSizes.md, color: colors.primary, fontWeight: '600' },
});

