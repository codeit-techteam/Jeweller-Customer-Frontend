import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { showPopup } from '@/lib/stores/popupStore';
import {
  type Address,
  formatAddressLines,
  useAddressStore,
} from '@/lib/stores/addressStore';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const NAVY = '#0f172a';
const MUTED = '#64748b';
const BLUE = '#1d4ed8';
const DANGER = '#dc2626';
const GREEN = '#16a34a';
const GREEN_BG = '#EAF7EF';
const CARD_BORDER = '#e8eaed';
const SCREEN_BG = '#f8f9fa';

export default function AddressScreen() {
  const router = useRouter();

  const addresses = useAddressStore((s) => s.addresses);
  const defaultId = useAddressStore((s) => s.defaultId);
  const deleteAddress = useAddressStore((s) => s.deleteAddress);
  const setDefault = useAddressStore((s) => s.setDefault);

  const onAdd = useCallback(() => {
    router.push('/(app)/address-form');
  }, [router]);

  const onEdit = useCallback(
    (id: string) => {
      router.push({ pathname: '/(app)/address-form', params: { id } });
    },
    [router],
  );

  const onDelete = useCallback(
    (item: Address) => {
      showPopup({
        type: 'confirm',
        title: 'Delete address?',
        message: `"${item.label}" will be removed from your address book.`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: () => {
          deleteAddress(item.id);
          Toast.show({ type: 'success', text1: 'Address deleted' });
        },
      });
    },
    [deleteAddress],
  );

  const onSetDefault = useCallback(
    (id: string) => {
      setDefault(id);
      Toast.show({ type: 'success', text1: 'Default address updated' });
    },
    [setDefault],
  );

  const isEmpty = addresses.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
          <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Address Book</Text>
        <Pressable
          hitSlop={12}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add new address"
        >
          <MaterialIcons name="add" size={26} color={NAVY} />
        </Pressable>
      </View>

      {isEmpty ? (
        <EmptyState onAdd={onAdd} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.intro}>Saved addresses for delivery and boutique visits.</Text>
          }
          ListFooterComponent={<AddAddressButton onPress={onAdd} />}
          renderItem={({ item }) => (
            <AddressCard
              item={item}
              isDefault={item.id === defaultId}
              onEdit={() => onEdit(item.id)}
              onDelete={() => onDelete(item)}
              onSetDefault={() => onSetDefault(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function AddressCard({
  item,
  isDefault,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  item: Address;
  isDefault: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View style={styles.labelIcon}>
            <MaterialIcons
              name={labelIcon(item.label)}
              size={16}
              color={NAVY}
            />
          </View>
          <Text style={styles.cardTitle}>{item.label}</Text>
        </View>
        {isDefault ? (
          <View style={styles.defaultPill}>
            <Text style={styles.defaultText}>DEFAULT</Text>
          </View>
        ) : null}
      </View>

      {item.name ? <Text style={styles.name}>{item.name}</Text> : null}
      <Text style={styles.lines}>{formatAddressLines(item)}</Text>
      {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}

      <View style={styles.divider} />

      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          hitSlop={6}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Edit address"
        >
          <MaterialIcons name="edit" size={16} color={BLUE} />
          <Text style={[styles.actionText, { color: BLUE }]}>Edit</Text>
        </Pressable>

        <View style={styles.vDivider} />

        <Pressable
          onPress={onDelete}
          hitSlop={6}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Delete address"
        >
          <MaterialIcons name="delete-outline" size={16} color={DANGER} />
          <Text style={[styles.actionText, { color: DANGER }]}>Delete</Text>
        </Pressable>

        {!isDefault ? (
          <>
            <View style={styles.vDivider} />
            <Pressable
              onPress={onSetDefault}
              hitSlop={6}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Set as default"
            >
              <MaterialIcons name="check-circle-outline" size={16} color={GREEN} />
              <Text style={[styles.actionText, { color: GREEN }]}>Set Default</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

function AddAddressButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel="Add new address"
    >
      <MaterialIcons name="add" size={20} color={NAVY} />
      <Text style={styles.addBtnText}>Add New Address</Text>
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <MaterialIcons name="location-on" size={36} color="#94a3b8" />
      </View>
      <Text style={styles.emptyTitle}>No saved addresses</Text>
      <Text style={styles.emptySub}>
        Add your first delivery address to get started with orders and boutique visits.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
        accessibilityRole="button"
      >
        <MaterialIcons name="add" size={18} color="#fff" />
        <Text style={styles.emptyCtaText}>Add New Address</Text>
      </Pressable>
    </View>
  );
}

function labelIcon(
  label: Address['label'],
): React.ComponentProps<typeof MaterialIcons>['name'] {
  switch (label) {
    case 'Home':
      return 'home';
    case 'Office':
      return 'business-center';
    default:
      return 'place';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CARD_BORDER,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: NAVY,
  },
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
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: fontSizes.md, fontWeight: '800', color: NAVY },
  defaultPill: {
    backgroundColor: GREEN_BG,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  defaultText: { fontSize: 10, fontWeight: '800', color: GREEN, letterSpacing: 0.6 },
  name: { fontSize: fontSizes.sm, color: NAVY, fontWeight: '700', marginBottom: 4 },
  lines: {
    fontSize: fontSizes.sm,
    color: MUTED,
    lineHeight: 20,
  },
  phone: { marginTop: 4, fontSize: fontSizes.sm, color: MUTED, fontWeight: '600' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eef2f6',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 10,
  },
  actionBtnPressed: { opacity: 0.6 },
  actionText: { fontSize: fontSizes.sm, fontWeight: '700' },
  vDivider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  addBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  addBtnPressed: { opacity: 0.8 },
  addBtnText: { fontSize: fontSizes.md, fontWeight: '800', color: NAVY },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: fontSizes.sm,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: NAVY,
  },
  emptyCtaPressed: { opacity: 0.9 },
  emptyCtaText: { color: '#fff', fontSize: fontSizes.md, fontWeight: '800' },
});
