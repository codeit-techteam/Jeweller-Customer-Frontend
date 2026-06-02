import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NotificationItem } from '@/lib/components/common/NotificationItem';
import type { AppNotification } from '@/lib/services/notifications';
import { useNotificationsStore } from '@/lib/stores/notificationsStore';
import { fontSizes, spacing } from '@/src/constants/theme';

type Row =
  | { kind: 'section'; id: string; label: string; showMarkAll?: boolean }
  | { kind: 'item'; id: string; notification: AppNotification };

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

function isToday(dateIso: string): boolean {
  const d = new Date(dateIso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function buildRows(items: AppNotification[]): Row[] {
  const today = items.filter((i) => isToday(i.createdAt));
  const earlier = items.filter((i) => !isToday(i.createdAt));
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

  const rows = useMemo(() => buildRows(notifications), [notifications]);

  const markRead = useCallback((id: string) => {
    void markReadStore(id);
  }, [markReadStore]);

  const markAllTodayRead = useCallback(() => {
    void markAllReadStore();
  }, [markAllReadStore]);

  const openFromNotification = useCallback(
    (n: AppNotification) => {
      markRead(n.id);
      const data = n.data ?? {};
      const route = typeof data.route === 'string' ? data.route : null;
      const routeParams =
        data.routeParams && typeof data.routeParams === 'object'
          ? (data.routeParams as Record<string, string>)
          : undefined;

      if (route) {
        router.push({ pathname: route as never, params: routeParams as never });
        return;
      }

      const sourceEvent = typeof data.source_event === 'string' ? data.source_event : '';
      if (n.type === 'order' || sourceEvent.includes('order')) {
        router.push('/(app)/orders');
      } else if (sourceEvent.includes('appointment') || sourceEvent.includes('book_visit')) {
        router.push('/(app)/appointments');
      } else if (sourceEvent.includes('offer') || sourceEvent.includes('collection')) {
        router.push('/(app)/home');
      }
    },
    [markRead, router],
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

      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color="#1e40af" size="small" />
          <Text style={styles.emptySub}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
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
              <NotificationItem
                item={{
                  ...n,
                  timeLabel: relativeTime(n.createdAt),
                  imageUri:
                    typeof n.data?.imageUri === 'string'
                      ? n.data.imageUri
                      : typeof n.data?.image === 'string'
                        ? n.data.image
                        : undefined,
                  actionLabel,
                }}
                onPress={() => openFromNotification(n)}
                onActionPress={actionLabel ? () => openFromNotification(n) : undefined}
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
              {!hasMore && notifications.length > 0 ? (
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
