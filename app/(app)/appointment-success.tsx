import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#0f172a';
const GOLD = '#b8860b';
const MUTED = '#64748b';
const LINE = '#e8ecf0';

function paramStr(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function AppointmentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    boutiqueName?: string | string[];
    date?: string | string[];
    time?: string | string[];
    type?: string | string[];
  }>();

  const boutiqueName = useMemo(() => paramStr(params.boutiqueName), [params.boutiqueName]);
  const date = useMemo(() => paramStr(params.date), [params.date]);
  const time = useMemo(() => paramStr(params.time), [params.time]);
  const type = useMemo(() => paramStr(params.type), [params.type]);

  const dateTimeLine = [date, time].filter(Boolean).join(' • ');

  const goHome = () => {
    router.replace('/(app)/home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable hitSlop={14} onPress={goHome} accessibilityRole="button" accessibilityLabel="Close">
          <MaterialIcons name="close" size={26} color="#374151" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.checkWrap}>
          <View style={styles.checkCircle}>
            <MaterialIcons name="check" size={40} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.subtitle}>Your appointment has been successfully booked.</Text>
        <Text style={styles.chooseLine}>
          Thank you for choosing{' '}
          <Text style={styles.chooseBold}>
            {boutiqueName || 'our boutique'}
            {boutiqueName ? '.' : ''}
          </Text>
        </Text>

        <View style={styles.quoteBlock}>
          <View style={styles.quoteLine} />
          <MaterialIcons name="format-quote" size={28} color={GOLD} style={styles.quoteIcon} />
          <Text style={styles.quoteText}>
            {"Every piece of jewellery tells a story — we're glad to be part of yours."}
          </Text>
          <View style={styles.quoteLine} />
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.iconSq}>
              <MaterialIcons name="storefront" size={22} color={NAVY} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>BOUTIQUE</Text>
              <Text style={styles.detailValue}>{boutiqueName || '—'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={[styles.iconSq, styles.iconSqWide]}>
              <View style={styles.iconSqPair}>
                <MaterialIcons name="event" size={19} color={NAVY} />
                <MaterialIcons name="access-time" size={19} color={NAVY} />
              </View>
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>DATE & TIME</Text>
              <Text style={styles.detailValue}>{dateTimeLine || '—'}</Text>
            </View>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <View style={styles.iconSq}>
              <MaterialIcons name="label" size={22} color={NAVY} />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>TYPE</Text>
              <Text style={styles.detailValue}>{type || '—'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapWrap}>
          <View style={styles.mapPlaceholder}>
            <MaterialIcons name="map" size={36} color="#94a3b8" />
            <Text style={styles.mapHint}>Location preview</Text>
          </View>
        </View>

        <Pressable style={styles.cta} onPress={goHome}>
          <Text style={styles.ctaText}>Continue Exploring</Text>
        </Pressable>

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  checkWrap: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  chooseLine: {
    marginTop: spacing.lg,
    fontSize: fontSizes.sm,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  chooseBold: { fontWeight: '700', color: NAVY },
  quoteBlock: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  quoteLine: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginVertical: spacing.md,
  },
  quoteIcon: { marginBottom: spacing.xs, opacity: 0.95 },
  quoteText: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  detailCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  detailRowLast: { marginBottom: 0 },
  iconSq: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSqWide: { width: 52 },
  iconSqPair: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailTextCol: { flex: 1 },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  detailValue: { fontSize: fontSizes.md, fontWeight: '700', color: NAVY },
  mapWrap: { width: '100%', marginTop: spacing.xl, marginBottom: spacing.lg },
  mapPlaceholder: {
    height: 148,
    borderRadius: 16,
    backgroundColor: '#e8eaed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mapHint: { marginTop: spacing.xs, fontSize: fontSizes.xs, color: '#94a3b8' },
  cta: {
    width: '100%',
    backgroundColor: NAVY,
    paddingVertical: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ctaText: { fontSize: fontSizes.md, fontWeight: '700', color: '#fff' },
});
