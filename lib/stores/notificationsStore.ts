import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';

import type { AppNotification } from '@/lib/services/notifications';
import {
  ensureGeneratedNotifications,
  fetchNotificationRecipient,
  fetchNotificationsPage,
  fetchUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotificationRecipient,
} from '@/lib/services/notifications';
import { getSupabase } from '@/lib/supabaseClient';

export type InAppNotificationPayload = {
  id: string;
  title: string;
  body: string;
  notification: AppNotification;
};

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
  incomingBanner: InAppNotificationPayload | null;
  initializeForUser: (userId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  dismissBanner: () => void;
  startRealtime: (userId: string) => void;
  stopRealtime: () => void;
  clear: () => void;
};

async function loadPage(
  userId: string,
  page: number,
): Promise<{ items: AppNotification[]; hasMore: boolean }> {
  return fetchNotificationsPage(userId, page);
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
  incomingBanner: null,

  initializeForUser: async (userId) => {
    if (!userId) {
      get().clear();
      return;
    }
    const current = get();
    if (current.userId === userId && current.items.length > 0 && !current.error) {
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
      incomingBanner: null,
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
      // Optimistic state kept; refresh reconciles.
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
      // Optimistic state kept.
    }
  },

  remove: async (id) => {
    const state = get();
    if (!state.userId) return;
    const existing = state.items.find((item) => item.id === id);
    if (!existing) return;

    set((prev) => {
      const nextItems = prev.items.filter((item) => item.id !== id);
      return {
        items: nextItems,
        unreadCount: existing.isRead ? prev.unreadCount : Math.max(0, prev.unreadCount - 1),
      };
    });

    try {
      await deleteNotificationRecipient(state.userId, id);
    } catch {
      // Refresh on next pull reconciles.
    }
  },

  dismissBanner: () => set({ incomingBanner: null }),

  startRealtime: (userId) => {
    const supabase = getSupabase();
    if (!supabase) {
      const pollId = setInterval(() => {
        void get().refresh();
      }, 20000);
      set({ channel: { pollId } as unknown as RealtimeChannel });
      return;
    }

    const existing = get().channel;
    if (existing) {
      if ((existing as unknown as { pollId?: ReturnType<typeof setInterval> }).pollId) {
        clearInterval((existing as unknown as { pollId: ReturnType<typeof setInterval> }).pollId);
      } else {
        supabase.removeChannel(existing);
      }
      set({ channel: null });
    }

    void supabase.auth.getSession().then(({ data: session }) => {
      if (!session.session) {
        const pollId = setInterval(() => {
          void get().refresh();
        }, 20000);
        set({ channel: { pollId } as unknown as RealtimeChannel });
        return;
      }

    const channel = supabase
      .channel(`user_notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const state = get();

          if (payload.eventType === 'INSERT' && payload.new) {
            const recipientId = String(payload.new.id);
            if (state.items.some((item) => item.id === recipientId)) return;

            try {
              const incoming = await fetchNotificationRecipient(userId, recipientId);
              if (!incoming) return;

              set((prev) => ({
                items: [incoming, ...prev.items],
                unreadCount: prev.unreadCount + (incoming.isRead ? 0 : 1),
                incomingBanner: {
                  id: incoming.id,
                  title: incoming.title,
                  body: incoming.body,
                  notification: incoming,
                },
              }));
            } catch {
              void get().refresh();
            }
            return;
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            const recipientId = String(payload.new.id);
            const isRead = Boolean(payload.new.is_read);
            set((prev) => {
              const prevItem = prev.items.find((item) => item.id === recipientId);
              const wasUnread = prevItem && !prevItem.isRead;
              const nextItems = prev.items.map((item) =>
                item.id === recipientId ? { ...item, isRead } : item,
              );
              let unreadCount = prev.unreadCount;
              if (wasUnread && isRead) unreadCount = Math.max(0, unreadCount - 1);
              if (prevItem && prevItem.isRead && !isRead) unreadCount += 1;
              return { items: nextItems, unreadCount };
            });
            return;
          }

          if (payload.eventType === 'DELETE' && payload.old) {
            const deletedId = String(payload.old.id);
            set((prev) => {
              const removed = prev.items.find((item) => item.id === deletedId);
              const nextItems = prev.items.filter((item) => item.id !== deletedId);
              return {
                items: nextItems,
                unreadCount:
                  removed && !removed.isRead
                    ? Math.max(0, prev.unreadCount - 1)
                    : prev.unreadCount,
              };
            });
          }
        },
      )
      .subscribe();

    set({ channel });
    });
  },

  stopRealtime: () => {
    const supabase = getSupabase();
    const channel = get().channel;
    const pollId = (channel as unknown as { pollId?: ReturnType<typeof setInterval> })?.pollId;
    if (pollId) {
      clearInterval(pollId);
    } else if (supabase && channel) {
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
        incomingBanner: null,
      });
    })(),
}));
