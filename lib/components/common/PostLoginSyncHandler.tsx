import React, { useEffect, useRef } from 'react';

import { useAuth } from '@/context/AuthContext';
import { handleLoginSuccess } from '@/lib/services/postLoginSync';
import { useGuestSessionStore } from '@/lib/stores/guestSessionStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { trackLoginSuccess } from '@/services/analyticsTracking';

/**
 * Watches auth state and runs post-login sync (cart merge, wishlist sync, pending actions).
 * Skips the initial session hydration so refresh does not re-run sync.
 */
export function PostLoginSyncHandler() {
  const { user, loading } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);
  const initialHydrationRef = useRef(true);
  const hydrateGuest = useGuestSessionStore((s) => s.hydrate);
  const hydrateCart = useCartStore((s) => s.hydrateCart);

  useEffect(() => {
    void hydrateGuest();
    void hydrateCart();
  }, [hydrateGuest, hydrateCart]);

  useEffect(() => {
    if (loading) return;

    const userId = user?.id ?? null;

    if (initialHydrationRef.current) {
      initialHydrationRef.current = false;
      prevUserIdRef.current = userId;
      return;
    }

    const prev = prevUserIdRef.current;
    if (userId && userId !== prev) {
      trackLoginSuccess(userId);
      void handleLoginSuccess(userId);
    }

    prevUserIdRef.current = userId;
  }, [user?.id, loading]);

  return null;
}
