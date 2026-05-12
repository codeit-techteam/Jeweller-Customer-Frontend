import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import {
  CHECKOUT_GST_RATE,
  mockDeliveryAddress,
  resolveCartLineDisplay,
} from '@/lib/services/mock/cart';
import { useCartStore } from '@/lib/stores/cartStore';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const NAVY = '#0D1B2A';
const LABEL = '#94a3b8';
const MUTED = '#64748b';
const GREEN = '#16a34a';
/** Figma: inactive payment / stepper surface */
const SURFACE_MUTED = '#F0F4F8';
const PAY_INACTIVE_ICON = '#94a3b8';
const PAY_INACTIVE_LABEL = '#64748b';
const PAY_ACTIVE = '#111827';
type PaymentId = 'card' | 'upi' | 'netbanking';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const setLineQty = useCartStore((s) => s.setLineQty);
  const clearCart = useCartStore((s) => s.clear);
  const [payment, setPayment] = useState<PaymentId>('card');

  const lines = useMemo(() => items.map((line) => resolveCartLineDisplay(line)), [items]);

  const subtotal = useMemo(
    () => items.reduce((s, x) => s + x.price * x.qty, 0),
    [items],
  );
  const shipping = 0;
  const tax = useMemo(() => Math.round(subtotal * CHECKOUT_GST_RATE * 100) / 100, [subtotal]);
  const total = useMemo(() => subtotal + shipping + tax, [subtotal, shipping, tax]);

  const fmt = useCallback((n: number) => {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  const onPlaceOrder = useCallback(() => {
    if (items.length === 0) {
      Toast.show({ type: 'error', text1: 'Your cart is empty' });
      return;
    }
    if (!payment) {
      Toast.show({ type: 'error', text1: 'Select a payment method' });
      return;
    }
    console.log('[Checkout] place order', { payment, total });
    clearCart();
    router.push({
      pathname: '/(app)/order-success',
      params: {
        orderId: `#JW-${String(Math.floor(100000 + Math.random() * 900000))}-24`,
        estimatedDelivery: '24th Oct - 26th Oct',
        address:
          '1167 Kucha Mahajani, Chandni Chowk, New Delhi, Delhi 110006',
        total: total.toFixed(2),
      },
    });
  }, [clearCart, items.length, payment, router, total]);

  const dec = (productId: string, size: string, metal: string, qty: number) => {
    setLineQty(productId, size, metal, qty - 1);
  };
  const inc = (productId: string, size: string, metal: string, qty: number) => {
    setLineQty(productId, size, metal, qty + 1);
  };

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

        <View style={styles.addrHeader}>
          <Text style={styles.addrEyebrow}>DELIVERY ADDRESS</Text>
          <Pressable onPress={() => router.push('/(app)/address-details')} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>
        <View style={styles.addrCard}>
          <View style={styles.pinCircle}>
            <MaterialIcons name="location-on" size={20} color={PAY_ACTIVE} />
          </View>
          <View style={styles.addrTextCol}>
            <Text style={styles.addrName}>{mockDeliveryAddress.name}</Text>
            <Text style={styles.addrLines}>{mockDeliveryAddress.lines}</Text>
          </View>
        </View>

        <Text style={[styles.sectionEyebrow, styles.payEyebrow]}>PAYMENT METHOD</Text>
        <View style={styles.payRow}>
          <Pressable
            onPress={() => setPayment('card')}
            style={[styles.payOption, payment === 'card' && styles.payOptionOn]}
          >
            <MaterialIcons
              name="credit-card"
              size={26}
              color={payment === 'card' ? PAY_ACTIVE : PAY_INACTIVE_ICON}
            />
            <Text style={[styles.payLabel, payment !== 'card' && styles.payLabelInactive]}>CARD</Text>
          </Pressable>
          <Pressable
            onPress={() => setPayment('upi')}
            style={[styles.payOption, payment === 'upi' && styles.payOptionOn]}
          >
            <MaterialIcons
              name="account-balance-wallet"
              size={26}
              color={payment === 'upi' ? PAY_ACTIVE : PAY_INACTIVE_ICON}
            />
            <Text style={[styles.payLabel, payment !== 'upi' && styles.payLabelInactive]}>UPI</Text>
          </Pressable>
          <Pressable
            onPress={() => setPayment('netbanking')}
            style={[styles.payOption, payment === 'netbanking' && styles.payOptionOn]}
          >
            <MaterialIcons
              name="account-balance"
              size={26}
              color={payment === 'netbanking' ? PAY_ACTIVE : PAY_INACTIVE_ICON}
            />
            <Text style={[styles.payLabel, payment !== 'netbanking' && styles.payLabelInactive]}>
              NET{'\n'}BANKING
            </Text>
          </Pressable>
        </View>

        <View style={styles.summary}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Subtotal</Text>
            <Text style={styles.sumVal}>₹{fmt(subtotal)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Shipping</Text>
            <Text style={[styles.sumVal, styles.sumFree]}>Free</Text>
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

        <View
          style={[
            styles.bottomContainer,
            {
              paddingBottom: Math.max(insets.bottom, 14) + 10,
              minHeight: 72 + Math.max(insets.bottom, 14),
            },
          ]}
        >
          <View style={[styles.placeOrderBtnOuter, PLACE_ORDER_SHADOW]}>
            <Pressable
              style={({ pressed }) => [styles.placeOrderBtnInner, pressed && styles.placeOrderPressed]}
              onPress={onPlaceOrder}
              accessibilityRole="button"
              accessibilityLabel="Place order"
            >
              <View style={styles.placeOrderRow}>
                <Text style={styles.placeOrderText}>Place Order</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" style={styles.placeOrderArrow} />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const PLACE_ORDER_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  android: { elevation: 5 },
  default: {},
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  screenBody: { flex: 1, backgroundColor: '#fff' },
  /** flexShrink keeps scroll area from eating the footer; footer stays visible without absolute. */
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
  payEyebrow: { marginTop: spacing.xl },
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
  addrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  addrEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: LABEL,
    letterSpacing: 1,
  },
  editLink: { fontSize: fontSizes.sm, fontWeight: '800', color: '#111827' },
  addrCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaed',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SURFACE_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  addrTextCol: { flex: 1 },
  addrName: { fontSize: fontSizes.md, fontWeight: '800', color: '#111827' },
  addrLines: { fontSize: fontSizes.sm, color: MUTED, marginTop: 4, lineHeight: 20 },
  payRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  payOption: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 100,
    borderRadius: 14,
    backgroundColor: SURFACE_MUTED,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  payOptionOn: {
    backgroundColor: '#fff',
    borderColor: PAY_ACTIVE,
  },
  payLabel: {
    marginTop: spacing.xs,
    fontSize: 9,
    fontWeight: '800',
    color: PAY_ACTIVE,
    textAlign: 'center',
  },
  payLabelInactive: {
    color: PAY_INACTIVE_LABEL,
  },
  summary: {
    marginTop: spacing.md,
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
  sumFree: { color: GREEN, fontWeight: '800' },
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
  bottomContainer: {
    flexShrink: 0,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.sm,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8eaed',
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
  },
  placeOrderBtnOuter: {
    backgroundColor: NAVY,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  placeOrderBtnInner: {
    paddingVertical: 17,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  placeOrderPressed: { opacity: 0.92 },
  placeOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  placeOrderArrow: { marginLeft: 8, marginTop: 1 },
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
});
