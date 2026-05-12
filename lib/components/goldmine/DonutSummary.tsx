import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { fmtInr } from '@/lib/components/goldmine/formatInr';

const NAVY = '#0b1f48';
const GOLD = '#c9a227';

type Props = {
  totalPay: number;
  bonus: number;
  totalValue: number;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function annulusSector(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return '';
  const largeArc = sweep > 180 ? 1 : 0;
  const startOuter = polar(cx, cy, outerR, startAngle);
  const endOuter = polar(cx, cy, outerR, endAngle);
  const endInner = polar(cx, cy, innerR, endAngle);
  const startInner = polar(cx, cy, innerR, startAngle);
  return [
    'M',
    startOuter.x,
    startOuter.y,
    'A',
    outerR,
    outerR,
    0,
    largeArc,
    1,
    endOuter.x,
    endOuter.y,
    'L',
    endInner.x,
    endInner.y,
    'A',
    innerR,
    innerR,
    0,
    largeArc,
    0,
    startInner.x,
    startInner.y,
    'Z',
  ].join(' ');
}

/** Larger canvas + wider inner hole so "TOTAL VALUE" / ₹ amounts never touch the ring */
const SIZE = 176;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUT = 76;
const R_IN = 56;

export function DonutSummary({ totalPay, bonus, totalValue }: Props) {
  const { payFrac, discountPct } = useMemo(() => {
    const pf = totalValue > 0 ? totalPay / totalValue : 0;
    const dp = totalValue > 0 ? (bonus / totalValue) * 100 : 0;
    return { payFrac: pf, discountPct: dp };
  }, [totalPay, bonus, totalValue]);

  const sweepPay = payFrac * 360;
  const pathPay = annulusSector(CX, CY, R_IN, R_OUT, 0, sweepPay);
  const pathSave = annulusSector(CX, CY, R_IN, R_OUT, sweepPay, 360);

  return (
    <View style={styles.card}>
      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {pathPay ? <Path d={pathPay} fill={NAVY} /> : null}
          {pathSave ? <Path d={pathSave} fill={GOLD} /> : null}
        </Svg>
        <View style={styles.chartCenter} pointerEvents="none">
          <View style={styles.chartCenterInner}>
            <Text style={styles.centerLabel} numberOfLines={1}>
              TOTAL VALUE
            </Text>
            <Text
              style={styles.centerValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {fmtInr(totalValue)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: NAVY }]} />
        <Text style={styles.rowLabel}>You Pay (10 mo)</Text>
        <Text style={styles.rowAmt}>{fmtInr(totalPay)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: GOLD }]} />
        <Text style={styles.rowLabel}>You Save</Text>
        <Text style={styles.rowAmt}>{fmtInr(bonus)}</Text>
      </View>

      <View style={styles.discountRow}>
        <Text style={styles.discountLabel}>EFFECTIVE DISCOUNT</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{discountPct.toFixed(2)}% OFF</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    marginHorizontal: 16,
    shadowColor: '#0b1f48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  chartCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Inner hole is 2×R_IN; leave ~8px inset from ring so labels never touch the arc */
  chartCenterInner: {
    width: R_IN * 2 - 16,
    maxWidth: R_IN * 2 - 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  centerValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0b1f48',
    marginTop: 3,
    textAlign: 'center',
    width: '100%',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  rowLabel: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '600' },
  rowAmt: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#e2e8f0', marginVertical: 14 },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 4,
  },
  discountLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.6 },
  pill: {
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: { fontSize: 11, fontWeight: '800', color: '#0b1f48' },
});
