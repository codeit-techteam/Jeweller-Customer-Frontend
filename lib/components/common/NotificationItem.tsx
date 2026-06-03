import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import type { AppNotification } from '@/lib/services/notifications';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const ICON_MAP: Record<AppNotification['type'], keyof typeof MaterialIcons.glyphMap> = {
  lead: 'person',
  order: 'local-shipping',
  system: 'campaign',
  document: 'description',
  payment: 'payments',
  approval: 'verified',
  appointment: 'event',
  offer: 'sell',
  collection: 'auto-awesome',
  callback: 'support-agent',
  support: 'chat',
  gold_rate: 'trending-up',
  promotion: 'local-offer',
  profile: 'account-circle',
};

type Props = {
  item: AppNotification & { imageUri?: string; timeLabel: string; actionLabel?: string };
  onPress: () => void;
  onActionPress?: () => void;
};

export function NotificationItem({ item, onPress, onActionPress }: Props) {
  const unread = !item.isRead;

  return (
    <View style={[styles.card, unread && styles.cardUnread]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.mainPress, pressed && styles.pressed]}
      >
        <View style={styles.rowTop}>
          <View style={styles.iconCircle}>
            <MaterialIcons name={ICON_MAP[item.type] ?? 'notifications'} size={20} color="#1e293b" />
          </View>
          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.time}>{item.timeLabel}</Text>
            </View>
            <Text style={[styles.message, unread && styles.messageUnread]}>
              {item.body}
            </Text>
            {item.imageUri || item.imageUrl ? (
              <RemoteImage uri={item.imageUri ?? item.imageUrl!} style={styles.imageBlock} />
            ) : null}
          </View>
          {unread ? <View style={styles.unreadDot} /> : <View style={styles.dotPlaceholder} />}
        </View>
      </Pressable>
      {item.actionLabel ? (
        <Pressable
          accessibilityRole="button"
          onPress={onActionPress}
          style={({ pressed: p }) => [styles.actionBtn, p && styles.actionPressed]}
        >
          <Text style={styles.actionText}>{item.actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardUnread: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  mainPress: {
    borderRadius: radius.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#0f172a',
  },
  titleUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  message: {
    marginTop: spacing.xs,
    fontSize: fontSizes.xs,
    lineHeight: 18,
    color: '#64748b',
  },
  messageUnread: {
    color: '#475569',
  },
  actionBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    marginLeft: 40 + spacing.md,
    backgroundColor: '#0f172a',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  actionPressed: {
    opacity: 0.88,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  imageBlock: {
    marginTop: spacing.md,
    width: '100%',
    height: 120,
    borderRadius: radius.md,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e40af',
    marginLeft: spacing.sm,
    marginTop: 4,
  },
  dotPlaceholder: {
    width: 8,
    marginLeft: spacing.sm,
  },
});
