import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthGuardStore } from '@/lib/stores/authGuardStore';
import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#0A1F44';
const GOLD = '#c29a33';
const MUTED = '#64748b';

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.55}
      pressBehavior="close"
    />
  );
}

export function LoginRequiredSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const visible = useAuthGuardStore((s) => s.visible);
  const closeLoginModal = useAuthGuardStore((s) => s.closeLoginModal);
  const snapPoints = useMemo(() => ['42%'], []);
  const backdrop = useCallback(renderBackdrop, []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const onDismiss = useCallback(() => {
    closeLoginModal();
  }, [closeLoginModal]);

  const onLogin = useCallback(() => {
    closeLoginModal();
    router.push('/(auth)/login');
  }, [closeLoginModal, router]);

  const onMaybeLater = useCallback(() => {
    closeLoginModal();
  }, [closeLoginModal]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={backdrop}
      onDismiss={onDismiss}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.glassOverlay} pointerEvents="none">
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        </View>

        <View style={styles.iconCircle}>
          <MaterialIcons name="lock-outline" size={28} color={NAVY} />
        </View>

        <Text style={styles.title}>Login Required</Text>
        <Text style={styles.description}>
          Please login to continue and save your activity across devices.
        </Text>

        <Pressable style={styles.primaryBtn} onPress={onLogin}>
          <MaterialIcons name="phone-iphone" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Continue with Mobile Number</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={onMaybeLater}>
          <Text style={styles.secondaryBtnText}>Maybe Later</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 44,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
  },
  sheetBg: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      ios: {
        shadowColor: NAVY,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10,31,68,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSizes.md,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: NAVY,
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: spacing.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  secondaryBtnText: {
    color: GOLD,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});
