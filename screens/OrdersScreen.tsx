import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSizes, radius, spacing } from '@/src/constants/theme';

const NAVY = '#0f172a';
const MUTED = '#64748b';

type OrderRow = {
  id: string;
  label: string;
  date: string;
  total: string;
  status: 'Shipped' | 'Processing' | 'Delivered';
};

const MOCK_ORDERS: OrderRow[] = [
  { id: '1', label: 'Order #LXE-20418', date: 'Placed 12 Mar 2026', total: '₹ 1,24,500', status: 'Shipped' },
  { id: '2', label: 'Order #LXE-19802', date: 'Placed 28 Feb 2026', total: '₹ 86,200', status: 'Delivered' },
  { id: '3', label: 'Order #LXE-19144', date: 'Placed 02 Feb 2026', total: '₹ 42,900', status: 'Processing' },
];

export default function OrdersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
          <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => console.log('[Orders] open', item.id)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.orderId}>{item.label}</Text>
              <View style={[styles.pill, item.status === 'Delivered' && styles.pillDone]}>
                <Text style={[styles.pillText, item.status === 'Delivered' && styles.pillTextDone]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.date}>{item.date}</Text>
            <View style={styles.cardBottom}>
              <Text style={styles.total}>{item.total}</Text>
              <MaterialIcons name="chevron-right" size={22} color="#c4c4c4" />
            </View>
          </Pressable>
        )}
        ListHeaderComponent={
          <Text style={styles.intro}>Track and manage your GehnaHub jewellery purchases.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8eaed',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: NAVY,
  },
  headerRight: { width: 22 },
  intro: {
    fontSize: fontSizes.sm,
    color: MUTED,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaed',
  },
  cardPressed: { opacity: 0.92 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderId: { fontSize: fontSizes.md, fontWeight: '700', color: NAVY, flex: 1 },
  pill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillDone: { backgroundColor: '#ecfdf5' },
  pillText: { fontSize: 10, fontWeight: '800', color: '#1e40af' },
  pillTextDone: { color: '#047857' },
  date: { fontSize: fontSizes.xs, color: MUTED, marginBottom: spacing.sm },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: { fontSize: fontSizes.md, fontWeight: '800', color: NAVY },
});
