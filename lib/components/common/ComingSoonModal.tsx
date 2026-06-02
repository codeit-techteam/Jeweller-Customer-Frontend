import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import {
  COMING_SOON_PLANS,
  type ComingSoonPlanId,
} from '@/lib/config/comingSoonPlans';
import { useComingSoonNotify } from '@/lib/services/comingSoonNotify';
import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#0A1F44';
const GOLD = '#c9a227';
const GOLD_SOFT = '#f7f0e3';
const MUTED = '#64748b';

type Props = {
  visible: boolean;
  planId: ComingSoonPlanId;
  onClose: () => void;
};

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.58}
      pressBehavior="close"
    />
  );
}

export function ComingSoonModal({ visible, planId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const registerInterest = useComingSoonNotify();
  const [submitting, setSubmitting] = useState(false);

  const config = COMING_SOON_PLANS[planId];
  const snapPoints = useMemo(() => ['58%'], []);
  const backdrop = useCallback(renderBackdrop, []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSecondary = useCallback(() => {
    sheetRef.current?.dismiss();
    onClose();
  }, [onClose]);

  const handleNotify = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await registerInterest(planId);
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Toast.show({
        type: 'success',
        text1: "You'll be notified when this feature launches.",
      });
      sheetRef.current?.dismiss();
      onClose();
    } catch (error) {
      if (__DEV__) console.warn('[ComingSoonModal] notify failed', error);
      Toast.show({
        type: 'error',
        text1: 'Could not save your preference. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, registerInterest, planId, onClose]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={backdrop}
      onDismiss={handleDismiss}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
      animationConfigs={{
        damping: 22,
        stiffness: 280,
        mass: 0.9,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.glassOverlay} pointerEvents="none">
          <BlurView intensity={36} tint="light" style={StyleSheet.absoluteFill} />
        </View>

        <LinearGradient
          colors={['#fdf8ee', '#fff', '#fff']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroBand}
        >
          <View style={styles.iconRing}>
            <LinearGradient
              colors={['#e8d5a8', GOLD, '#a67c1a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <MaterialIcons name={config.icon} size={30} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.soonPill}>
            <MaterialIcons name="auto-awesome" size={12} color={GOLD} />
            <Text style={styles.soonPillText}>Coming Soon</Text>
          </View>
        </LinearGradient>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.description}>{config.description}</Text>

        <View style={styles.featuresCard}>
          <Text style={styles.featuresEyebrow}>WHAT TO EXPECT</Text>
          {config.features.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <View style={styles.checkCircle}>
                <MaterialIcons name="check" size={14} color="#fff" />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            (pressed || submitting) && styles.primaryBtnPressed,
          ]}
          onPress={() => void handleNotify()}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Notify me when this feature launches"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="notifications-active" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Notify Me</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={handleSecondary}
          accessibilityRole="button"
          accessibilityLabel={config.secondaryLabel}
        >
          <Text style={styles.secondaryBtnText}>{config.secondaryLabel}</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 44,
    height: 4,
    backgroundColor: '#d4c4a8',
    borderRadius: 2,
  },
  sheetBg: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201,162,39,0.25)',
    ...Platform.select({
      ios: {
        shadowColor: NAVY,
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: { elevation: 14 },
      default: {},
    }),
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
  },
  heroBand: {
    alignItems: 'center',
    marginHorizontal: -spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(201,162,39,0.2)',
  },
  iconRing: {
    padding: 3,
    borderRadius: 40,
    backgroundColor: 'rgba(201,162,39,0.2)',
    marginBottom: spacing.sm,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  soonPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8a6d1f',
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: fontSizes.md,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  featuresCard: {
    backgroundColor: '#faf9f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efe8d8',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: 10,
  },
  featuresEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9a8548',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#1f2937',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: NAVY,
    paddingVertical: 16,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  primaryBtnPressed: {
    opacity: 0.92,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  secondaryBtnText: {
    color: GOLD,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});
