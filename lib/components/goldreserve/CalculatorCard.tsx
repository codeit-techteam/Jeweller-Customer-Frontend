import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fmtInr, fmtInrDecimals } from '@/lib/components/goldreserve/formatInr';

const NAVY = '#001b33';
const GOLD = '#b8860b';

type Props = {
  amount: number;
  goldRatePerGram: number;
  min: number;
  max: number;
  step: number;
  onAmountChange: (n: number) => void;
};

export function CalculatorCard({
  amount,
  goldRatePerGram,
  min,
  max,
  step,
  onAmountChange,
}: Props) {
  const [draft, setDraft] = useState(String(amount));

  React.useEffect(() => {
    setDraft(String(amount));
  }, [amount]);

  const goldGrams = amount > 0 && goldRatePerGram > 0 ? amount / goldRatePerGram : 0;

  const applyCheck = () => {
    const raw = parseInt(draft.replace(/\D/g, ''), 10);
    if (Number.isNaN(raw)) return;
    const clamped = Math.min(max, Math.max(min, Math.round(raw / step) * step));
    onAmountChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Text style={styles.headTitle}>Gold Reserve Calculator</Text>
        <View style={styles.livePill}>
          <Text style={styles.livePillText}>LIVE RATE</Text>
        </View>
      </View>

      <Text style={styles.rateLine}>
        Today&apos;s Gold Rate (24kt):{' '}
        <Text style={styles.rateValue}>{fmtInrDecimals(goldRatePerGram, 2)} / gm</Text>
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={draft}
          onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ''))}
          onSubmitEditing={applyCheck}
        />
        <Pressable style={({ pressed }) => [styles.checkBtn, pressed && { opacity: 0.9 }]} onPress={applyCheck}>
          <Text style={styles.checkBtnText}>CHECK</Text>
        </Pressable>
      </View>

      <View style={styles.sliderLabels}>
        <Text style={styles.sliderEdge}>{min.toLocaleString('en-IN')}</Text>
        <Text style={styles.sliderEdge}>{max.toLocaleString('en-IN')}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={amount}
        onValueChange={onAmountChange}
        minimumTrackTintColor="#94a3b8"
        maximumTrackTintColor="#e2e8f0"
        thumbTintColor={NAVY}
      />

      <View style={styles.resultRow}>
        <View style={styles.payCard}>
          <Text style={styles.payLabel}>Your Payment</Text>
          <Text style={styles.payValue}>{fmtInr(amount)}</Text>
          <Text style={styles.paySub}>Per installment</Text>
        </View>
        <View style={styles.goldCard}>
          <Text style={styles.goldLabel}>Reserved Gold</Text>
          <Text style={styles.goldValue}>{goldGrams.toFixed(4)} gm</Text>
          <Text style={styles.goldSub}>Pure 24kt gold</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    shadowColor: '#001b33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headTitle: { fontSize: 16, fontWeight: '800', color: NAVY, flex: 1 },
  livePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  livePillText: { fontSize: 9, fontWeight: '800', color: '#64748b', letterSpacing: 0.6 },
  rateLine: { fontSize: 13, color: '#475569', marginBottom: 14 },
  rateValue: { color: GOLD, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '800',
    color: NAVY,
  },
  checkBtn: {
    backgroundColor: NAVY,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  checkBtnText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderEdge: { fontSize: 10, color: '#94a3b8' },
  slider: { width: '100%', height: 36, marginBottom: 16 },
  resultRow: { flexDirection: 'row', gap: 10 },
  payCard: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 14,
    padding: 14,
  },
  payLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  payValue: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  paySub: { fontSize: 10, color: 'rgba(255,255,255,0.65)' },
  goldCard: {
    flex: 1,
    backgroundColor: '#eef1f5',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  goldLabel: { fontSize: 11, color: '#64748b', marginBottom: 6 },
  goldValue: { fontSize: 18, fontWeight: '800', color: GOLD, marginBottom: 4 },
  goldSub: { fontSize: 10, color: '#64748b' },
});
