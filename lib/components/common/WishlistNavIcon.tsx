import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import React, { memo, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { radius, spacing } from "@/src/constants/theme";

const NAVY = "#0e1d3a";
const BADGE_COLOR = "#EF4444";
/** Reserve the same hit / glyph footprint regardless of badge state. */
const ICON_BOX = 24;

type Props = {
  count: number;
  onPress: () => void;
  size?: number;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Wishlist nav icon with an absolutely-positioned animated badge.
 *
 * The heart glyph and its container never change size, alignment, or padding —
 * the badge is the only thing that mounts/unmounts and animates, so the navbar
 * layout stays rock-solid when items are added or removed.
 */
function WishlistNavIconComponent({
  count,
  onPress,
  size = 24,
  iconColor = NAVY,
  bgColor = "#f2f2f2",
  borderColor = "#e7e7e7",
  style,
  accessibilityLabel,
}: Props) {
  const visible = count > 0;
  const scale = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const lastCount = useRef(count);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5.5,
          tension: 200,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  // Subtle bounce whenever the count grows while already visible. We skip the
  // 0 -> 1 case to avoid stacking on top of the mount-in animation above.
  useEffect(() => {
    if (count > lastCount.current && lastCount.current > 0) {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.18,
          useNativeDriver: true,
          friction: 5,
          tension: 220,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 4.5,
          tension: 180,
        }),
      ]).start();
    }
    lastCount.current = count;
  }, [count, scale]);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  const label =
    accessibilityLabel ??
    (count > 0 ? `Wishlist, ${count} item${count === 1 ? "" : "s"}` : "Wishlist");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={spacing.sm}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor, borderColor },
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      <View style={styles.iconBox}>
        <MaterialIcons
          name="favorite-border"
          size={size}
          color={iconColor}
          allowFontScaling={false}
        />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.badge,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={styles.badgeText}
        >
          {count > 99 ? "99+" : String(Math.max(0, count))}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export const WishlistNavIcon = memo(WishlistNavIconComponent);

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: BADGE_COLOR,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: BADGE_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 12,
    textAlign: "center",
    includeFontPadding: false,
  },
});
