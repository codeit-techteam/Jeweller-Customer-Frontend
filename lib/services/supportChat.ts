import { apiRequest, getResolvedApiOrigin } from '@/services/httpClient';
import { getSupabase } from '@/lib/supabaseClient';

export type SupportAgent = {
  id: string;
  name: string;
  email: string | null;
  status: 'online' | 'away' | 'offline';
  department: string;
};

export type SupportConversation = {
  id: string;
  customerId: string;
  customerName: string | null;
  ticketNumber: string;
  status: string;
  assignedAgentId: string | null;
  assignedAgent: SupportAgent | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  senderType: 'customer' | 'agent' | 'system';
  senderId: string | null;
  message: string;
  messageType: string;
  attachmentUrl: string | null;
  metadata: Record<string, unknown>;
  deliveryStatus: 'sent' | 'delivered' | 'read';
  isRead: boolean;
  createdAt: string;
};

function userHeaders(userId: string) {
  return { 'x-user-id': userId };
}

export async function fetchOpenConversation(userId: string) {
  return apiRequest<{ conversation: SupportConversation | null }>({
    method: 'GET',
    url: '/api/support/conversations',
    params: { userId },
    headers: userHeaders(userId),
  });
}

export async function startSupportConversation(userId: string, customerName?: string) {
  return apiRequest<{ conversation: SupportConversation; created: boolean }>({
    method: 'POST',
    url: '/api/support/conversations',
    data: { customerName },
    headers: userHeaders(userId),
  });
}

export async function fetchConversationHistory(userId: string) {
  return apiRequest<SupportConversation[]>({
    method: 'GET',
    url: '/api/support/conversations/history',
    params: { userId },
    headers: userHeaders(userId),
  });
}

export async function fetchSupportMessages(
  userId: string,
  conversationId: string,
  opts?: { before?: string; limit?: number },
) {
  return apiRequest<SupportMessage[]>({
    method: 'GET',
    url: `/api/support/conversations/${conversationId}/messages`,
    params: { userId, before: opts?.before, limit: opts?.limit ?? 50 },
    headers: userHeaders(userId),
  });
}

export async function sendSupportMessage(
  userId: string,
  conversationId: string,
  payload: {
    message?: string;
    quickReply?: boolean;
    messageType?: string;
    attachmentUrl?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  return apiRequest<SupportMessage>({
    method: 'POST',
    url: `/api/support/conversations/${conversationId}/messages`,
    data: payload,
    headers: userHeaders(userId),
  });
}

export async function setCustomerTyping(
  userId: string,
  conversationId: string,
  isTyping: boolean,
) {
  return apiRequest({
    method: 'POST',
    url: `/api/support/conversations/${conversationId}/typing`,
    data: { isTyping },
    headers: userHeaders(userId),
  });
}

export async function markCustomerMessagesRead(userId: string, conversationId: string) {
  return apiRequest({
    method: 'POST',
    url: `/api/support/conversations/${conversationId}/read`,
    data: {},
    headers: userHeaders(userId),
  });
}

export async function submitSupportRating(
  userId: string,
  conversationId: string,
  rating: number,
  feedback?: string,
) {
  return apiRequest({
    method: 'POST',
    url: `/api/support/conversations/${conversationId}/rating`,
    data: { rating, feedback },
    headers: userHeaders(userId),
  });
}

export async function uploadSupportAttachment(userId: string, uri: string, mimeType: string) {
  const origin = getResolvedApiOrigin();
  const form = new FormData();
  const name = mimeType.includes('pdf') ? 'document.pdf' : 'photo.jpg';
  form.append('file', { uri, name, type: mimeType } as unknown as Blob);
  form.append('userId', userId);

  const headers: Record<string, string> = {};
  const client = getSupabase();
  if (client) {
    const session = await client.auth.getSession();
    const token = session.data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${origin}/api/uploads/support-attachment`, {
    method: 'POST',
    body: form,
    headers,
  });
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message ?? 'Upload failed');
  }
  return json.data as {
    url: string;
    messageType: 'image' | 'pdf';
  };
}
