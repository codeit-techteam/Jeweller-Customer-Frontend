import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#1a2b3c';
const RED = '#e53935';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export type ProfileMenuItemProps = {
  title: string;
  icon: IconName;
  onPress: () => void;
  /** Small badge before chevron (e.g. notification count) */
  badgeCount?: number;
  /**
   * Colour treatment for the count badge.
   * - `danger` (red) for alerts like unread notifications
   * - `navy` for neutral counts (e.g. "2 active plans")
   */
  badgeTone?: 'danger' | 'navy';
  showChevron?: boolean;
  variant?: 'default' | 'danger';
};

export function ProfileMenuItem({
  title,
  icon,
  onPress,
  badgeCount,
  badgeTone = 'danger',
  showChevron = true,
  variant = 'default',
}: ProfileMenuItemProps) {
  const isDanger = variant === 'danger';
  const isNavyBadge = badgeTone === 'navy';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.card, isDanger && styles.cardDanger]}
    >
      <View style={[styles.iconWrap, isDanger && styles.iconWrapDanger]}>
        <MaterialIcons name={icon} size={22} color={isDanger ? RED : NAVY} />
      </View>
      <Text style={[styles.title, isDanger && styles.titleDanger]} numberOfLines={1}>
        {title}
      </Text>
      {typeof badgeCount === 'number' && badgeCount > 0 ? (
        <View style={[styles.badge, isNavyBadge && styles.badgeNavy]}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : String(badgeCount)}</Text>
        </View>
      ) : null}
      {showChevron ? (
        <MaterialIcons name="chevron-right" size={22} color="#c4c4c4" />
      ) : (
        <View style={styles.chevronSpacer} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F6F7F9',
    marginBottom: 12,
  },
  cardDanger: {
    backgroundColor: '#fff5f5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f5d0d0',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapDanger: { backgroundColor: 'transparent' },
  title: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: NAVY,
  },
  titleDanger: { color: RED, fontWeight: '700' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: spacing.xs,
  },
  badgeNavy: { backgroundColor: NAVY },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  chevronSpacer: { width: 22 },
});
