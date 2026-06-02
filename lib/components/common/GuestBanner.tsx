import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useGuestSessionStore } from '@/lib/stores/guestSessionStore';
import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#0A1F44';
const GOLD = '#c29a33';

export function GuestBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGuest } = useAuth();
  const bannerDismissed = useGuestSessionStore((s) => s.bannerDismissed);
  const dismissBanner = useGuestSessionStore((s) => s.dismissBanner);

  const onLogin = useCallback(() => {
    router.push('/(auth)/login');
  }, [router]);

  const onDismiss = useCallback(() => {
    void dismissBanner();
  }, [dismissBanner]);

  if (!isGuest || bannerDismissed) return null;

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.banner}>
        <MaterialIcons name="info-outline" size={18} color={GOLD} style={styles.icon} />
        <Text style={styles.text} numberOfLines={2}>
          Login to save your wishlist, appointments and cart.
        </Text>
        <Pressable style={styles.cta} onPress={onLogin} hitSlop={8}>
          <Text style={styles.ctaText}>Login Now</Text>
        </Pressable>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityLabel="Dismiss banner">
          <MaterialIcons name="close" size={18} color="#94a3b8" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: spacing.md,
    pointerEvents: 'box-none',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,31,68,0.94)',
    borderRadius: 14,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(194,154,51,0.35)',
  },
  icon: { flexShrink: 0 },
  text: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: fontSizes.xs,
    lineHeight: 16,
    fontWeight: '500',
  },
  cta: {
    backgroundColor: GOLD,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 0,
  },
  ctaText: {
    color: NAVY,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
