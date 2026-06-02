import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { CHECKOUT_GST_RATE, resolveCartLineDisplay } from '@/lib/services/mock/cart';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAuthGuard } from '@/src/hooks/useAuthGuard';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const NAVY = '#0D1B2A';
const LABEL = '#94a3b8';
const MUTED = '#64748b';
/** Muted surfaces (thumbnails, qty pill) */
const SURFACE_MUTED = '#F0F4F8';
const PAY_ACTIVE = '#111827';

export default function CartScreen() {
  const router = useRouter();
  const requireAuth = useAuthGuard();
  const items = useCartStore((s) => s.items);
  const setLineQty = useCartStore((s) => s.setLineQty);

  const lines = useMemo(() => items.map((line) => resolveCartLineDisplay(line)), [items]);

  const subtotal = useMemo(
    () => items.reduce((s, x) => s + x.price * x.qty, 0),
    [items],
  );
  const tax = useMemo(() => Math.round(subtotal * CHECKOUT_GST_RATE * 100) / 100, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const fmt = useCallback((n: number) => {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  const dec = (productId: string, size: string, metal: string, qty: number) => {
    setLineQty(productId, size, metal, qty - 1);
  };
  const inc = (productId: string, size: string, metal: string, qty: number) => {
    setLineQty(productId, size, metal, qty + 1);
  };

  const onCheckout = useCallback(() => {
    requireAuth(
      () => router.push('/(app)/address-details'),
      {
        pendingAction: { type: 'checkout' },
        analyticsEvent: 'checkout',
      },
    );
  }, [requireAuth, router]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <MaterialIcons name="shopping-bag" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add jewellery you love — it will appear here.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/(app)/trending')}>
            <Text style={styles.emptyBtnText}>Browse products</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screenBody}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerRule} />

        <ScrollView
          style={styles.scrollFlex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
        <Text style={styles.sectionEyebrow}>YOUR CART ({items.length})</Text>

        {lines.map((line) => (
          <View key={`${line.productId}-${line.size}-${line.metal}`} style={styles.cartCard}>
            <View style={styles.cartRow}>
              <View style={styles.thumbWrap}>
                <RemoteImage uri={line.imageUri} style={styles.thumb} />
              </View>
              <View style={styles.cartMeta}>
                <Text style={styles.prodSub}>{line.subtitle}</Text>
                <Text style={styles.prodPrice}>₹{fmt(line.price)}</Text>
                <Text style={styles.prodTitleMuted} numberOfLines={1}>
                  {line.name}
                </Text>
              </View>
            </View>
            <View style={styles.qtyRow}>
              <View style={styles.qtyPill}>
                <Pressable
                  hitSlop={8}
                  onPress={() => dec(line.productId, line.size, line.metal, line.qty)}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="remove" size={20} color="#111827" />
                </Pressable>
                <Text style={styles.qtyNum}>{line.qty}</Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => inc(line.productId, line.size, line.metal, line.qty)}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="add" size={20} color="#111827" />
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.summary}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Subtotal</Text>
            <Text style={styles.sumVal}>₹{fmt(subtotal)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Tax (GST)</Text>
            <Text style={styles.sumVal}>₹{fmt(tax)}</Text>
          </View>
          <View style={[styles.sumRow, styles.sumTotalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>₹{fmt(total)}</Text>
          </View>
        </View>

        <View style={styles.trustDivider} />
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <MaterialIcons name="verified" size={22} color={LABEL} />
            <Text style={styles.trustCap}>CERTIFIED</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialIcons name="local-shipping" size={22} color={LABEL} />
            <Text style={styles.trustCap}>INSURED</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialIcons name="assignment-return" size={22} color={LABEL} />
            <Text style={styles.trustCap}>30 DAY RETURNS</Text>
          </View>
        </View>
      </ScrollView>

        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutLabel}>Total</Text>
            <Text style={styles.checkoutTotal}>₹{fmt(total)}</Text>
          </View>
          <Pressable style={styles.checkoutBtn} onPress={onCheckout}>
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  screenBody: { flex: 1, backgroundColor: '#fff' },
  /** flexShrink keeps scroll area usable inside flex parent */
  scrollFlex: { flex: 1, flexShrink: 1, minHeight: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: NAVY },
  headerRule: {
    marginHorizontal: spacing.lg,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8eaed',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  sectionEyebrow: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 10,
    fontWeight: '800',
    color: LABEL,
    letterSpacing: 1,
  },
  cartCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaed',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cartRow: { flexDirection: 'row', alignItems: 'flex-start' },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: spacing.md,
    backgroundColor: SURFACE_MUTED,
  },
  thumb: { width: '100%', height: '100%' },
  cartMeta: { flex: 1, paddingTop: 2 },
  prodSub: { fontSize: fontSizes.sm, color: MUTED, lineHeight: 18 },
  prodPrice: { fontSize: fontSizes.md, fontWeight: '800', color: '#111827', marginTop: 6 },
  prodTitleMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: LABEL,
    marginTop: 6,
  },
  qtyRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: SURFACE_MUTED,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  qtyNum: { fontSize: fontSizes.md, fontWeight: '700', color: PAY_ACTIVE, minWidth: 24, textAlign: 'center' },
  summary: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eef2f6',
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sumLabel: { fontSize: fontSizes.sm, color: MUTED },
  sumVal: { fontSize: fontSizes.sm, fontWeight: '700', color: '#111827' },
  sumTotalRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eef2f6',
  },
  totalLabel: { fontSize: 22, fontWeight: '800', color: '#111827' },
  totalVal: { fontSize: 22, fontWeight: '800', color: '#111827' },
  trustDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8eaed',
    marginTop: spacing.lg,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
  },
  trustItem: { alignItems: 'center', flex: 1 },
  trustCap: {
    marginTop: 6,
    fontSize: 8,
    fontWeight: '800',
    color: LABEL,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyTitle: { marginTop: spacing.lg, fontSize: fontSizes.lg, fontWeight: '800', color: NAVY },
  emptySub: { marginTop: spacing.sm, fontSize: fontSizes.sm, color: MUTED, textAlign: 'center' },
  emptyBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
    backgroundColor: NAVY,
  },
  emptyBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSizes.sm },
  checkoutBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8eaed',
    backgroundColor: '#fff',
  },
  checkoutLabel: { fontSize: fontSizes.xs, color: MUTED, fontWeight: '600' },
  checkoutTotal: { fontSize: fontSizes.lg, fontWeight: '800', color: NAVY },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: NAVY,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
  },
  checkoutBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSizes.sm },
});
