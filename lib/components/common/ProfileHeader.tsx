import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#1a2b3c';

type ProfileHeaderProps = {
  title?: string;
  onBack: () => void;
  onSettings: () => void;
};

export function ProfileHeader({ title = 'PROFILE', onBack, onSettings }: ProfileHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.slot}>
        <Pressable hitSlop={12} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back-ios" size={22} color="#111" />
        </Pressable>
      </View>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={[styles.slot, styles.slotRight]}>
        <Pressable hitSlop={12} onPress={onSettings} accessibilityRole="button" accessibilityLabel="Settings">
          <MaterialIcons name="settings" size={24} color="#111" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  slot: { width: 44, justifyContent: 'center' },
  slotRight: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 1,
  },
});
