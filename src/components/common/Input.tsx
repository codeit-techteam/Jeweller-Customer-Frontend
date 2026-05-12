import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSizes } from '@/src/constants/theme';

export function Input({ style, ...rest }: TextInputProps) {
  return <TextInput style={[styles.input, style]} placeholderTextColor={colors.mutedText} {...rest} />;
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: fontSizes.md, color: colors.text },
});

