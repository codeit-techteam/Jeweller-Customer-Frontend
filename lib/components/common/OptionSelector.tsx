import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSizes, radius, spacing } from '@/src/constants/theme';

type Props = {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
};

export function OptionSelector({ label, options, selected, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const on = selected === o;
          return (
            <Pressable
              key={o}
              onPress={() => onSelect(o)}
              style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.chipPressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  label: { fontSize: fontSizes.xs, fontWeight: '700', color: '#374151', letterSpacing: 0.6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  chipOn: { borderColor: '#1e3a5f', backgroundColor: '#eff6ff' },
  chipPressed: { opacity: 0.85 },
  chipText: { fontSize: fontSizes.sm, color: '#374151', fontWeight: '500' },
  chipTextOn: { color: '#1e3a5f', fontWeight: '700' },
});
