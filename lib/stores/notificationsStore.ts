import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';

import type { AppNotification } from '@/lib/services/notifications';
import {
  ensureGeneratedNotifications,
  fetchNotificationsPage,
  fetchUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/services/notifications';
import { getSupabase } from '@/lib/supabaseClient';

type NotificationsState = {
  userId: string | null;
  items: AppNotification[];
  unreadCount: number;
  channel: RealtimeChannel | null;
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
  initializeForUser: (userId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  startRealtime: (userId: string) => void;
  stopRealtime: () => void;
  clear: () => void;
};

async function loadPage(
  userId: string,
  page: number,
): Promise<{ items: AppNotification[]; hasMore: boolean }> {
  const result = await fetchNotificationsPage(userId, page);
  return result;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  userId: null,
  items: [],
  unreadCount: 0,
  channel: null,
  loading: false,
  loadingMore: false,
  refreshing: false,
  hasMore: true,
  page: 0,
  error: null,

  initializeForUser: async (userId) => {
    if (!userId) {
      get().clear();
      return;
    }
    const current = get();
    if (current.userId === userId && current.items.length > 0) {
      get().startRealtime(userId);
      return;
    }

    set({
      userId,
      loading: true,
      error: null,
      items: [],
      page: 0,
      hasMore: true,
      unreadCount: 0,
    });

    try {
      await ensureGeneratedNotifications(userId);
      const [pageResult, unreadCount] = await Promise.all([
        loadPage(userId, 0),
        fetchUnreadNotificationsCount(userId),
      ]);
      set({
        userId,
        items: pageResult.items,
        hasMore: pageResult.hasMore,
        page: 0,
        unreadCount,
        loading: false,
      });
      get().startRealtime(userId);
    } catch (error: any) {
      set({
        loading: false,
        error: typeof error?.message === 'string' ? error.message : 'Unable to load notifications.',
      });
    }
  },

  refresh: async () => {
    const userId = get().userId;
    if (!userId) return;
    set({ refreshing: true, error: null });
    try {
      await ensureGeneratedNotifications(userId);
      const [pageResult, unreadCount] = await Promise.all([
        loadPage(userId, 0),
        fetchUnreadNotificationsCount(userId),
      ]);
      set({
        items: pageResult.items,
        hasMore: pageResult.hasMore,
        page: 0,
        unreadCount,
        refreshing: false,
      });
    } catch (error: any) {
      set({
        refreshing: false,
        error: typeof error?.message === 'string' ? error.message : 'Unable to refresh notifications.',
      });
    }
  },

  loadMore: async () => {
    const state = get();
    if (!state.userId || !state.hasMore || state.loadingMore || state.loading) return;
    const nextPage = state.page + 1;
    set({ loadingMore: true });
    try {
      const result = await loadPage(state.userId, nextPage);
      set((prev) => ({
        items: [...prev.items, ...result.items],
        page: nextPage,
        hasMore: result.hasMore,
        loadingMore: false,
      }));
    } catch (error: any) {
      set({
        loadingMore: false,
        error: typeof error?.message === 'string' ? error.message : 'Unable to load more notifications.',
      });
    }
  },

  markRead: async (id) => {
    const state = get();
    if (!state.userId) return;
    const existing = state.items.find((item) => item.id === id);
    if (!existing || existing.isRead) return;

    set((prev) => ({
      items: prev.items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));

    try {
      await markNotificationAsRead(state.userId, id);
    } catch {
      // Keep optimistic state; next refresh reconciles.
    }
  },

  markAllRead: async () => {
    const state = get();
    if (!state.userId) return;
    const hadUnread = state.items.some((item) => !item.isRead);
    if (!hadUnread) return;

    set((prev) => ({
      items: prev.items.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));

    try {
      await markAllNotificationsAsRead(state.userId);
    } catch {
      // Keep optimistic state; next refresh reconciles.
    }
  },

  startRealtime: (userId) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const existing = get().channel;
    if (existing) {
      supabase.removeChannel(existing);
      set({ channel: null });
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const state = get();
          const toAppNotification = (row: any): AppNotification => ({
            id: String(row.id),
            userId: String(row.user_id),
            title: String(row.title ?? ''),
            body: String(row.body ?? ''),
            type: (row.type ?? 'system') as AppNotification['type'],
            isRead: Boolean(row.is_read),
            createdAt: String(row.created_at ?? new Date().toISOString()),
            data: (row.data ?? {}) as Record<string, unknown>,
          });

          if (payload.eventType === 'INSERT' && payload.new) {
            const incoming = toAppNotification(payload.new);
            if (state.items.some((item) => item.id === incoming.id)) return;
            set((prev) => ({
              items: [incoming, ...prev.items],
              unreadCount: prev.unreadCount + (incoming.isRead ? 0 : 1),
            }));
            return;
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            const incoming = toAppNotification(payload.new);
            set((prev) => {
              const nextItems = prev.items.map((item) =>
                item.id === incoming.id ? incoming : item,
              );
              const unreadCount = nextItems.reduce(
                (acc, item) => acc + (item.isRead ? 0 : 1),
                0,
              );
              return { items: nextItems, unreadCount };
            });
            return;
          }

          if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = String(payload.old.id);
            set((prev) => {
              const nextItems = prev.items.filter((item) => item.id !== deletedId);
              const unreadCount = nextItems.reduce(
                (acc, item) => acc + (item.isRead ? 0 : 1),
                0,
              );
              return { items: nextItems, unreadCount };
            });
          }
        },
      )
      .subscribe();

    set({ channel });
  },

  stopRealtime: () => {
    const supabase = getSupabase();
    const channel = get().channel;
    if (supabase && channel) {
      supabase.removeChannel(channel);
    }
    set({ channel: null });
  },

  clear: () =>
    (() => {
      get().stopRealtime();
      set({
      userId: null,
      items: [],
      unreadCount: 0,
        channel: null,
      loading: false,
      loadingMore: false,
      refreshing: false,
      hasMore: true,
      page: 0,
      error: null,
      });
    })(),
}));
