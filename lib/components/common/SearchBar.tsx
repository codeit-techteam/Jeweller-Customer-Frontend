import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { RotatingSearchPlaceholder } from "@/lib/components/common/RotatingSearchPlaceholder";
import { fontSizes, spacing } from "@/src/constants/theme";

const FOCUS_MS = 200;
/** Resolved once at load — do not use `Platform.select` inside Reanimated worklets. */
const IS_ANDROID = Platform.OS === "android";

/**
 * Unified pill-style search bar used on Home (tap-to-navigate) and Discover
 * (live typing) screens. Same visual language on both surfaces.
 *
 * Two modes:
 *  - `onPress` only           → read-only tappable trigger (Home)
 *  - `value` + `onChangeText` → live text input (Discover)
 */
type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  /** When provided, cycles these prompts with a subtle typing animation. */
  rotatingPlaceholders?: readonly string[];
  /** When provided, the bar renders as a tappable trigger (no TextInput). */
  onPress?: () => void;
  autoFocus?: boolean;
  onVoicePress?: () => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onClear?: () => void;
};

export function SearchBar({
  value = "",
  onChangeText,
  placeholder,
  rotatingPlaceholders,
  onPress,
  autoFocus,
  onVoicePress,
  onSubmitEditing,
  onFocus,
  onBlur,
  onClear,
}: Props) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);
  const hasValue = value.length > 0;
  const isTapMode = typeof onPress === "function";
  const useRotating =
    Array.isArray(rotatingPlaceholders) && rotatingPlaceholders.length > 0;

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: FOCUS_MS });
  }, [focused, focusProgress]);

  const shellStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ["#F5F5F5", "#ffffff"],
    );
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ["rgba(0,0,0,0)", "#111827"],
    );
    if (IS_ANDROID) {
      return {
        backgroundColor,
        borderColor,
        elevation: interpolate(focusProgress.value, [0, 1], [2, 5]),
      };
    }
    return {
      backgroundColor,
      borderColor,
      shadowColor: "#000",
      shadowOpacity: interpolate(focusProgress.value, [0, 1], [0.06, 0.11]),
      shadowRadius: interpolate(focusProgress.value, [0, 1], [12, 16]),
      shadowOffset: {
        width: 0,
        height: interpolate(focusProgress.value, [0, 1], [3, 5]),
      },
    };
  });

  const iconColor =
    focused || hasValue ? "#111827" : "#9ca3af";

  const inputPlaceholder =
    useRotating && !focused && !hasValue
      ? ""
      : placeholder;

  const showRotatingOverlay =
    useRotating && !hasValue && !focused && !isTapMode;

  const showRotatingTap = useRotating && isTapMode;

  const micColor = onVoicePress ? "#d2bd59" : "#6b7280";

  const trailingControl =
    !isTapMode && hasValue ? (
      <Pressable
        accessibilityLabel="Clear search"
        hitSlop={10}
        onPress={() => {
          onChangeText?.("");
          onClear?.();
        }}
        style={styles.trailingBtn}
      >
        <MaterialIcons name="close" size={16} color="#6b7280" />
      </Pressable>
    ) : (
      <Pressable
        accessibilityLabel="Voice search"
        hitSlop={10}
        onPress={onVoicePress}
        disabled={!onVoicePress && !isTapMode}
        style={styles.trailingBtn}
      >
        <MaterialIcons name="mic-none" size={18} color={micColor} />
      </Pressable>
    );

  if (isTapMode) {
    return (
      <Animated.View style={[styles.wrap, shellStyle]}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel={placeholder}
          onPress={onPress}
          style={styles.tapMain}
          android_ripple={{ color: "rgba(0,0,0,0.04)" }}
        >
          <MaterialIcons
            name="search"
            size={20}
            color={iconColor}
            style={styles.icon}
          />
          <View style={styles.inputSlot}>
            {showRotatingTap ? (
              <RotatingSearchPlaceholder
                phrases={rotatingPlaceholders}
                paused={false}
                style={styles.placeholderTypography}
              />
            ) : (
              <Text style={styles.placeholder} numberOfLines={1}>
                {placeholder}
              </Text>
            )}
          </View>
        </Pressable>
        {trailingControl}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.wrap, shellStyle]}>
      <MaterialIcons
        name="search"
        size={20}
        color={iconColor}
        style={styles.icon}
      />
      <View style={styles.inputSlot}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={inputPlaceholder}
          placeholderTextColor="#9ca3af"
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          autoFocus={autoFocus}
          clearButtonMode="never"
          selectionColor="#111827"
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onSubmitEditing={onSubmitEditing}
        />
        {showRotatingOverlay ? (
          <View style={styles.placeholderOverlay} pointerEvents="none">
            <RotatingSearchPlaceholder
              phrases={rotatingPlaceholders}
              paused={false}
              style={styles.placeholderTypography}
            />
          </View>
        ) : null}
      </View>
      {trailingControl}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderWidth: 1,
  },
  tapMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
  },
  icon: {
    marginRight: spacing.sm,
  },
  inputSlot: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    minHeight: 24,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    color: "#111827",
    paddingVertical: 0,
    fontWeight: "500",
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  placeholderTypography: {
    fontSize: fontSizes.md,
    fontWeight: "500",
  },
  placeholder: {
    flex: 1,
    fontSize: fontSizes.md,
    color: "#9ca3af",
    fontWeight: "500",
  },
  trailingBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
});
