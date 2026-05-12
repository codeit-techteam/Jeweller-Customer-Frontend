import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing, fontSizes } from '@/src/constants/theme';

type Props = ViewProps & { title: string; subtitle?: string };

export function Header({ title, subtitle, style, children, ...rest }: Props) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  textContainer: { flex: 1 },
  title: { fontSize: fontSizes.xl, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: spacing.xs, fontSize: fontSizes.sm, color: colors.mutedText },
});

