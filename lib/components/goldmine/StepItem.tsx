import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  step: 1 | 2 | 3;
  title: string;
  description: string;
  isLast?: boolean;
};

const CIRCLE: Record<1 | 2 | 3, { bg: string; titleColor?: string }> = {
  1: { bg: '#0b1f48' },
  2: { bg: '#c9a227', titleColor: '#b8860b' },
  3: { bg: '#1a1a1a' },
};

export function StepItem({ step, title, description, isLast }: Props) {
  const c = CIRCLE[step];
  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View style={[styles.circle, { backgroundColor: c.bg }]}>
          <Text style={styles.circleText}>{step}</Text>
        </View>
        {!isLast ? <View style={styles.connector} /> : null}
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, c.titleColor ? { color: c.titleColor } : null]}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  track: { alignItems: 'center', width: 36 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  connector: {
    width: 2,
    height: 28,
    backgroundColor: '#d1d5db',
    marginVertical: 4,
  },
  textBlock: { flex: 1, paddingBottom: 18, paddingLeft: 8 },
  title: { fontSize: 14, fontWeight: '700', color: '#0b1f48', marginBottom: 4 },
  desc: { fontSize: 12, color: '#64748b', lineHeight: 17 },
});
