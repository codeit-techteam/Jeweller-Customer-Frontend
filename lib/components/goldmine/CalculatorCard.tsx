import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fmtInr } from '@/lib/components/goldmine/formatInr';

const NAVY = '#071a3a';
const GOLD = '#d4af37';
const NAVY_TEXT = '#0b1f48';

type Props = {
  amount: number;
  min: number;
  max: number;
  step: number;
  onAmountChange: (n: number) => void;
  onCheckSavings: () => void;
};

export function CalculatorCard({ amount, min, max, step, onAmountChange, onCheckSavings }: Props) {
  return (
    <View style={styles.outer}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Gold Mine Calculator</Text>
        <MaterialIcons name="calculate" size={22} color={GOLD} />
      </View>

      <View style={styles.inner}>
        <Text style={styles.label}>MONTHLY AMOUNT</Text>
        <Text style={styles.amountBig}>{fmtInr(amount)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={amount}
          onValueChange={onAmountChange}
          minimumTrackTintColor="#6b7280"
          maximumTrackTintColor="#374151"
          thumbTintColor="#9ca3af"
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }]}
        onPress={onCheckSavings}
      >
        <Text style={styles.ctaText}>CHECK SAVINGS</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: NAVY,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  inner: {
    marginHorizontal: 16,
    backgroundColor: '#050f24',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  label: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  amountBig: { fontSize: 28, fontWeight: '800', color: GOLD, marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  /** Full-bleed within navy card so it lines up cleanly with the summary card below */
  cta: {
    alignSelf: 'stretch',
    backgroundColor: GOLD,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 13, fontWeight: '800', color: NAVY_TEXT, letterSpacing: 0.5 },
});
