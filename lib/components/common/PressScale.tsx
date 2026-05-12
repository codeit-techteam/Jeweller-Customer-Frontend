import React, { useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = PressableProps & {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * A premium press wrapper that smoothly scales content to `scaleTo` on press-in
 * and back to 1 on release. Mirrors iOS-style tactile feedback.
 */
export function PressScale({
  scaleTo = 0.97,
  style,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = useCallback(
    (e: GestureResponderEvent) => {
      Animated.spring(scale, {
        toValue: scaleTo,
        useNativeDriver: true,
        speed: 50,
        bounciness: 0,
      }).start();
      onPressIn?.(e);
    },
    [onPressIn, scale, scaleTo],
  );

  const handleOut = useCallback(
    (e: GestureResponderEvent) => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 40,
        bounciness: 4,
      }).start();
      onPressOut?.(e);
    },
    [onPressOut, scale],
  );

  return (
    <Pressable
      {...rest}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={style}
      android_ripple={rest.android_ripple ?? { color: "rgba(0,0,0,0.08)" }}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ scale }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
