import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { MAP_PLACEHOLDER_URI } from '@/lib/services/mock/imageUrls';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#1e293b';
const LABEL = '#9ca3af';
const MUTED = '#64748b';
const CARD_BG = '#f8f9fa';
const LINE = '#e5e7eb';

function paramStr(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function AppointmentBookedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    boutiqueName?: string | string[];
    boutiqueId?: string | string[];
    date?: string | string[];
    time?: string | string[];
    address?: string | string[];
  }>();

  const boutiqueName = useMemo(() => paramStr(params.boutiqueName), [params.boutiqueName]);
  const boutiqueId = useMemo(() => paramStr(params.boutiqueId), [params.boutiqueId]);
  const date = useMemo(() => paramStr(params.date), [params.date]);
  const time = useMemo(() => paramStr(params.time), [params.time]);
  const address = useMemo(() => paramStr(params.address), [params.address]);

  const dateTimeLine = [date, time].filter(Boolean).join(', ');

  const goHome = () => {
    router.replace('/(app)/home');
  };

  const viewBoutique = () => {
    if (boutiqueId) {
      router.push({ pathname: '/(app)/boutique-profile', params: { id: boutiqueId } });
    } else {
      router.push({ pathname: '/(app)/boutique-profile', params: { name: boutiqueName } });
    }
  };

  const reschedule = () => {
    console.log('Reschedule appointment');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={styles.headerSlot}>
          <Pressable hitSlop={14} onPress={goHome} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialIcons name="close" size={26} color="#374151" />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CONFIRMATION</Text>
        </View>
        <View style={styles.headerSlot} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="event-available" size={36} color={NAVY} />
          </View>
        </View>

        <Text style={styles.mainTitle}>Appointment Booked</Text>
        <Text style={styles.subtitle}>Your visit to the boutique has been scheduled successfully.</Text>

        <View style={styles.card}>
          <View style={styles.cardInner}>
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
              <View style={styles.iconSq}>
                <MaterialIcons name="access-time" size={22} color={NAVY} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>DATE & TIME</Text>
                <Text style={styles.detailValue}>{dateTimeLine || '—'}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <View style={styles.iconSq}>
                <MaterialIcons name="location-on" size={22} color={NAVY} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>ADDRESS</Text>
                <Text style={styles.detailValue}>{address || '—'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.mapBlock}>
            <RemoteImage uri={MAP_PLACEHOLDER_URI} fallbackTint="#e8eaed" style={StyleSheet.absoluteFillObject} />
            <View style={styles.mapBlockOverlay} pointerEvents="none">
              <MaterialIcons name="map" size={32} color="#94a3b8" />
              <Text style={styles.mapHint}>Map preview</Text>
            </View>
          </View>
        </View>

        <Text style={styles.quoteText}>“A perfect piece deserves a perfect moment.”</Text>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          onPress={viewBoutique}
        >
          <MaterialIcons name="explore" size={20} color={NAVY} />
          <Text style={styles.primaryBtnText}>View Boutique</Text>
        </Pressable>

        <Pressable onPress={reschedule} hitSlop={12}>
          <Text style={styles.linkText}>Reschedule Appointment</Text>
        </Pressable>

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  headerSlot: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: LABEL,
    letterSpacing: 1.2,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontWeight: '400',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
  },
  cardInner: { padding: spacing.lg, paddingBottom: spacing.md },
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaed',
  },
  detailTextCol: { flex: 1, paddingTop: 2 },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: LABEL,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: NAVY,
    lineHeight: 22,
  },
  mapBlock: {
    height: 132,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#e8eaed',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
  mapBlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  mapHint: { marginTop: spacing.xs, fontSize: fontSizes.xs, color: '#475569' },
  quoteText: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    fontWeight: '500',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#fff',
    paddingVertical: spacing.lg,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: NAVY,
    marginBottom: spacing.lg,
  },
  primaryBtnPressed: { opacity: 0.85 },
  primaryBtnText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: NAVY,
  },
  linkText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
});
