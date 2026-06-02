import { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useNotificationsStore } from '@/lib/stores/notificationsStore';

export function useNotificationsBootstrap(): void {
  const { user } = useAuth();
  const initialize = useNotificationsStore((s) => s.initializeForUser);
  const clear = useNotificationsStore((s) => s.clear);

  useEffect(() => {
    if (!user?.id) {
      clear();
      return;
    }
    void initialize(user.id);
  }, [user?.id, initialize, clear]);
}

export function useUnreadNotificationsCount(): number {
  return useNotificationsStore((s) => s.unreadCount);
}
