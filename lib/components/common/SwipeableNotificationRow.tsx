import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useRef } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { NotificationItem } from '@/lib/components/common/NotificationItem';
import type { AppNotification } from '@/lib/services/notifications';
import { spacing } from '@/src/constants/theme';

type Props = {
  item: AppNotification & { timeLabel: string; imageUri?: string; actionLabel?: string };
  onPress: () => void;
  onActionPress?: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
};

function ActionSlot({
  label,
  icon,
  backgroundColor,
  onPress,
  align,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  backgroundColor: string;
  onPress: () => void;
  align: 'left' | 'right';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.actionSlot,
        { backgroundColor },
        align === 'left' ? styles.actionLeft : styles.actionRight,
      ]}
    >
      <MaterialIcons name={icon} size={20} color="#fff" />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export function SwipeableNotificationRow({
  item,
  onPress,
  onActionPress,
  onMarkRead,
  onDelete,
}: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const confirmDelete = () => {
    Alert.alert('Delete notification?', 'This notification will be removed permanently.', [
      { text: 'Cancel', style: 'cancel', onPress: () => swipeRef.current?.close() },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          swipeRef.current?.close();
          onDelete();
        },
      },
    ]);
  };

  return (
    <Swipeable
      ref={swipeRef}
      overshootLeft={false}
      overshootRight={false}
      friction={2}
      renderLeftActions={() => (
        <ActionSlot
          label="Read"
          icon="done"
          backgroundColor="#1e40af"
          onPress={() => {
            swipeRef.current?.close();
            onMarkRead();
          }}
          align="left"
        />
      )}
      renderRightActions={(_progress, dragX) => {
        const scale = dragX.interpolate({
          inputRange: [-96, 0],
          outputRange: [1, 0.85],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View style={{ transform: [{ scale }] }}>
            <ActionSlot
              label="Delete"
              icon="delete-outline"
              backgroundColor="#dc2626"
              onPress={confirmDelete}
              align="right"
            />
          </Animated.View>
        );
      }}
    >
      <NotificationItem item={item} onPress={onPress} onActionPress={onActionPress} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionSlot: {
    width: 92,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderRadius: 12,
    gap: 4,
  },
  actionLeft: {
    marginRight: spacing.sm,
  },
  actionRight: {
    marginLeft: spacing.sm,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
