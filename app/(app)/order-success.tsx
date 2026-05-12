import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { MAP_PLACEHOLDER_URI } from '@/lib/services/mock/imageUrls';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#0d1b2a';
const LABEL = '#8d99ae';
const MUTED = '#64748b';
const GOLD_RING = '#d4b896';
const CREAM = '#faf8f4';
const GOLD_ICON = '#c9a227';
const LINE = '#e8ecf0';

function paramStr(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? raw[0] : raw;
}

const DEFAULT_ORDER_ID = '#JW-882910-24';
const DEFAULT_ESTIMATED = '24th Oct - 26th Oct';
const DEFAULT_ADDRESS =
  '1167 Kucha Mahajani, Chandni Chowk, New Delhi, Delhi 110006';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string | string[];
    estimatedDelivery?: string | string[];
    address?: string | string[];
    total?: string | string[];
  }>();

  const orderId = useMemo(() => paramStr(params.orderId) || DEFAULT_ORDER_ID, [params.orderId]);
  const estimatedDelivery = useMemo(
    () => paramStr(params.estimatedDelivery) || DEFAULT_ESTIMATED,
    [params.estimatedDelivery],
  );
  const address = useMemo(() => paramStr(params.address) || DEFAULT_ADDRESS, [params.address]);
  const goHome = () => {
    router.replace('/(app)/home');
  };

  const onViewOrder = () => {
    console.log('[OrderSuccess] view order', orderId);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.topSlot}>
          <Pressable hitSlop={14} onPress={goHome} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialIcons name="close" size={26} color="#111" />
          </Pressable>
        </View>
        <View style={styles.topCenter}>
          <Text style={styles.headerTitle}>Confirmation</Text>
        </View>
        <View style={styles.topSlot} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.iconSection}>
          <View style={styles.iconOuterRing}>
            <View style={styles.iconCream}>
              <View style={styles.iconNavy}>
                <MaterialIcons name="check" size={32} color="#fff" />
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.mainTitle}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>Your jewellery is being prepared with care.</Text>

        <View style={styles.rule} />
        <Text style={styles.quote}>
          {'\u201c'}Jewellery is more than an accessory, it\u2019s a story you wear.{'\u201d'}
        </Text>
        <View style={styles.rule} />

        <View style={styles.card}>
          <View style={[styles.cardRow, styles.cardRowBorder]}>
            <Text style={styles.cardLabel}>ORDER ID</Text>
            <Text style={styles.cardValue}>{orderId.startsWith('#') ? orderId : `#${orderId}`}</Text>
          </View>
          <View style={[styles.cardRow, styles.cardRowBorder]}>
            <Text style={styles.cardLabel}>ESTIMATED DELIVERY</Text>
            <View style={styles.cardValueRow}>
              <MaterialIcons name="event" size={18} color={GOLD_ICON} style={styles.inlineIcon} />
              <Text style={[styles.cardValue, styles.cardValueFlex]}>{estimatedDelivery}</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>DELIVERY ADDRESS</Text>
            <View style={styles.cardValueRow}>
              <MaterialIcons name="location-on" size={18} color={GOLD_ICON} style={styles.pinIcon} />
              <Text style={[styles.cardValue, styles.cardValueMultiline, styles.cardValueFlex]}>{address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.mapWrap}>
          <View style={styles.mapPlaceholder}>
            <RemoteImage uri={MAP_PLACEHOLDER_URI} fallbackTint="#e8eaed" style={StyleSheet.absoluteFillObject} />
            <View style={styles.mapPlaceholderOverlay} pointerEvents="none">
              <MaterialIcons name="map" size={36} color="#94a3b8" />
              <Text style={styles.mapHint}>Location preview</Text>
            </View>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={goHome}>
          <Text style={styles.primaryBtnText}>CONTINUE SHOPPING</Text>
        </Pressable>

        <Pressable onPress={onViewOrder} style={styles.secondaryWrap}>
          <Text style={styles.secondaryText}>View Order</Text>
        </Pressable>

        <View style={styles.footerDecor}>
          <View style={styles.decorLine} />
          <Text style={[styles.decorDiamond, styles.decorSpacer]}>✦</Text>
          <View style={styles.decorLine} />
        </View>
        <Text style={styles.footerCap}>THANK YOU FOR CHOOSING LUXURY</Text>

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topSlot: { width: 40, alignItems: 'flex-start' },
  topCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: NAVY,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconSection: { marginTop: spacing.sm, marginBottom: spacing.lg },
  iconOuterRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: GOLD_RING,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  iconCream: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconNavy: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  rule: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginVertical: spacing.md,
  },
  quote: {
    fontSize: fontSizes.sm,
    fontWeight: '400',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
    paddingHorizontal: spacing.sm,
  },
  card: {
    width: '100%',
    marginTop: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eef1f5',
    overflow: 'hidden',
  },
  cardRow: { padding: spacing.lg },
  cardRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: LINE,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: LABEL,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: NAVY,
  },
  cardValueMultiline: { flex: 1, fontWeight: '700', lineHeight: 22 },
  cardValueRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardValueFlex: { flex: 1 },
  inlineIcon: { marginTop: 2, marginRight: 6 },
  pinIcon: { marginTop: 2, marginRight: 6 },
  mapWrap: { width: '100%', marginTop: spacing.lg, marginBottom: spacing.lg },
  mapPlaceholder: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e8eaed',
  },
  mapPlaceholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  mapHint: { marginTop: spacing.xs, fontSize: fontSizes.xs, color: '#475569' },
  primaryBtn: {
    width: '100%',
    backgroundColor: NAVY,
    paddingVertical: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pressed: { opacity: 0.9 },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: fontSizes.sm,
    letterSpacing: 1,
  },
  secondaryWrap: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  secondaryText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: NAVY,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  footerDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  decorLine: {
    width: 48,
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
  },
  decorDiamond: { fontSize: 12, color: LABEL },
  decorSpacer: { marginHorizontal: spacing.sm },
  footerCap: {
    fontSize: 9,
    fontWeight: '800',
    color: LABEL,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
