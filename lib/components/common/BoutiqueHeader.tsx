import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#0a1a33';

type Props = {
  title?: string;
  onBack: () => void;
  shareMessage?: string;
};

export function BoutiqueHeader({ title = 'BOUTIQUE PROFILE', onBack, shareMessage = 'The Atelier — Boutique' }: Props) {
  const onShare = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" hitSlop={12} onPress={onBack} style={styles.side}>
        <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Pressable accessibilityRole="button" hitSlop={12} onPress={onShare} style={[styles.side, styles.sideRight]}>
        <MaterialIcons name="share" size={22} color={NAVY} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8eaed',
  },
  side: { width: 40, alignItems: 'flex-start' },
  sideRight: { alignItems: 'flex-end' },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: NAVY,
  },
});
