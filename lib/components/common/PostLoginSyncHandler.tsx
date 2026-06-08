import React, { useEffect, useRef } from 'react';

import { useAuth } from '@/context/AuthContext';
import { handleLoginSuccess } from '@/lib/services/postLoginSync';
import { useGuestSessionStore } from '@/lib/stores/guestSessionStore';
import { trackGuestBrowsing, trackLoginSuccess } from '@/services/analyticsTracking';

/**
 * Watches auth state and runs post-login sync (wishlist sync, pending actions).
 * Skips the initial session hydration so refresh does not re-run sync.
 */
export function PostLoginSyncHandler() {
  const { user, loading } = useAuth();
  const prevUserIdRef = useRef<string | null>(null);
  const initialHydrationRef = useRef(true);
  const guestBrowsingTrackedRef = useRef(false);
  const hydrateGuest = useGuestSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateGuest();
  }, [hydrateGuest]);

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

  useEffect(() => {
    if (loading || user?.id || guestBrowsingTrackedRef.current) return;
    guestBrowsingTrackedRef.current = true;
    trackGuestBrowsing();
  }, [loading, user?.id]);

  return null;
}
