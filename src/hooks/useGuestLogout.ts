import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useGuestSessionStore } from '@/lib/stores/guestSessionStore';
import { useSavedBoutiquesStore } from '@/lib/stores/savedBoutiquesStore';
import { useSupportChatStore } from '@/lib/stores/supportChatStore';
import { trackGuestLogout } from '@/services/analyticsTracking';

type GuestLogoutOptions = {
  /** Navigate to home after clearing session (default: true). */
  redirectToHome?: boolean;
};

/**
 * Ends the authenticated session and returns the user to guest browsing mode.
 * Never routes to the login screen.
 */
export function useGuestLogout() {
  const router = useRouter();
  const { logout } = useAuth();
  const clearSavedBoutiques = useSavedBoutiquesStore((s) => s.clear);
  const clearSupportChat = useSupportChatStore((s) => s.clear);

  const performGuestLogout = useCallback(
    async (options?: GuestLogoutOptions) => {
      const redirectToHome = options?.redirectToHome !== false;

      await logout();
      clearSavedBoutiques();
      clearSupportChat();
      trackGuestLogout();
      void useGuestSessionStore.getState().dismissBanner();

      if (redirectToHome) {
        router.replace('/(app)/home');
      }
    },
    [logout, clearSavedBoutiques, clearSupportChat, router],
  );

  return performGuestLogout;
}
