import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabaseClient';

export type AppNotificationType =
  | 'lead'
  | 'order'
  | 'system'
  | 'document'
  | 'payment'
  | 'approval'
  | 'appointment'
  | 'offer'
  | 'collection';

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: AppNotificationType;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown>;
};

export type FetchNotificationsResult = {
  items: AppNotification[];
  hasMore: boolean;
};

const PAGE_SIZE_DEFAULT = 20;

function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error('Notifications require Supabase configuration.');
  }
  return client;
}

function toAppNotification(row: any): AppNotification {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    type: (row.type ?? 'system') as AppNotificationType,
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    data: (row.data ?? {}) as Record<string, unknown>,
  };
}

async function getExistingEventKeys(client: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await client
    .from('notifications')
    .select('data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) throw error;

  const keys = new Set<string>();
  for (const row of data ?? []) {
    const key = (row?.data as Record<string, unknown> | undefined)?.event_key;
    if (typeof key === 'string' && key.trim().length > 0) {
      keys.add(key);
    }
  }
  return keys;
}

export async function ensureGeneratedNotifications(userId: string): Promise<void> {
  const client = requireSupabase();
  const existingKeys = await getExistingEventKeys(client, userId);

  const toInsert: Array<Record<string, unknown>> = [];

  const { data: appointments } = await client
    .from('appointments')
    .select('id, date, time, status, boutique:boutiques(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  for (const item of appointments ?? []) {
    const key = `appointment_booked:${item.id}`;
    if (existingKeys.has(key)) continue;
    toInsert.push({
      user_id: userId,
      title: 'Appointment booked',
      body: `Your appointment${item?.boutique?.name ? ` with ${item.boutique.name}` : ''} is confirmed.`,
      type: 'system',
      is_read: false,
      data: {
        event_key: key,
        source_event: 'appointment_booked',
        route: '/(app)/appointments',
        appointmentId: item.id,
      },
    });
  }

  const { data: orders } = await client
    .from('platform_orders')
    .select('id, status, amount, product:products(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  for (const item of orders ?? []) {
    const key = `order_update:${item.id}:${item.status ?? 'unknown'}`;
    if (existingKeys.has(key)) continue;
    toInsert.push({
      user_id: userId,
      title: 'Order update',
      body: `${item?.product?.name ?? 'Your order'} is now ${String(item.status ?? 'updated')}.`,
      type: 'order',
      is_read: false,
      data: {
        event_key: key,
        source_event: 'order_update',
        route: '/(app)/orders',
        orderId: item.id,
        status: item.status,
      },
    });
  }

  const { data: offers } = await client
    .from('offers')
    .select('id, title, subtitle, is_active')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(10);

  for (const item of offers ?? []) {
    const key = `offer:${item.id}`;
    if (existingKeys.has(key)) continue;
    toInsert.push({
      user_id: userId,
      title: item.title ?? 'Boutique offer',
      body: item.subtitle ?? 'New offer is now live for you.',
      type: 'system',
      is_read: false,
      data: {
        event_key: key,
        source_event: 'boutique_offer',
        route: '/(app)/home',
        offerId: item.id,
      },
    });
  }

  const { data: collections } = await client
    .from('collections')
    .select('id, title, subtitle, slug, is_active')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(10);

  for (const item of collections ?? []) {
    const key = `collection:${item.id}`;
    if (existingKeys.has(key)) continue;
    toInsert.push({
      user_id: userId,
      title: item.title ?? 'New collection',
      body: item.subtitle ?? 'Explore our latest jewellery collection.',
      type: 'system',
      is_read: false,
      data: {
        event_key: key,
        source_event: 'new_collection',
        route: '/(app)/collection/[slug]',
        routeParams: { slug: item.slug },
        collectionId: item.id,
      },
    });
  }

  const { data: announcements } = await client
    .from('admin_activity_logs')
    .select('id, action, metadata')
    .order('created_at', { ascending: false })
    .limit(10);

  for (const item of announcements ?? []) {
    const action = String(item.action ?? '');
    if (!action.toLowerCase().includes('announce') && !action.toLowerCase().includes('system')) continue;
    const key = `system_announcement:${item.id}`;
    if (existingKeys.has(key)) continue;
    const metadata = (item.metadata ?? {}) as Record<string, unknown>;
    toInsert.push({
      user_id: userId,
      title: String(metadata.title ?? 'System announcement'),
      body: String(metadata.message ?? 'There is a new system update.'),
      type: 'system',
      is_read: false,
      data: {
        event_key: key,
        source_event: 'system_announcement',
        route: '/(app)/home',
      },
    });
  }

  if (toInsert.length === 0) return;

  const { error } = await client.from('notifications').insert(toInsert);
  if (error) {
    // Notification generation should not block screen rendering.
    console.warn('[notifications] Failed to generate event notifications', error.message);
  }
}

export async function fetchNotificationsPage(
  userId: string,
  page: number,
  pageSize = PAGE_SIZE_DEFAULT,
): Promise<FetchNotificationsResult> {
  const client = requireSupabase();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await client
    .from('notifications')
    .select('id, user_id, title, body, type, is_read, data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const items = (data ?? []).map(toAppNotification);
  return { items, hasMore: items.length === pageSize };
}

export async function markNotificationAsRead(userId: string, id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function fetchUnreadNotificationsCount(userId: string): Promise<number> {
  const client = requireSupabase();
  const { count, error } = await client
    .from('notifications')
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

/**
 * Writes appointment-booked notifications immediately so realtime subscribers
 * receive them while app is running (instead of waiting for next refresh).
 */
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

  const baseData = {
    source_event: 'appointment_booked',
    route: '/(app)/appointments',
    appointmentId,
    boutiqueId,
  };

  const rows: Array<Record<string, unknown>> = [
    {
      user_id: userId,
      title: 'Appointment booked',
      body: `Your appointment${boutiqueName ? ` with ${boutiqueName}` : ''} is confirmed for ${date} at ${time}.`,
      type: 'system',
      is_read: false,
      data: {
        ...baseData,
        event_key: `appointment_booked:${appointmentId}:customer`,
      },
    },
  ];

  // Also notify boutique owner (if mapped) so boutique-side apps can consume same table.
  const { data: boutique, error: boutiqueErr } = await client
    .from('boutiques')
    .select('jeweller_user_id')
    .eq('id', boutiqueId)
    .maybeSingle();

  if (!boutiqueErr && boutique?.jeweller_user_id) {
    rows.push({
      user_id: boutique.jeweller_user_id,
      title: 'New appointment request',
      body: `${boutiqueName ?? 'Your boutique'} has a new appointment booking for ${date} at ${time}.`,
      type: 'system',
      is_read: false,
      data: {
        source_event: 'appointment_received',
        route: '/(app)/appointments',
        appointmentId,
        boutiqueId,
        event_key: `appointment_booked:${appointmentId}:boutique`,
      },
    });
  }

  const { error } = await client.from('notifications').insert(rows);
  if (error) {
    console.warn('[notifications] Failed to create appointment notification', error.message);
  }
}
