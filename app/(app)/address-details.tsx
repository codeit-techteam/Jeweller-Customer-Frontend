import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useCartStore } from '@/lib/stores/cartStore';
import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const NAVY = '#0D1B2A';
const LABEL = '#94a3b8';
const MUTED = '#64748b';
const GREEN = '#16a34a';
const INPUT_BG = '#F0F4F8';
const SCREEN_BG = '#f4f6f8';
const CARD_BORDER = '#e8eaed';
const PAY_ACTIVE = '#111827';

const ADDRESS_GST_RATE = 0.03;

type DeliveryType = 'home' | 'store';

const MOCK_DELIVERY_ESTIMATE = 'Estimated delivery by Friday, 24th Oct';

function AddressDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);

  const [name, setName] = useState('Sushant Singh');
  const [phone, setPhone] = useState('+91 9143668845');
  const [email, setEmail] = useState('sussingh@example.com');
  const [address, setAddress] = useState('House 12, Golden Avenue');
  const [city, setCity] = useState('Delhi, IND');
  const [postcode, setPostcode] = useState('100204');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('home');
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeCheck, setPincodeCheck] = useState<string | null>(null);

  const subtotal = useMemo(
    () => items.reduce((s, x) => s + x.price * x.qty, 0),
    [items],
  );
  const gst = useMemo(
    () => Math.round(subtotal * ADDRESS_GST_RATE * 100) / 100,
    [subtotal],
  );
  const totalPayable = useMemo(() => subtotal + gst, [subtotal, gst]);

  const fmt = useCallback((n: number) => {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, []);

  const onCheckPincode = useCallback(() => {
    const p = pincodeInput.trim();
    if (p.length < 4) {
      Toast.show({ type: 'error', text1: 'Enter a valid pincode' });
      setPincodeCheck(null);
      return;
    }
    setPincodeCheck(MOCK_DELIVERY_ESTIMATE);
    console.log('[Address] check pincode', p);
  }, [pincodeInput]);

  const allFilled = useMemo(() => {
    return (
      name.trim().length > 0 &&
      phone.trim().length > 0 &&
      email.trim().length > 0 &&
      address.trim().length > 0 &&
      city.trim().length > 0 &&
      postcode.trim().length > 0
    );
  }, [name, phone, email, address, city, postcode]);

  const onProceed = useCallback(() => {
    if (!allFilled) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }
    console.log('[Address] proceed to payment', {
      name,
      phone,
      email,
      address,
      city,
      postcode,
      deliveryType,
    });
    router.push('/(app)/payment');
  }, [allFilled, name, phone, email, address, city, postcode, deliveryType, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screenBody}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
            <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
          </Pressable>
          <Text style={styles.headerTitle}>Address Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerRule} />

        <ScrollView
          style={styles.scrollFlex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.card}>
          <Text style={styles.eyebrow}>SHIPPING INFORMATION</Text>
          <Field label="Full Name" value={name} onChangeText={setName} />
          <Field label="Mobile Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Flat / House No. / Building" value={address} onChangeText={setAddress} />
          <Field label="City" value={city} onChangeText={setCity} />
          <Field label="Postcode" value={postcode} onChangeText={setPostcode} keyboardType="number-pad" />
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>DELIVERY PREFERENCE</Text>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setDeliveryType('home')}
              style={[styles.segmentOpt, deliveryType === 'home' && styles.segmentOptOn]}
            >
              <MaterialIcons
                name="local-shipping"
                size={20}
                color={deliveryType === 'home' ? PAY_ACTIVE : MUTED}
              />
              <Text style={[styles.segmentText, deliveryType === 'home' && styles.segmentTextOn]}>
                Home Delivery
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDeliveryType('store')}
              style={[styles.segmentOpt, deliveryType === 'store' && styles.segmentOptOn]}
            >
              <MaterialIcons
                name="storefront"
                size={20}
                color={deliveryType === 'store' ? PAY_ACTIVE : MUTED}
              />
              <Text style={[styles.segmentText, deliveryType === 'store' && styles.segmentTextOn]}>
                Store Pickup
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>CHECK AVAILABILITY</Text>
          <View style={styles.pinRow}>
            <View style={styles.pinInputWrap}>
              <MaterialIcons name="location-on" size={20} color={MUTED} style={styles.pinIcon} />
              <TextInput
                style={styles.pinInput}
                placeholder="Enter Pincode"
                placeholderTextColor="#9ca3af"
                value={pincodeInput}
                onChangeText={setPincodeInput}
                keyboardType="number-pad"
                selectionColor={NAVY}
              />
            </View>
            <Pressable style={styles.checkBtn} onPress={onCheckPincode}>
              <Text style={styles.checkBtnText}>Check</Text>
            </Pressable>
          </View>
          {pincodeCheck ? (
            <View style={styles.estimateRow}>
              <MaterialIcons name="check-circle" size={18} color={GREEN} />
              <Text style={styles.estimateText}>{pincodeCheck}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>ORDER SUMMARY</Text>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Subtotal</Text>
            <Text style={styles.sumVal}>₹{fmt(subtotal)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>GST (3%)</Text>
            <Text style={styles.sumVal}>₹{fmt(gst)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Delivery Fee</Text>
            <Text style={[styles.sumVal, styles.sumFree]}>FREE</Text>
          </View>
          <View style={[styles.sumRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalVal}>₹{fmt(totalPayable)}</Text>
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
          <View
            style={[
              styles.proceedBtnOuter,
              allFilled ? PROCEED_SHADOW : null,
              !allFilled && styles.proceedBtnOuterDisabled,
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.proceedBtnInner,
                pressed && allFilled && styles.proceedBtnPressed,
              ]}
              onPress={onProceed}
              disabled={!allFilled}
              accessibilityRole="button"
              accessibilityLabel="Proceed to payment"
              accessibilityState={{ disabled: !allFilled }}
            >
              <View style={styles.proceedRow}>
                <Text style={[styles.proceedText, !allFilled && styles.proceedTextDisabled]}>
                  Proceed to Payment
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={allFilled ? '#fff' : '#64748b'}
                  style={styles.proceedChevron}
                />
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        placeholderTextColor="#9ca3af"
        selectionColor={NAVY}
      />
    </View>
  );
}

const PROCEED_SHADOW = Platform.select({
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
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  screenBody: { flex: 1, backgroundColor: SCREEN_BG },
  scrollFlex: { flex: 1, flexShrink: 1, minHeight: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
  },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CARD_BORDER,
    marginHorizontal: 0,
  },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: NAVY },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: LABEL,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSizes.xs, fontWeight: '600', color: MUTED, marginBottom: 6 },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 999,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 12,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: PAY_ACTIVE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: INPUT_BG,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  segmentOpt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  segmentOptOn: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  segmentText: { fontSize: fontSizes.xs, fontWeight: '700', color: MUTED },
  segmentTextOn: { color: PAY_ACTIVE },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pinInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  pinIcon: { marginRight: 2 },
  pinInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.xs,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: PAY_ACTIVE,
  },
  checkBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: INPUT_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    minHeight: 44,
    justifyContent: 'center',
  },
  checkBtnText: { fontSize: fontSizes.sm, fontWeight: '800', color: PAY_ACTIVE },
  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  estimateText: { flex: 1, fontSize: fontSizes.sm, fontWeight: '600', color: GREEN },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sumLabel: { fontSize: fontSizes.sm, color: MUTED },
  sumVal: { fontSize: fontSizes.sm, fontWeight: '700', color: PAY_ACTIVE },
  sumFree: { color: GREEN, fontWeight: '800' },
  totalRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eef2f6',
  },
  totalLabel: { fontSize: fontSizes.md, fontWeight: '800', color: PAY_ACTIVE },
  totalVal: { fontSize: fontSizes.md, fontWeight: '800', color: PAY_ACTIVE },
  bottomContainer: {
    flexShrink: 0,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
    zIndex: 2,
    ...Platform.select({
      android: { elevation: 8 },
      default: {},
    }),
  },
  proceedBtnOuter: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: NAVY,
  },
  proceedBtnOuterDisabled: {
    backgroundColor: '#cbd5e1',
  },
  proceedBtnInner: {
    paddingVertical: 17,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  proceedBtnPressed: { opacity: 0.92 },
  proceedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  proceedTextDisabled: {
    color: '#64748b',
  },
  proceedChevron: { marginLeft: 4, marginTop: 1 },
});

export default function AddressDetailsRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/address-details">
      <AddressDetailsScreen />
    </ProtectedRouteGate>
  );
}
