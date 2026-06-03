import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveNotificationRoute } from '@/lib/services/notifications';
import { useNotificationsStore } from '@/lib/stores/notificationsStore';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const AUTO_HIDE_MS = 5000;

export function InAppNotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const banner = useNotificationsStore((s) => s.incomingBanner);
  const dismissBanner = useNotificationsStore((s) => s.dismissBanner);
  const markRead = useNotificationsStore((s) => s.markRead);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    clearTimer();
    if (!banner) return;

    timerRef.current = setTimeout(() => {
      dismissBanner();
    }, AUTO_HIDE_MS);

    return clearTimer;
  }, [banner, dismissBanner]);

  if (!banner) return null;

  const handleView = () => {
    clearTimer();
    const route = resolveNotificationRoute(banner.notification);
    void markRead(banner.id);
    dismissBanner();
    if (route) {
      router.push({ pathname: route.pathname as never, params: route.params as never });
    } else {
      router.push('/(app)/notifications');
    }
  };

  const handleDismiss = () => {
    clearTimer();
    dismissBanner();
  };

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      <Animated.View
        entering={SlideInUp.duration(280)}
        exiting={SlideOutUp.duration(220)}
        style={styles.cardWrap}
      >
        <Animated.View entering={FadeIn.duration(220)} style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="notifications-active" size={22} color="#1e40af" />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.title} numberOfLines={1}>
              {banner.title}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {banner.body}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={handleView}
            style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
          >
            <Text style={styles.viewText}>View</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleDismiss}
            style={({ pressed }) => [styles.dismissBtn, pressed && styles.pressed]}
          >
            <Text style={styles.dismissText}>Dismiss</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
  },
  cardWrap: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#0f172a',
  },
  message: {
    marginTop: 2,
    fontSize: fontSizes.xs,
    color: '#64748b',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  dismissBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  pressed: {
    opacity: 0.88,
  },
});
