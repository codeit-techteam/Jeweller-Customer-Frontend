import type { SupabaseClient } from '@supabase/supabase-js';

import { isApiConfigured } from '@/lib/appConfig';
import { getSupabase } from '@/lib/supabaseClient';
import {
  getNotificationSettings as getNotificationSettingsApi,
  registerPushTokenApi,
  updateNotificationSettingsApi,
} from '@/services/api';
import { apiRequest } from '@/services/httpClient';

export type AppNotificationType =
  | 'offer'
  | 'appointment'
  | 'callback'
  | 'support'
  | 'system'
  | 'gold_rate'
  | 'collection'
  | 'promotion'
  | 'profile'
  | 'order'
  | 'lead'
  | 'document'
  | 'payment'
  | 'approval';

export type NotificationFilterTab = 'all' | 'offers' | 'appointments' | 'support' | 'system';

export type NotificationSettings = {
  user_id: string;
  offers_enabled: boolean;
  appointments_enabled: boolean;
  support_enabled: boolean;
  system_enabled: boolean;
  push_enabled: boolean;
};

export type AppNotification = {
  id: string;
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: AppNotificationType;
  isRead: boolean;
  createdAt: string;
  imageUrl?: string;
  actionType?: string;
  actionId?: string;
  data: Record<string, unknown>;
};

export type FetchNotificationsResult = {
  items: AppNotification[];
  hasMore: boolean;
};

const PAGE_SIZE_DEFAULT = 20;

const USER_NOTIFICATION_SELECT = `
  id,
  is_read,
  read_at,
  created_at,
  notification:notifications (
    id,
    title,
    message,
    type,
    image,
    action_type,
    action_id,
    metadata,
    created_at
  )
`;

function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error('Notifications require Supabase configuration.');
  }
  return client;
}

function toAppNotification(row: any): AppNotification | null {
  const notification = row?.notification;
  if (!notification) return null;

  const metadata = (notification.metadata ?? {}) as Record<string, unknown>;

  return {
    id: String(row.id),
    notificationId: String(notification.id),
    userId: String(row.user_id ?? ''),
    title: String(notification.title ?? ''),
    body: String(notification.message ?? ''),
    type: (notification.type ?? 'system') as AppNotificationType,
    isRead: Boolean(row.is_read),
    createdAt: String(notification.created_at ?? row.created_at ?? new Date().toISOString()),
    imageUrl:
      typeof notification.image === 'string' && notification.image.trim()
        ? notification.image
        : typeof notification.image_url === 'string' && notification.image_url.trim()
          ? notification.image_url
          : undefined,
    actionType: notification.action_type ?? 'none',
    actionId: notification.action_id ?? undefined,
    data: metadata,
  };
}

export function matchesNotificationFilter(
  item: AppNotification,
  tab: NotificationFilterTab,
): boolean {
  if (tab === 'all') return true;
  if (tab === 'offers') {
    return ['offer', 'promotion', 'collection'].includes(item.type);
  }
  if (tab === 'appointments') return item.type === 'appointment';
  if (tab === 'support')
    return item.type === 'callback' || item.type === 'gold_rate' || item.type === 'support';
  return ['system', 'gold_rate', 'profile', 'order', 'lead', 'document', 'payment', 'approval'].includes(
    item.type,
  );
}

function userHeaders(userId: string): Record<string, string> {
  return { 'x-user-id': userId };
}

/** Customer reads go through backend API (bypasses RLS for dev-auth users without Supabase session). */
async function useCustomerNotificationApi(): Promise<boolean> {
  return isApiConfigured();
}

export async function fetchNotificationRecipient(
  userId: string,
  recipientId: string,
): Promise<AppNotification | null> {
  if (await useCustomerNotificationApi()) {
    return apiRequest<AppNotification | null>(
      { url: `/api/notifications/recipient/${recipientId}`, method: 'GET', params: { userId } },
      userHeaders(userId),
    );
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('user_notifications')
    .select(USER_NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .eq('id', recipientId)
    .maybeSingle();

  if (error) throw error;
  return data ? toAppNotification({ ...data, user_id: userId }) : null;
}

export async function ensureGeneratedNotifications(_userId: string): Promise<void> {
  // Event-driven notifications only; no client-side backfill.
}

export async function fetchNotificationsPage(
  userId: string,
  page: number,
  pageSize = PAGE_SIZE_DEFAULT,
): Promise<FetchNotificationsResult> {
  if (await useCustomerNotificationApi()) {
    const result = await apiRequest<FetchNotificationsResult>(
      {
        url: '/api/notifications',
        method: 'GET',
        params: { userId, page, pageSize },
      },
      userHeaders(userId),
    );
    return {
      items: result.items ?? [],
      hasMore: Boolean(result.hasMore),
    };
  }

  const client = requireSupabase();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await client
    .from('user_notifications')
    .select(USER_NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const items = (data ?? [])
    .map((row) => toAppNotification({ ...row, user_id: userId }))
    .filter((row): row is AppNotification => row !== null);

  return { items, hasMore: items.length === pageSize };
}

export async function markNotificationAsRead(userId: string, recipientId: string): Promise<void> {
  if (await useCustomerNotificationApi()) {
    await apiRequest(
      { url: `/api/notifications/${recipientId}/read`, method: 'PATCH', params: { userId } },
      userHeaders(userId),
    );
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from('user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', recipientId);
  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (await useCustomerNotificationApi()) {
    await apiRequest(
      { url: '/api/notifications/read-all', method: 'PATCH', params: { userId } },
      userHeaders(userId),
    );
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from('user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function deleteNotificationRecipient(
  userId: string,
  recipientId: string,
): Promise<void> {
  if (await useCustomerNotificationApi()) {
    await apiRequest(
      { url: `/api/notifications/${recipientId}`, method: 'DELETE', params: { userId } },
      userHeaders(userId),
    );
    return;
  }

  const client = requireSupabase();
  const { error } = await client
    .from('user_notifications')
    .delete()
    .eq('user_id', userId)
    .eq('id', recipientId);
  if (error) throw error;
}

export async function fetchUnreadNotificationsCount(userId: string): Promise<number> {
  if (await useCustomerNotificationApi()) {
    const result = await apiRequest<{ count: number }>(
      { url: '/api/notifications/unread-count', method: 'GET', params: { userId } },
      userHeaders(userId),
    );
    return result.count ?? 0;
  }

  const client = requireSupabase();
  const { count, error } = await client
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

type AppointmentNotificationInput = {
  userId: string;
  appointmentId: string;
  boutiqueId: string;
  boutiqueName?: string | null;
  date: string;
  time: string;
};

export async function createAppointmentBookedNotifications(
  input: AppointmentNotificationInput,
): Promise<void> {
  const client = requireSupabase();
  const {
    userId,
    appointmentId,
    boutiqueId,
    boutiqueName,
    date,
    time,
  } = input;

  await client.rpc('deliver_notification', {
    p_user_id: userId,
    p_title: '✅ Appointment Booked',
    p_message: `Your appointment request has been submitted successfully${boutiqueName ? ` with ${boutiqueName}` : ''} for ${date} at ${time}.`,
    p_type: 'appointment',
    p_image_url: null,
    p_action_type: 'appointment',
    p_action_id: appointmentId,
    p_metadata: {
      event_key: `appointment_booked:${appointmentId}:customer`,
      source_event: 'appointment_booked',
      route: '/(app)/appointments',
      appointmentId,
      boutiqueId,
    },
  });

  const { data: boutique } = await client
    .from('boutiques')
    .select('jeweller_user_id')
    .eq('id', boutiqueId)
    .maybeSingle();

  if (boutique?.jeweller_user_id) {
    await client.rpc('deliver_notification', {
      p_user_id: boutique.jeweller_user_id,
      p_title: 'New appointment request',
      p_message: `${boutiqueName ?? 'Your boutique'} has a new appointment booking for ${date} at ${time}.`,
      p_type: 'appointment',
      p_action_type: 'appointment',
      p_action_id: appointmentId,
      p_metadata: {
        event_key: `appointment_booked:${appointmentId}:boutique`,
        source_event: 'appointment_received',
        route: '/(app)/appointments',
        appointmentId,
        boutiqueId,
      },
    });
  }
}

export function resolveNotificationRoute(notification: AppNotification): {
  pathname: string;
  params?: Record<string, string>;
} | null {
  const data = notification.data ?? {};
  const route = typeof data.route === 'string' ? data.route : null;
  const routeParams =
    data.routeParams && typeof data.routeParams === 'object'
      ? (data.routeParams as Record<string, string>)
      : undefined;

  if (route) {
    return { pathname: route, params: routeParams };
  }

  switch (notification.actionType) {
    case 'offer':
      return { pathname: '/(app)/home' };
    case 'appointment':
      if (notification.actionId) {
        return {
          pathname: '/(app)/appointment-details',
          params: { id: String(notification.actionId) },
        };
      }
      return { pathname: '/(app)/appointments' };
    case 'collection':
      if (typeof data.slug === 'string') {
        return {
          pathname: '/(app)/collection/[slug]',
          params: { slug: data.slug },
        };
      }
      return { pathname: '/(app)/home' };
    case 'boutique':
      if (notification.actionId) {
        return {
          pathname: '/(app)/boutique-details',
          params: { id: String(notification.actionId) },
        };
      }
      return null;
    case 'callback':
      return { pathname: '/(app)/(tabs)/profile' };
    case 'support':
      return { pathname: '/(app)/chat' };
    case 'order':
      return { pathname: '/(app)/orders' };
    case 'url':
      return null;
    default:
      return null;
  }
}

export async function fetchNotificationSettings(userId: string): Promise<NotificationSettings> {
  if (!(await useCustomerNotificationApi())) {
    return {
      user_id: userId,
      offers_enabled: true,
      appointments_enabled: true,
      support_enabled: true,
      system_enabled: true,
      push_enabled: true,
    };
  }
  return getNotificationSettingsApi(userId);
}

export async function updateNotificationSettings(
  userId: string,
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  if (!(await useCustomerNotificationApi())) {
    throw new Error('Backend API URL is not configured');
  }
  return updateNotificationSettingsApi(userId, patch);
}

export async function registerPushToken(input: {
  userId: string;
  token: string;
  platform?: string;
  provider?: string;
}): Promise<void> {
  if (!(await useCustomerNotificationApi())) return;
  await registerPushTokenApi(input);
}
