import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeableNotificationRow } from '@/lib/components/common/SwipeableNotificationRow';
import type { AppNotification, NotificationFilterTab } from '@/lib/services/notifications';
import { matchesNotificationFilter, resolveNotificationRoute } from '@/lib/services/notifications';
import { useNotificationsStore } from '@/lib/stores/notificationsStore';
import { fontSizes, spacing } from '@/src/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Row =
  | { kind: 'section'; id: string; label: string; showMarkAll?: boolean }
  | { kind: 'item'; id: string; notification: AppNotification };

const FILTER_TABS: { key: NotificationFilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'offers', label: 'Offers' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'support', label: 'Support' },
  { key: 'system', label: 'System' },
];

function relativeTime(dateIso: string): string {
  const ts = new Date(dateIso).getTime();
  const deltaMs = Date.now() - ts;
  const min = Math.floor(deltaMs / (60 * 1000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function sectionLabelForDate(dateIso: string): 'TODAY' | 'YESTERDAY' | 'EARLIER' {
  const ts = new Date(dateIso).getTime();
  const today = startOfDay(new Date());
  const yesterday = today - 24 * 60 * 60 * 1000;
  const day = startOfDay(new Date(dateIso));
  if (day === today) return 'TODAY';
  if (day === yesterday) return 'YESTERDAY';
  return 'EARLIER';
}

function buildRows(items: AppNotification[]): Row[] {
  const sections: Array<'TODAY' | 'YESTERDAY' | 'EARLIER'> = ['TODAY', 'YESTERDAY', 'EARLIER'];
  const rows: Row[] = [];

  for (const label of sections) {
    const bucket = items.filter((item) => sectionLabelForDate(item.createdAt) === label);
    if (bucket.length === 0) continue;
    rows.push({
      kind: 'section',
      id: `sec-${label.toLowerCase()}`,
      label,
      showMarkAll: label === 'TODAY',
    });
    bucket.forEach((notification) => {
      rows.push({ kind: 'item', id: notification.id, notification });
    });
  }

  return rows;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotificationFilterTab>('all');
  const notifications = useNotificationsStore((s) => s.items);
  const loading = useNotificationsStore((s) => s.loading);
  const loadingMore = useNotificationsStore((s) => s.loadingMore);
  const refreshing = useNotificationsStore((s) => s.refreshing);
  const hasMore = useNotificationsStore((s) => s.hasMore);
  const error = useNotificationsStore((s) => s.error);
  const refresh = useNotificationsStore((s) => s.refresh);
  const loadMore = useNotificationsStore((s) => s.loadMore);
  const markReadStore = useNotificationsStore((s) => s.markRead);
  const markAllReadStore = useNotificationsStore((s) => s.markAllRead);
  const removeStore = useNotificationsStore((s) => s.remove);

  useFocusEffect(
    useCallback(() => {
      if (loading || refreshing) return;
      if (notifications.length === 0 || error) {
        void refresh();
      }
    }, [error, loading, notifications.length, refresh, refreshing]),
  );

  const filtered = useMemo(
    () => notifications.filter((item) => matchesNotificationFilter(item, activeTab)),
    [notifications, activeTab],
  );

  const rows = useMemo(() => buildRows(filtered), [filtered]);

  const changeTab = useCallback((tab: NotificationFilterTab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  }, []);

  const markRead = useCallback(
    (id: string) => {
      void markReadStore(id);
    },
    [markReadStore],
  );

  const markAllTodayRead = useCallback(() => {
    void markAllReadStore();
  }, [markAllReadStore]);

  const openFromNotification = useCallback(
    (n: AppNotification) => {
      void markReadStore(n.id);
      const route = resolveNotificationRoute(n);
      if (route) {
        router.push({ pathname: route.pathname as never, params: route.params as never });
        return;
      }
      router.push('/(app)/home');
    },
    [markReadStore, router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={styles.tabsWrap}>
        {FILTER_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              onPress={() => changeTab(tab.key)}
              style={[styles.tabChip, active && styles.tabChipActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color="#1e40af" size="small" />
          <Text style={styles.emptySub}>Loading notifications...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MaterialIcons name="notifications-none" size={72} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>
            {error ? 'Could not load notifications' : 'No Notifications Yet'}
          </Text>
          <Text style={styles.emptySub}>
            {error ?? "We'll notify you when something important happens."}
          </Text>
          {error ? (
            <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor="#1e40af" />
          }
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              void loadMore();
            }
          }}
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
            const actionLabel = n.type === 'order' ? 'Track Order' : undefined;

            return (
              <SwipeableNotificationRow
                item={{
                  ...n,
                  timeLabel: relativeTime(n.createdAt),
                  imageUri: n.imageUrl,
                  actionLabel,
                }}
                onPress={() => openFromNotification(n)}
                onActionPress={actionLabel ? () => openFromNotification(n) : undefined}
                onMarkRead={() => markRead(n.id)}
                onDelete={() => void removeStore(n.id)}
              />
            );
          }}
          ListFooterComponent={
            <>
              {loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator color="#64748b" size="small" />
                </View>
              ) : null}
              {error ? <Text style={styles.footerError}>{error}</Text> : null}
              {!hasMore && filtered.length > 0 ? (
                <Text style={styles.footerEnd}>You&apos;ve reached the end of your notifications.</Text>
              ) : null}
            </>
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
  tabsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#fff',
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
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: '#1e40af',
  },
  retryText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#fff',
  },
  footerLoader: {
    paddingVertical: spacing.md,
  },
  footerError: {
    textAlign: 'center',
    fontSize: fontSizes.xs,
    color: '#dc2626',
    marginTop: spacing.sm,
  },
});
