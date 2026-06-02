import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { MAP_PLACEHOLDER_URI } from '@/lib/services/mock/imageUrls';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#1e293b';
const LABEL = '#9ca3af';
const MUTED = '#64748b';
const CARD_BG = '#f8f9fa';
const LINE = '#e5e7eb';

const AnimatedPath = Animated.createAnimatedComponent(Path);
type Stage = 'processing' | 'success' | 'details';

function paramStr(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function AppointmentBookedScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('processing');
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const params = useLocalSearchParams<{
    boutiqueName?: string | string[];
    boutiqueId?: string | string[];
    date?: string | string[];
    time?: string | string[];
    address?: string | string[];
  }>();

  const boutiqueName = useMemo(() => paramStr(params.boutiqueName), [params.boutiqueName]);
  const date = useMemo(() => paramStr(params.date), [params.date]);
  const time = useMemo(() => paramStr(params.time), [params.time]);
  const address = useMemo(() => paramStr(params.address), [params.address]);

  const dateTimeLine = [date, time].filter(Boolean).join(', ');

  const ringRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const successCircleScale = useSharedValue(0.2);
  const successCircleOpacity = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const checkProgress = useSharedValue(0);
  const rippleScale = useSharedValue(0.8);
  const rippleOpacity = useSharedValue(0);
  const confettiProgress = useSharedValue(0);
  const headerReveal = useSharedValue(0);
  const cardReveal = useSharedValue(0);
  const quoteReveal = useSharedValue(0);

  useEffect(() => {
    ringRotation.value = withRepeat(withTiming(360, { duration: 1500, easing: Easing.linear }), -1, false);
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    processingTimerRef.current = setTimeout(() => {
      setStage('success');
    }, 1900);

    return () => {
      if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [pulseScale, ringRotation]);

  useEffect(() => {
    if (stage !== 'success') return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
    successCircleOpacity.value = withTiming(1, { duration: 180 });
    successCircleScale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    iconScale.value = withSequence(
      withTiming(1.1, { duration: 260, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) })
    );
    checkProgress.value = withDelay(210, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    rippleOpacity.value = withDelay(130, withTiming(0.28, { duration: 120 }));
    rippleScale.value = withDelay(130, withTiming(1.9, { duration: 760, easing: Easing.out(Easing.quad) }));
    rippleOpacity.value = withDelay(130, withTiming(0, { duration: 760, easing: Easing.out(Easing.quad) }));
    confettiProgress.value = withDelay(320, withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }));

    successTimerRef.current = setTimeout(() => {
      setStage('details');
    }, 1150);
  }, [
    checkProgress,
    confettiProgress,
    iconScale,
    rippleOpacity,
    rippleScale,
    stage,
    successCircleOpacity,
    successCircleScale,
  ]);

  useEffect(() => {
    if (stage !== 'details') return;

    headerReveal.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    cardReveal.value = withDelay(130, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
    quoteReveal.value = withDelay(260, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
  }, [cardReveal, headerReveal, quoteReveal, stage]);

  const processingRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const processingPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const successCircleStyle = useAnimatedStyle(() => ({
    opacity: successCircleOpacity.value,
    transform: [{ scale: successCircleScale.value }],
  }));

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiProgress.value,
    transform: [
      {
        translateY: interpolate(confettiProgress.value, [0, 1], [8, -18]),
      },
    ],
  }));

  const headerRevealStyle = useAnimatedStyle(() => ({
    opacity: headerReveal.value,
    transform: [{ translateY: interpolate(headerReveal.value, [0, 1], [14, 0]) }],
  }));

  const cardRevealStyle = useAnimatedStyle(() => ({
    opacity: cardReveal.value,
    transform: [{ translateY: interpolate(cardReveal.value, [0, 1], [16, 0]) }],
  }));

  const quoteRevealStyle = useAnimatedStyle(() => ({
    opacity: quoteReveal.value,
    transform: [{ translateY: interpolate(quoteReveal.value, [0, 1], [10, 0]) }],
  }));

  const checkAnimatedProps = useAnimatedProps(() => {
    const fullLength = 34;
    return {
      strokeDashoffset: fullLength * (1 - checkProgress.value),
    };
  });

  const goHome = () => {
    router.replace('/(app)/home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={styles.headerSlot}>
          <Pressable hitSlop={14} onPress={goHome} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialIcons name="close" size={26} color="#374151" />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>CONFIRMATION</Text>
        </View>
        <View style={styles.headerSlot} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={stage === 'details'}
      >
        <Animated.View style={headerRevealStyle}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="event-available" size={36} color={NAVY} />
            </View>
          </View>

          <Text style={styles.mainTitle}>Appointment Booked</Text>
          <Text style={styles.subtitle}>Your visit to the boutique has been scheduled successfully.</Text>
        </Animated.View>

        <Animated.View style={[styles.card, cardRevealStyle]}>
          <View style={styles.cardInner}>
            <View style={styles.detailRow}>
              <View style={styles.iconSq}>
                <MaterialIcons name="storefront" size={22} color={NAVY} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>BOUTIQUE</Text>
                <Text style={styles.detailValue}>{boutiqueName || '—'}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.iconSq}>
                <MaterialIcons name="access-time" size={22} color={NAVY} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>DATE & TIME</Text>
                <Text style={styles.detailValue}>{dateTimeLine || '—'}</Text>
              </View>
            </View>
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <View style={styles.iconSq}>
                <MaterialIcons name="location-on" size={22} color={NAVY} />
              </View>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailLabel}>ADDRESS</Text>
                <Text style={styles.detailValue}>{address || '—'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.mapBlock}>
            <RemoteImage uri={MAP_PLACEHOLDER_URI} fallbackTint="#e8eaed" style={StyleSheet.absoluteFillObject} />
            <View style={styles.mapBlockOverlay} pointerEvents="none">
              <MaterialIcons name="map" size={32} color="#94a3b8" />
              <Text style={styles.mapHint}>Map preview</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.quoteText, quoteRevealStyle]}>
          “A perfect piece deserves a perfect moment.”
        </Animated.Text>

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>

      {stage !== 'details' && (
        <View style={styles.overlay} pointerEvents="auto">
          {stage === 'processing' ? (
            <View style={styles.processingWrap}>
              <Animated.View style={[styles.processingPulse, processingPulseStyle]}>
                <Animated.View style={[styles.ringTrack, processingRingStyle]}>
                  <Svg width={112} height={112}>
                    <Circle cx={56} cy={56} r={49} stroke="#e2e8f0" strokeWidth={7} fill="none" />
                    <Circle
                      cx={56}
                      cy={56}
                      r={49}
                      stroke={NAVY}
                      strokeWidth={7}
                      strokeLinecap="round"
                      strokeDasharray="190 130"
                      fill="none"
                    />
                  </Svg>
                </Animated.View>
                <View style={styles.processingIconCore}>
                  <MaterialIcons name="event" size={34} color={NAVY} />
                </View>
              </Animated.View>
              <Text style={styles.processingTitle}>Booking your appointment...</Text>
              <Text style={styles.processingSubtitle}>
                Please wait while we confirm your boutique visit.
              </Text>
            </View>
          ) : (
            <View style={styles.processingWrap}>
              <Animated.View style={[styles.successCircle, successCircleStyle]}>
                <Animated.View style={[styles.successRipple, rippleStyle]} />
                <Animated.View style={[styles.successIconBox, successIconStyle]}>
                  <Svg width={42} height={42} viewBox="0 0 42 42">
                    <AnimatedPath
                      d="M10 22 L18 29 L32 14"
                      stroke={NAVY}
                      strokeWidth={4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      strokeDasharray="34"
                      animatedProps={checkAnimatedProps}
                    />
                  </Svg>
                </Animated.View>
              </Animated.View>
              <Animated.View style={[styles.confettiRow, confettiStyle]}>
                <View style={[styles.confettiDot, { backgroundColor: '#cbd5e1' }]} />
                <View style={[styles.confettiDot, { backgroundColor: '#94a3b8' }]} />
                <View style={[styles.confettiDot, { backgroundColor: '#e2e8f0' }]} />
                <View style={[styles.confettiDot, { backgroundColor: '#64748b' }]} />
                <View style={[styles.confettiDot, { backgroundColor: '#cbd5e1' }]} />
              </Animated.View>
              <Text style={styles.processingTitle}>Appointment Confirmed</Text>
              <Text style={styles.processingSubtitle}>Your boutique visit is reserved successfully.</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  headerSlot: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: LABEL,
    letterSpacing: 1.2,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    fontWeight: '400',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LINE,
  },
  cardInner: { padding: spacing.lg, paddingBottom: spacing.md },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  detailRowLast: { marginBottom: 0 },
  iconSq: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaed',
  },
  detailTextCol: { flex: 1, paddingTop: 2 },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: LABEL,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: NAVY,
    lineHeight: 22,
  },
  mapBlock: {
    height: 132,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#e8eaed',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
  },
  mapBlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  mapHint: { marginTop: spacing.xs, fontSize: fontSizes.xs, color: '#475569' },
  quoteText: {
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    fontWeight: '500',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  processingWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingPulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  ringTrack: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingIconCore: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dbe3eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  processingSubtitle: {
    fontSize: fontSizes.sm,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
  },
  successCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dbe3eb',
  },
  successRipple: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
  },
  confettiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  confettiDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
});
