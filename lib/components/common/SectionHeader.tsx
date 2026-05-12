import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSizes, spacing } from '@/src/constants/theme';

type Props = {
  eyebrow: string;
  title: string;
  body: string;
  onEyebrowPress?: () => void;
};

export function SectionHeader({ eyebrow, title, body, onEyebrowPress }: Props) {
  return (
    <View style={styles.wrap}>
      {onEyebrowPress ? (
        <Pressable onPress={onEyebrowPress} hitSlop={8}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </Pressable>
      ) : (
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: '#6b7280',
  },
  title: {
    marginTop: spacing.sm,
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body: {
    marginTop: spacing.md,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    color: '#64748b',
  },
});
