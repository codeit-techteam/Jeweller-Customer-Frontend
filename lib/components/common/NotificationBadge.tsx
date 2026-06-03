import React, { useEffect } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  count: number;
  style?: StyleProp<ViewStyle>;
};

function formatBadgeCount(count: number): string {
  if (count > 99) return '99+';
  if (count > 9) return '9+';
  return String(count);
}

export function NotificationBadge({ count, style }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count <= 0) return;
    scale.value = withSequence(
      withTiming(0.8, { duration: 0 }),
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 }),
    );
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, style, animatedStyle]}>
      <Text style={styles.text}>{formatBadgeCount(count)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#dc2626',
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  text: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    includeFontPadding: false,
  },
});
