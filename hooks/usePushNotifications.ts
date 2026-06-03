import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import {
  attachPushNotificationListeners,
  syncPushTokenForUser,
} from '@/lib/services/pushNotifications';

export function usePushNotificationsBootstrap(): void {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    void syncPushTokenForUser(user.id);
    const detach = attachPushNotificationListeners(user.id);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncPushTokenForUser(user.id);
      }
    });

    return () => {
      detach();
      sub.remove();
    };
  }, [user?.id]);
}
