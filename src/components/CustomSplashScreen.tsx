import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, spacing, radius, fontSizes } from '@/src/constants/theme';

type Props = { onFinish: () => void };

export function CustomSplashScreen({ onFinish }: Props) {
  useEffect(() => {
    const timeout = setTimeout(onFinish, 2000);
    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.iconWrapperOuter}>
          <View style={styles.iconWrapperInner}>
            <Text style={styles.iconText}>◆</Text>
          </View>
        </View>
        <Text style={styles.brand}>LUXE</Text>
        <View style={styles.separator} />
        <Text style={styles.tagline}>HANDCRAFTED ELEGANCE</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>POWERED BY MODERN CRAFTSMANSHIP</Text>
        <Text style={styles.footerSubText}>EST. 2024</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl, paddingVertical: spacing['2xl'], justifyContent: 'space-between' },
  centerContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  iconWrapperOuter: { padding: spacing.xs, borderRadius: radius.full, backgroundColor: '#f9fafb', marginBottom: spacing.lg },
  iconWrapperInner: { width: 80, height: 80, borderRadius: radius.full, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.background, fontSize: 32 },
  brand: { marginTop: spacing.lg, letterSpacing: 8, fontSize: fontSizes['2xl'], fontWeight: '800', color: colors.text },
  separator: { width: 40, height: 2, backgroundColor: colors.secondary, marginTop: spacing.lg },
  tagline: { marginTop: spacing.lg, letterSpacing: 4, fontSize: fontSizes.sm, color: colors.mutedText },
  footer: { alignItems: 'center' },
  footerText: { letterSpacing: 2, fontSize: 10, color: colors.mutedText },
  footerSubText: { marginTop: spacing.xs, letterSpacing: 3, fontSize: 10, color: colors.mutedText },
});

