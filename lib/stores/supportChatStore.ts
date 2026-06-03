import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';

import {
  fetchOpenConversation,
  fetchSupportMessages,
  markCustomerMessagesRead,
  sendSupportMessage,
  setCustomerTyping,
  startSupportConversation,
  type SupportConversation,
  type SupportMessage,
} from '@/lib/services/supportChat';
import { getSupabase } from '@/lib/supabaseClient';

const POLL_MS = 2500;

type SupportChatState = {
  userId: string | null;
  conversation: SupportConversation | null;
  messages: SupportMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  agentTyping: boolean;
  channel: RealtimeChannel | null;
  pollTimer: ReturnType<typeof setInterval> | null;
  lastMessageCount: number;
  initialize: (userId: string, customerName?: string) => Promise<void>;
  refreshMessages: (opts?: { silent?: boolean }) => Promise<void>;
  sendText: (text: string, opts?: { quickReply?: boolean }) => Promise<void>;
  sendAttachment: (
    attachmentUrl: string,
    messageType: 'image' | 'pdf',
    caption?: string,
  ) => Promise<void>;
  notifyTyping: (isTyping: boolean) => void;
  startSync: () => void;
  stopSync: () => void;
  clear: () => void;
};

function sortMessages(rows: SupportMessage[]) {
  return [...rows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function mergeMessages(existing: SupportMessage[], incoming: SupportMessage[]) {
  const map = new Map<string, SupportMessage>();
  for (const row of existing) {
    if (!row.id.startsWith('temp-')) map.set(row.id, row);
  }
  for (const row of incoming) map.set(row.id, row);
  return sortMessages([...map.values()]);
}

function mapRealtimeRow(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    senderType: row.sender_type as SupportMessage['senderType'],
    senderId: (row.sender_id as string) ?? null,
    message: String(row.message ?? ''),
    messageType: String(row.message_type ?? 'text'),
    attachmentUrl: (row.attachment_url as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    deliveryStatus: row.delivery_status as SupportMessage['deliveryStatus'],
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at),
  };
}

function isSupportMessage(payload: unknown): payload is SupportMessage {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as SupportMessage;
  return typeof p.id === 'string' && typeof p.senderType === 'string';
}

function bindBroadcast(
  conversationId: string,
  userId: string,
  set: (partial: Partial<SupportChatState> | ((s: SupportChatState) => Partial<SupportChatState>)) => void,
  get: () => SupportChatState,
) {
  const supabase = getSupabase();
  if (!supabase) return;

  get().stopSync();

  const channel = supabase
    .channel(`support:${conversationId}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'message:new' }, ({ payload }) => {
      if (!isSupportMessage(payload)) return;
      const state = get();
      if (state.messages.some((m) => m.id === payload.id)) return;
      set({ messages: mergeMessages(state.messages, [payload]) });
      if (payload.senderType !== 'customer') {
        void markCustomerMessagesRead(userId, conversationId);
      }
    })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      const p = payload as { participantType?: string; isTyping?: boolean };
      if (p?.participantType === 'agent') {
        set({ agentTyping: Boolean(p.isTyping) });
      }
    })
    .on('broadcast', { event: 'messages:read' }, ({ payload }) => {
      const p = payload as { readerType?: string };
      if (p?.readerType === 'agent') {
        const state = get();
        set({
          messages: state.messages.map((m) =>
            m.senderType === 'customer'
              ? { ...m, deliveryStatus: 'read' as const, isRead: true }
              : m,
          ),
        });
      }
      if (p?.readerType === 'customer') {
        const state = get();
        set({
          messages: state.messages.map((m) =>
            m.senderType !== 'customer'
              ? { ...m, deliveryStatus: 'read' as const, isRead: true }
              : m,
          ),
        });
      }
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const mapped = mapRealtimeRow(payload.new as Record<string, unknown>);
        const state = get();
        if (state.messages.some((m) => m.id === mapped.id)) return;
        set({ messages: mergeMessages(state.messages, [mapped]) });
        if (mapped.senderType !== 'customer') {
          void markCustomerMessagesRead(userId, conversationId);
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const id = String(row.id);
        const state = get();
        set({
          messages: state.messages.map((m) =>
            m.id === id
              ? {
                  ...m,
                  deliveryStatus: row.delivery_status as SupportMessage['deliveryStatus'],
                  isRead: Boolean(row.is_read),
                }
              : m,
          ),
        });
      },
    )
    .subscribe();

  const pollTimer = setInterval(() => {
    void get().refreshMessages({ silent: true });
  }, POLL_MS);

  set({ channel, pollTimer });
}

export const useSupportChatStore = create<SupportChatState>((set, get) => ({
  userId: null,
  conversation: null,
  messages: [],
  loading: false,
  sending: false,
  error: null,
  agentTyping: false,
  channel: null,
  pollTimer: null,
  lastMessageCount: 0,

  clear: () => {
    get().stopSync();
    set({
      userId: null,
      conversation: null,
      messages: [],
      loading: false,
      sending: false,
      error: null,
      agentTyping: false,
      lastMessageCount: 0,
    });
  },

  stopSync: () => {
    const { channel, pollTimer } = get();
    const supabase = getSupabase();
    if (pollTimer) clearInterval(pollTimer);
    if (supabase && channel) supabase.removeChannel(channel);
    set({ channel: null, pollTimer: null, agentTyping: false });
  },

  startSync: () => {
    const { userId, conversation } = get();
    if (userId && conversation?.id) {
      bindBroadcast(conversation.id, userId, set, get);
    }
  },

  initialize: async (userId, customerName) => {
    set({ loading: true, error: null, userId });
    get().stopSync();
    try {
      let conversation =
        (await fetchOpenConversation(userId)).conversation ?? null;
      if (!conversation) {
        const started = await startSupportConversation(userId, customerName);
        conversation = started.conversation;
      }
      const messages = await fetchSupportMessages(userId, conversation.id);
      set({
        conversation,
        messages: sortMessages(messages),
        loading: false,
        lastMessageCount: messages.length,
      });
      await markCustomerMessagesRead(userId, conversation.id);
      get().startSync();
    } catch (error: unknown) {
      set({
        loading: false,
        error:
          error instanceof Error ? error.message : 'Unable to load support chat.',
      });
    }
  },

  refreshMessages: async (opts) => {
    const { userId, conversation, lastMessageCount } = get();
    if (!userId || !conversation) return;
    try {
      const messages = await fetchSupportMessages(userId, conversation.id);
      const merged = sortMessages(messages);
      const state = get();
      const prevLast = state.messages[state.messages.length - 1]?.id;
      const nextLast = merged[merged.length - 1]?.id;
      if (opts?.silent && prevLast === nextLast && merged.length === state.messages.length) {
        return;
      }
      set({
        messages: mergeMessages(state.messages, merged),
        lastMessageCount: merged.length,
      });
      if (merged.length > state.lastMessageCount) {
        await markCustomerMessagesRead(userId, conversation.id);
      }
    } catch {
      /* silent poll */
    }
  },

  notifyTyping: (isTyping) => {
    const { userId, conversation } = get();
    if (!userId || !conversation) return;
    void setCustomerTyping(userId, conversation.id, isTyping).catch(() => {});
  },

  sendText: async (text, opts) => {
    const { userId, conversation, sending } = get();
    if (!userId || !conversation || sending) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: SupportMessage = {
      id: tempId,
      conversationId: conversation.id,
      senderType: 'customer',
      senderId: userId,
      message: trimmed,
      messageType: 'text',
      attachmentUrl: null,
      metadata: {},
      deliveryStatus: 'sent',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      sending: true,
      messages: [...state.messages, optimistic],
    }));

    try {
      const saved = await sendSupportMessage(userId, conversation.id, {
        message: trimmed,
        quickReply: opts?.quickReply,
      });
      set((state) => ({
        sending: false,
        messages: mergeMessages(
          state.messages.filter((m) => m.id !== tempId),
          [saved],
        ),
        lastMessageCount: state.messages.length,
      }));
    } catch (error: unknown) {
      set((state) => ({
        sending: false,
        messages: state.messages.filter((m) => m.id !== tempId),
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  },

  sendAttachment: async (attachmentUrl, messageType, caption) => {
    const { userId, conversation, sending } = get();
    if (!userId || !conversation || sending) return;
    set({ sending: true });
    try {
      const saved = await sendSupportMessage(userId, conversation.id, {
        message: caption ?? '',
        messageType,
        attachmentUrl,
      });
      set((state) => ({
        sending: false,
        messages: mergeMessages(state.messages, [saved]),
      }));
    } catch (error: unknown) {
      set({
        sending: false,
        error: error instanceof Error ? error.message : 'Failed to send attachment',
      });
    }
  },
}));
