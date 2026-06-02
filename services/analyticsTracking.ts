import { apiRequest } from '@/services/httpClient';
import { getVisitorId } from '@/lib/visitorId';

type AnalyticsPayload = {
  eventType: 'boutique_visit' | 'product_view';
  boutiqueId: string;
  productId?: string;
  userId?: string | null;
  source?: 'marketplace';
};

async function postAnalyticsEvent(payload: AnalyticsPayload): Promise<void> {
  const visitorId = await getVisitorId();
  await apiRequest({
    url: '/api/analytics/events',
    method: 'POST',
    data: {
    eventType: payload.eventType,
    boutiqueId: payload.boutiqueId,
    productId: payload.productId,
    visitorId: payload.userId ? undefined : visitorId,
    userId: payload.userId ?? undefined,
    source: payload.source ?? 'marketplace',
    },
  });
}

/** Store open — counts toward jeweller Unique Visitors (once per day per device). */
export function recordBoutiqueVisitAnalytics(
  boutiqueId: string,
  userId?: string | null,
): void {
  void postAnalyticsEvent({
    eventType: 'boutique_visit',
    boutiqueId,
    userId,
  }).catch(() => undefined);
}

/** Product detail open — Product Views metric only. */
export function recordProductViewAnalytics(
  boutiqueId: string,
  productId: string,
  userId?: string | null,
): void {
  void postAnalyticsEvent({
    eventType: 'product_view',
    boutiqueId,
    productId,
    userId,
  }).catch(() => undefined);
}

/** Call after customer login/signup so guest + logged-in are one person. */
export function linkVisitorToCustomerUser(userId: string): void {
  void (async () => {
    const visitorId = await getVisitorId();
    await apiRequest({
      url: '/api/analytics/link-visitor',
      method: 'POST',
      data: { visitorId, userId },
    });
  })().catch(() => undefined);
}
