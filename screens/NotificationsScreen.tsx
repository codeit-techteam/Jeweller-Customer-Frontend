import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationItem } from '@/lib/components/common/NotificationItem';
import type { NotificationModel } from '@/lib/services/mock/notifications';
import { notificationsMock } from '@/lib/services/mock/notifications';
import { fontSizes, spacing } from '@/src/constants/theme';

type Row =
  | { kind: 'section'; id: string; label: string; showMarkAll?: boolean }
  | { kind: 'item'; id: string; notification: NotificationModel };

function buildRows(items: NotificationModel[]): Row[] {
  const today = items.filter((i) => i.group === 'today');
  const earlier = items.filter((i) => i.group === 'earlier');
  const rows: Row[] = [];
  if (today.length > 0) {
    rows.push({ kind: 'section', id: 'sec-today', label: 'TODAY', showMarkAll: true });
    today.forEach((i) => rows.push({ kind: 'item', id: i.id, notification: i }));
  }
  if (earlier.length > 0) {
    rows.push({ kind: 'section', id: 'sec-earlier', label: 'EARLIER' });
    earlier.forEach((i) => rows.push({ kind: 'item', id: i.id, notification: i }));
  }
  return rows;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationModel[]>(() => [...notificationsMock]);

  const rows = useMemo(() => buildRows(notifications), [notifications]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllTodayRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.group === 'today' ? { ...n, isRead: true } : n)));
  }, []);

  const onTrackOrder = useCallback(
    (id: string) => {
      markRead(id);
      console.log('[Notifications] Track order:', id);
    },
    [markRead],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={styles.headerIcon}>
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => console.log('[Notifications] menu')} style={styles.headerIcon}>
          <MaterialIcons name="more-vert" size={22} color="#0f172a" />
        </Pressable>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="notifications-none" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySub}>You&apos;re all caught up. We&apos;ll notify you when something arrives.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            if (item.kind === 'section') {
              return (
                <View style={[styles.sectionRow, index > 0 && styles.sectionRowSpaced]}>
                  <Text style={styles.sectionLabel}>{item.label}</Text>
                  {item.showMarkAll ? (
                    <Pressable onPress={markAllTodayRead} hitSlop={8}>
                      <Text style={styles.markAll}>Mark all as read</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.markAllPlaceholder} />
                  )}
                </View>
              );
            }
            const n = item.notification;
            return (
              <NotificationItem
                item={n}
                onPress={() => markRead(n.id)}
                onActionPress={n.action ? () => onTrackOrder(n.id) : undefined}
              />
            );
          }}
          ListFooterComponent={
            <Text style={styles.footerEnd}>You&apos;ve reached the end of your notifications.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0f172a',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionRowSpaced: {
    marginTop: spacing.lg,
  },
  markAllPlaceholder: {
    minWidth: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#9ca3af',
  },
  markAll: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  footerEnd: {
    textAlign: 'center',
    fontSize: fontSizes.xs,
    color: '#94a3b8',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySub: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
