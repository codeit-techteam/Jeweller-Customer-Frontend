import { apiRequest } from '@/services/httpClient';
import { getVisitorId } from '@/lib/visitorId';
import type { PendingAction } from '@/lib/types/pendingAction';

type AnalyticsPayload = {
  eventType:
    | 'boutique_visit'
    | 'product_view'
    | 'guest_viewed_product'
    | 'guest_wishlist_attempt'
    | 'guest_cart_attempt'
    | 'guest_appointment_attempt'
    | 'guest_browsing'
    | 'guest_logout'
    | 'login_modal_opened'
    | 'login_success'
    | 'action_completed_after_login';
  boutiqueId?: string;
  productId?: string;
  userId?: string | null;
  source?: 'marketplace';
  metadata?: Record<string, string | number | boolean | null | undefined>;
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
      metadata: payload.metadata,
    },
  });
}

function postGuestEvent(
  eventType: AnalyticsPayload['eventType'],
  metadata?: AnalyticsPayload['metadata'],
): void {
  void postAnalyticsEvent({ eventType, metadata }).catch(() => undefined);
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

/** Guest opened a product detail page. */
export function trackGuestViewedProduct(productId: string, boutiqueId?: string): void {
  postGuestEvent('guest_viewed_product', { productId, boutiqueId });
}

/** Guest attempted a protected action — wishlist. */
export function trackGuestWishlistAttempt(productId: string): void {
  postGuestEvent('guest_wishlist_attempt', { productId });
}

/** Guest attempted add to cart (tracked for conversion). */
export function trackGuestCartAttempt(productId: string): void {
  postGuestEvent('guest_cart_attempt', { productId });
}

/** Guest attempted appointment / visit booking. */
export function trackGuestAppointmentAttempt(boutiqueId: string, productId?: string): void {
  postGuestEvent('guest_appointment_attempt', { boutiqueId, productId });
}

/** Login required bottom sheet opened. */
export function trackLoginModalOpened(trigger?: string): void {
  postGuestEvent('login_modal_opened', { trigger: trigger ?? 'unknown' });
}

/** Successful login / OTP verification. */
export function trackLoginSuccess(userId: string): void {
  void postAnalyticsEvent({ eventType: 'login_success', userId }).catch(() => undefined);
}

/** Pending action executed after login. */
export function trackActionCompletedAfterLogin(actionType: string): void {
  postGuestEvent('action_completed_after_login', { actionType });
}

/** Guest opened the app or resumed without an authenticated session. */
export function trackGuestBrowsing(): void {
  postGuestEvent('guest_browsing');
}

/** User signed out and returned to guest browsing. */
export function trackGuestLogout(): void {
  postGuestEvent('guest_logout');
}

/** Guest attempted login via protected action. */
export function trackGuestAuthAttempt(action: PendingAction): void {
  if (action.type === 'wishlist') {
    trackGuestWishlistAttempt(action.productId);
    return;
  }
  if (action.type === 'appointment' || action.type === 'book_visit') {
    trackGuestAppointmentAttempt(action.boutiqueId ?? '', action.productId);
  }
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
