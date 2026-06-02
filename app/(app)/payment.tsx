import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCartStore } from '@/lib/stores/cartStore';
import { ProtectedRouteGate } from '@/lib/components/common/ProtectedRouteGate';
import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#0f172a';

/** Minimal payment step after address — completes checkout */
function PaymentScreen() {
  const router = useRouter();
  const clear = useCartStore((s) => s.clear);

  const pay = () => {
    const state = useCartStore.getState();
    const items = state.items;
    const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
    const gst = Math.round(subtotal * 0.03 * 100) / 100;
    const total = subtotal + gst;
    clear();
    router.replace({
      pathname: '/(app)/order-success',
      params: {
        orderId: `#JW-${String(Math.floor(100000 + Math.random() * 900000))}-24`,
        estimatedDelivery: '24th Oct - 26th Oct',
        address:
          '1167 Kucha Mahajani, Chandni Chowk, New Delhi, Delhi 110006',
        total: total.toFixed(2),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.title}>Payment</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.body}>
        <Text style={styles.hint}>Mock payment — tap below to complete your order.</Text>
        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]} onPress={pay}>
          <Text style={styles.btnText}>Pay now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: { fontSize: fontSizes.lg, fontWeight: '800', color: NAVY },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  hint: { fontSize: fontSizes.sm, color: '#64748b', marginBottom: spacing.xl },
  btn: {
    backgroundColor: NAVY,
    paddingVertical: spacing.lg,
    borderRadius: 999,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: fontSizes.md },
});

export default function PaymentRoute() {
  return (
    <ProtectedRouteGate routePath="/(app)/payment">
      <PaymentScreen />
    </ProtectedRouteGate>
  );
}
