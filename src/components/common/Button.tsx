import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSizes } from '@/src/constants/theme';

type Props = TouchableOpacityProps & { label: string };

export function Button({ label, style, ...rest }: Props) {
  return (
    <TouchableOpacity style={[styles.button, style]} {...rest}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#ffffff', fontSize: fontSizes.md, fontWeight: '600' },
});

