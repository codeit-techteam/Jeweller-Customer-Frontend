import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';

import { fontSizes, spacing } from '@/src/constants/theme';

type Props = {
  imageUri: string;
  label: string;
  title: string;
  subtitle: string;
};

export function CollectionHero({ imageUri, label, title, subtitle }: Props) {
  return (
    <ImageBackground source={{ uri: imageUri }} style={styles.hero} resizeMode="cover">
      <View style={styles.overlayTop} pointerEvents="none" />
      <View style={styles.overlayBottom} pointerEvents="none" />
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    minHeight: 280,
    justifyContent: 'flex-end',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '72%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  textBlock: {
    zIndex: 2,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl,
  },
  label: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: fontSizes.sm,
    lineHeight: 20,
    maxWidth: 340,
  },
});
