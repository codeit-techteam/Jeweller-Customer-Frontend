import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { luxury, CARD_RADIUS } from '@/lib/components/appointments/appointmentTheme';
import { RemoteImage } from '@/lib/components/common/RemoteImage';
import type { Appointment, AppointmentBadge } from '@/lib/services/mock/appointments';
import { resolveAppointmentBadge } from '@/lib/utils/appointments';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const IMAGE_H = 168;
const ACTION_H = 48;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function badgeLabel(badge: AppointmentBadge): string {
  switch (badge) {
    case 'past':
      return 'PAST';
    case 'completed':
      return 'COMPLETED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'UPCOMING';
  }
}

function badgeColors(badge: AppointmentBadge) {
  switch (badge) {
    case 'completed':
      return { bg: '#16A34A', text: '#fff' };
    case 'cancelled':
      return { bg: '#DC2626', text: '#fff' };
    case 'past':
      return { bg: '#64748B', text: '#fff' };
    default:
      return { bg: luxury.goldFill, text: luxury.goldDark };
  }
}

function MetaRow({
  icon,
  text,
  lines = 1,
  accent = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
  lines?: number;
  accent?: boolean;
}) {
  return (
    <View style={styles.metaRow}>
      <MaterialIcons
        name={icon}
        size={16}
        color={accent ? luxury.goldDark : luxury.iconMuted}
        style={styles.metaIcon}
      />
      <Text
        style={[styles.metaText, accent && styles.metaTextAccent]}
        numberOfLines={lines}
      >
        {text}
      </Text>
    </View>
  );
}

function formatConsultationType(raw?: string): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower.includes('consultation') || lower.includes('viewing')) return t;
  if (lower === 'in-store') return 'In-Store Consultation';
  return `${t.charAt(0).toUpperCase()}${t.slice(1)} Consultation`;
}

type Props = {
  item: Appointment;
  index?: number;
  onPress: () => void;
  onCancel: () => void;
  onCallBoutique: () => void;
  onViewBoutique: () => void;
  onReschedule: () => void;
  onBookAgain: () => void;
};

function ActionButton({
  label,
  icon,
  variant,
  disabled,
  onPress,
}: {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  variant: 'primary' | 'outline' | 'blue' | 'red';
  disabled?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const variantStyle =
    variant === 'primary'
      ? styles.btnPrimary
      : variant === 'outline'
        ? styles.btnOutline
        : variant === 'blue'
          ? styles.btnBlue
          : styles.btnRed;

  const textStyle =
    variant === 'primary'
      ? styles.btnPrimaryText
      : variant === 'outline'
        ? styles.btnOutlineText
        : variant === 'blue'
          ? styles.btnBlueText
          : styles.btnRedText;

  const iconColor =
    variant === 'primary'
      ? luxury.goldDark
      : variant === 'outline'
        ? luxury.textPrimary
        : variant === 'blue'
          ? luxury.blueText
          : luxury.redText;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={onPress}
      style={[animStyle, styles.actionBtn, variantStyle, disabled && styles.btnDisabled]}
    >
      {icon ? (
        <MaterialIcons name={icon} size={16} color={disabled ? '#94a3b8' : iconColor} />
      ) : null}
      <Text style={[styles.actionLabel, textStyle, disabled && styles.btnLabelDisabled]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function AppointmentCard({
  item,
  index = 0,
  onPress,
  onCancel,
  onCallBoutique,
  onViewBoutique,
  onReschedule,
  onBookAgain,
}: Props) {
  const badge = useMemo(() => resolveAppointmentBadge(item), [item]);
  const badgeColor = useMemo(() => badgeColors(badge), [badge]);
  const isUpcoming = badge === 'upcoming' && item.status === 'upcoming';
  const consultation = formatConsultationType(item.consultationType);
  const dateTimeLine = item.time ? `${item.date} • ${item.time}` : item.date;

  return (
    <Animated.View
      entering={FadeInDown.duration(360).delay(Math.min(index * 60, 240))}
      style={styles.card}
    >
      <View style={styles.imageWrap}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.imagePressable, pressed && styles.pressed]}
        >
          <RemoteImage
            uri={item.image}
            fallbackTint="#d4c4a8"
            placeholder="boutique-cover"
            style={styles.cardImage}
          />
          <LinearGradient
            colors={['rgba(26, 24, 20, 0.65)', 'rgba(26, 24, 20, 0.2)', 'transparent']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </Pressable>
        <View style={[styles.statusBadge, { backgroundColor: badgeColor.bg }]}>
          <Text style={[styles.statusBadgeText, { color: badgeColor.text }]}>{badgeLabel(badge)}</Text>
        </View>
      </View>

      <View style={styles.contentBlock}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.contentMain, pressed && styles.pressed]}
        >
          <Text style={styles.boutiqueName} numberOfLines={2}>
            {item.boutiqueName}
          </Text>
          <MetaRow icon="location-on" text={item.address} lines={2} />
          <MetaRow icon="calendar-today" text={dateTimeLine} />
          {consultation ? <MetaRow icon="diamond" text={consultation} accent /> : null}
        </Pressable>

        <View style={styles.actions}>
          {isUpcoming ? (
            <>
              <View style={styles.actionRow}>
                <ActionButton
                  label="View Boutique"
                  variant="primary"
                  onPress={onViewBoutique}
                  disabled={!item.boutiqueId}
                />
                <ActionButton label="Call" icon="phone-in-talk" variant="outline" onPress={onCallBoutique} />
              </View>
              <View style={styles.actionRow}>
                <ActionButton label="Reschedule" icon="event" variant="blue" onPress={onReschedule} />
                <ActionButton label="Cancel" icon="warning-amber" variant="red" onPress={onCancel} />
              </View>
            </>
          ) : (
            <View style={styles.actionRow}>
              <ActionButton
                label="View Boutique"
                variant="outline"
                onPress={onViewBoutique}
                disabled={!item.boutiqueId}
              />
              <ActionButton label="Book Again" icon="event-available" variant="primary" onPress={onBookAgain} />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: luxury.cardBg,
    borderRadius: CARD_RADIUS,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(26, 24, 20, 0.06)',
  },
  pressed: { opacity: 0.94 },
  imageWrap: {
    height: IMAGE_H,
    position: 'relative',
    backgroundColor: '#e8e4dc',
  },
  imagePressable: { flex: 1, height: IMAGE_H },
  cardImage: { width: '100%', height: IMAGE_H },
  statusBadge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  contentBlock: {
    paddingTop: spacing.lg,
  },
  contentMain: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    marginBottom: spacing.md,
  },
  boutiqueName: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: luxury.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaIcon: { marginTop: 2 },
  metaText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: luxury.textSecondary,
    lineHeight: 20,
  },
  metaTextAccent: {
    color: luxury.goldDark,
    fontWeight: '600',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(26, 24, 20, 0.08)',
    paddingTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: ACTION_H,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  btnPrimary: {
    backgroundColor: luxury.goldFill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: luxury.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  btnPrimaryText: { color: luxury.goldDark, fontWeight: '800' },
  btnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'rgba(26, 24, 20, 0.1)',
  },
  btnOutlineText: { color: luxury.textPrimary, fontWeight: '700' },
  btnBlue: { backgroundColor: luxury.blueSoft },
  btnBlueText: { color: luxury.blueText, fontWeight: '700' },
  btnRed: { backgroundColor: luxury.redSoft },
  btnRedText: { color: luxury.redText, fontWeight: '700' },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  btnLabelDisabled: { color: '#94a3b8' },
  btnDisabled: { opacity: 0.45 },
});
