import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  step: 1 | 2 | 3;
  title: string;
  description: string;
  isLast?: boolean;
};

const BLACK = '#111827';
const GOLD = '#c9a227';

const CIRCLE: Record<1 | 2 | 3, string> = {
  1: BLACK,
  2: GOLD,
  3: BLACK,
};

export function StepItem({ step, title, description, isLast }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View style={[styles.circle, { backgroundColor: CIRCLE[step] }]}>
          <Text style={styles.circleText}>{step}</Text>
        </View>
        {!isLast ? <View style={styles.connector} /> : null}
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
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
  title: { fontSize: 14, fontWeight: '700', color: '#001b33', marginBottom: 4 },
  desc: { fontSize: 12, color: '#64748b', lineHeight: 17 },
});
