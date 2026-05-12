import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import type { Appointment, AppointmentBadge } from '@/lib/services/mock/appointments';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const OLIVE = '#6b5c22';
const OLIVE_SOFT = '#e8e4d4';
const OLIVE_TEXT = '#5c4f1e';

function resolveBadge(item: Appointment): AppointmentBadge {
  if (item.badge) return item.badge;
  if (item.status === 'cancelled') return 'cancelled';
  if (item.status === 'completed') return 'completed';
  if (item.status === 'upcoming' && item.startsAt) {
    const t = new Date(item.startsAt).getTime();
    if (!Number.isNaN(t) && t < Date.now()) return 'past';
  }
  return 'upcoming';
}

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

type CardTone = 'active' | 'muted' | 'cancelled';

function resolveTone(item: Appointment, badge: AppointmentBadge): CardTone {
  if (badge === 'cancelled') return 'cancelled';
  if (badge === 'completed' || badge === 'past') return 'muted';
  return 'active';
}

type Props = {
  item: Appointment;
  onPress: () => void;
  onCancel: () => void;
  onCallBoutique: () => void;
  onViewBoutique: () => void;
};

export function AppointmentCard({ item, onPress, onCancel, onCallBoutique, onViewBoutique }: Props) {
  const badge = useMemo(() => resolveBadge(item), [item]);
  const tone = useMemo(() => resolveTone(item, badge), [item, badge]);
  const imageUri = item.image;
  const canCancel = item.status === 'upcoming';
  const showTime = Boolean(item.time);

  const cardSurface = tone === 'muted' ? styles.cardMuted : tone === 'cancelled' ? styles.cardCancelled : null;
  const imageOpacity = tone === 'muted' ? styles.imageDim : null;

  const badgeStyles = useMemo(() => {
    switch (badge) {
      case 'completed':
        return { wrap: styles.badgeCompleted, text: styles.badgeTextCompleted };
      case 'cancelled':
        return { wrap: styles.badgeCancelled, text: styles.badgeTextCancelled };
      case 'past':
        return { wrap: styles.badgePast, text: styles.badgeTextPast };
      default:
        return { wrap: styles.badgeUpcoming, text: styles.badgeTextUpcoming };
    }
  }, [badge]);

  return (
    <View style={[styles.card, cardSurface]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.mainPressed]}
      >
        <View style={styles.imageWrap}>
          <RemoteImage uri={imageUri} fallbackTint="#d4c4a8" style={[styles.cardImage, imageOpacity]} />
          <View style={styles.badgeRow} pointerEvents="box-none">
            <View style={[styles.statusBadge, badgeStyles.wrap]}>
              <Text style={[styles.statusBadgeText, badgeStyles.text]}>{badgeLabel(badge)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={[styles.boutiqueName, tone !== 'active' && styles.boutiqueNameMuted]}>{item.boutiqueName}</Text>

          <View style={styles.metaRow}>
            <MaterialIcons name="calendar-today" size={14} color="#6b7280" />
            <Text style={styles.metaText}>{item.date}</Text>
            {showTime ? (
              <>
                <Text style={styles.metaDot}> · </Text>
                <MaterialIcons name="schedule" size={14} color="#6b7280" />
                <Text style={styles.metaText}>{item.time}</Text>
              </>
            ) : null}
          </View>

          <Text style={[styles.address, tone !== 'active' && styles.addressMuted]} numberOfLines={2}>
            {item.address}
          </Text>

          {item.consultationType ? (
            <View style={styles.typeRow}>
              <MaterialIcons name="diamond" size={14} color="#a68b2d" />
              <Text style={styles.typeText} numberOfLines={1}>
                {item.consultationType}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.btnOutline, pressed && styles.btnPressed]}
          onPress={onViewBoutique}
          disabled={!item.boutiqueId}
        >
          <Text style={[styles.btnOutlineText, !item.boutiqueId && styles.btnDisabledText]}>View Boutique</Text>
        </Pressable>

        {canCancel ? (
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelWrap}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        ) : null}

        <Pressable accessibilityRole="button" onPress={onCallBoutique} style={styles.callRow}>
          <MaterialIcons name="phone-in-talk" size={16} color={OLIVE} />
          <Text style={styles.callText}>Call Boutique</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CARD_RADIUS = 16;
const IMAGE_H = 140;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: CARD_RADIUS,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMuted: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    shadowOpacity: 0.04,
  },
  cardCancelled: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.12)',
  },
  mainPressed: { opacity: 0.96 },
  imageWrap: {
    height: IMAGE_H,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: IMAGE_H,
  },
  imageDim: { opacity: 0.72 },
  badgeRow: {
    position: 'absolute',
    left: spacing.sm,
    top: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeUpcoming: { backgroundColor: OLIVE_SOFT },
  badgeTextUpcoming: { color: OLIVE_TEXT },
  badgePast: { backgroundColor: '#f1f5f9' },
  badgeTextPast: { color: '#64748b' },
  badgeCompleted: { backgroundColor: '#dcfce7' },
  badgeTextCompleted: { color: '#15803d' },
  badgeCancelled: { backgroundColor: '#fef2f2' },
  badgeTextCancelled: { color: '#b91c1c' },
  statusBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  boutiqueName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: spacing.xs,
  },
  boutiqueNameMuted: { color: '#475569' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.xs },
  metaText: { fontSize: fontSizes.sm, color: '#6b7280', marginLeft: 4 },
  metaDot: { fontSize: fontSizes.sm, color: '#9ca3af' },
  address: { fontSize: fontSizes.xs, color: '#64748b', lineHeight: 16, marginBottom: 0 },
  addressMuted: { color: '#94a3b8' },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  typeText: { flex: 1, fontSize: fontSizes.xs, color: '#57534e', fontWeight: '600' },
  btnOutline: {
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.12)',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  btnOutlineText: { color: '#0f172a', fontSize: fontSizes.sm, fontWeight: '700' },
  btnDisabledText: { color: '#94a3b8' },
  cancelWrap: { alignItems: 'center', paddingVertical: 2 },
  cancelText: { fontSize: fontSizes.sm, fontWeight: '600', color: '#0f172a' },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: spacing.xs,
  },
  callText: { fontSize: fontSizes.sm, fontWeight: '600', color: OLIVE },
  btnPressed: { opacity: 0.88 },
});
