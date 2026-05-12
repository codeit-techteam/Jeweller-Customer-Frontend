import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const NAVY = '#0B1C2C';
const GOLD = '#D4AF37';
const MUTED = '#6B7280';
const SUBTLE = '#9CA3AF';
const INK = '#111827';
const SURFACE = '#F9FAFB';

export type PlanCardProps = {
  title: string;
  subtitle: string;
  validity: string;
  /** Show a premium gold border treatment */
  highlight?: boolean;
  /** Optional progress — e.g. { current: 7, total: 10 } to render a bar */
  progress?: { current: number; total: number; unit?: string };
  onPress?: () => void;
};

export function PlanCard({
  title,
  subtitle,
  validity,
  highlight,
  progress,
  onPress,
}: PlanCardProps) {
  const pct = progress
    ? Math.max(0, Math.min(1, progress.total === 0 ? 0 : progress.current / progress.total))
    : 0;
  const unit = progress?.unit ?? 'months';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(11,28,44,0.06)' }}
      style={({ pressed }) => [
        styles.card,
        highlight && styles.highlightCard,
        pressed && !!onPress && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            {highlight ? (
              <MaterialIcons
                name="workspace-premium"
                size={16}
                color={GOLD}
                style={styles.titleIcon}
              />
            ) : null}
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
          <Text style={styles.validity}>{validity}</Text>
        </View>

        <View style={[styles.badge, highlight && styles.badgeHighlight]}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>ACTIVE</Text>
        </View>
      </View>

      {progress ? (
        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                highlight && styles.progressFillGold,
                { width: `${pct * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {progress.current}/{progress.total} {unit} completed
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECEEF1',
  },
  highlightCard: {
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: '#FDFBF3',
  },
  pressed: { opacity: 0.85 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  textBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleIcon: { marginRight: 6 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: INK,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    marginTop: 4,
    lineHeight: 18,
  },
  validity: {
    fontSize: 12,
    color: SUBTLE,
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NAVY,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  badgeHighlight: { backgroundColor: NAVY },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  progressBlock: { marginTop: 14 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: NAVY,
    borderRadius: 3,
  },
  progressFillGold: { backgroundColor: GOLD },
  progressLabel: {
    fontSize: 11,
    color: MUTED,
    marginTop: 6,
    fontWeight: '600',
  },
});
