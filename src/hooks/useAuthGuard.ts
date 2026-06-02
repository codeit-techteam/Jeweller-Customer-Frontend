import { useCallback } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useAuthGuardStore } from '@/lib/stores/authGuardStore';
import type { PendingAction } from '@/lib/types/pendingAction';
import {
  trackGuestAuthAttempt,
  trackLoginModalOpened,
} from '@/services/analyticsTracking';

type RequireAuthOptions = {
  pendingAction?: PendingAction;
  analyticsEvent?: string;
};

/**
 * Global auth guard for protected actions.
 *
 * @example
 * const requireAuth = useAuthGuard();
 * requireAuth(() => addToWishlist(product), {
 *   pendingAction: { type: 'wishlist', productId: product.id },
 * });
 */
export function useAuthGuard() {
  const { isAuthenticated } = useAuth();
  const openLoginModal = useAuthGuardStore((s) => s.openLoginModal);

  const requireAuth = useCallback(
    (action: () => void, options?: RequireAuthOptions) => {
      if (isAuthenticated) {
        action();
        return true;
      }

      if (options?.pendingAction) {
        openLoginModal(options.pendingAction);
      } else {
        openLoginModal();
      }

      trackLoginModalOpened(options?.analyticsEvent ?? options?.pendingAction?.type);
      if (options?.pendingAction) {
        trackGuestAuthAttempt(options.pendingAction);
      }
      return false;
    },
    [isAuthenticated, openLoginModal],
  );

  return requireAuth;
}

export function useIsGuest(): boolean {
  const { isGuest } = useAuth();
  return isGuest;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
