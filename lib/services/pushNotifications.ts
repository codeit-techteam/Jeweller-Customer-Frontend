import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { registerPushToken } from '@/lib/services/notifications';
import { useNotificationsStore } from '@/lib/stores/notificationsStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export async function ensurePushPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  const granted = await ensurePushPermissions();
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'GehnaHub',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    process.env.EAS_PROJECT_ID ??
    undefined;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return tokenResponse.data ?? null;
}

export async function syncPushTokenForUser(userId: string): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;
    await registerPushToken({
      userId,
      token,
      platform: Platform.OS,
      provider: 'expo',
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('[push] Failed to register token', error);
    }
  }
}

export function attachPushNotificationListeners(userId: string | null) {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    if (AppState.currentState === 'active') {
      return;
    }

    const content = notification.request.content;
    const data = (content.data ?? {}) as Record<string, unknown>;

    useNotificationsStore.setState({
      incomingBanner: {
        id: String(data.userNotificationId ?? notification.request.identifier),
        title: content.title ?? 'Notification',
        body: content.body ?? '',
        notification: {
          id: String(data.userNotificationId ?? notification.request.identifier),
          notificationId: String(data.notificationId ?? ''),
          userId: userId ?? '',
          title: content.title ?? 'Notification',
          body: content.body ?? '',
          type: 'system',
          isRead: false,
          createdAt: new Date().toISOString(),
          data,
        },
      },
    });
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
    // Navigation handled by notification center when user opens from tray.
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
