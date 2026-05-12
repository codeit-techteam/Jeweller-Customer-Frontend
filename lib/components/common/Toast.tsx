import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import type { ToastConfig, ToastConfigParams } from "react-native-toast-message";

type Variant = "success" | "error" | "warning" | "info";

type Palette = {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  ringBg: string;
  accent: string;
};

const PALETTES: Record<Variant, Palette> = {
  success: {
    icon: "check-circle",
    iconColor: "#16A34A",
    ringBg: "rgba(22, 163, 74, 0.12)",
    accent: "#16A34A",
  },
  error: {
    icon: "error-outline",
    iconColor: "#DC2626",
    ringBg: "rgba(220, 38, 38, 0.12)",
    accent: "#DC2626",
  },
  warning: {
    icon: "warning-amber",
    iconColor: "#D97706",
    ringBg: "rgba(217, 119, 6, 0.14)",
    accent: "#D97706",
  },
  info: {
    icon: "info-outline",
    iconColor: "#2563EB",
    ringBg: "rgba(37, 99, 235, 0.12)",
    accent: "#2563EB",
  },
};

type ModernToastProps = {
  variant: Variant;
  text1?: string;
  text2?: string;
  onPress?: () => void;
  hide: () => void;
  style?: StyleProp<ViewStyle>;
};

function ModernToast({
  variant,
  text1,
  text2,
  onPress,
  hide,
  style,
}: ModernToastProps) {
  const palette = PALETTES[variant];

  const handlePress = () => {
    onPress?.();
    if (!onPress) hide();
  };

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={text1}
        accessibilityHint={text2}
        android_ripple={{ color: "rgba(15, 23, 42, 0.06)", borderless: false }}
        style={({ pressed }) => [
          styles.card,
          { borderLeftColor: palette.accent },
          pressed && styles.cardPressed,
          style,
        ]}
      >
        <View style={[styles.iconRing, { backgroundColor: palette.ringBg }]}>
          <MaterialIcons
            name={palette.icon}
            size={20}
            color={palette.iconColor}
          />
        </View>

        <View style={styles.body}>
          {text1 ? (
            <Text style={styles.title} numberOfLines={2}>
              {text1}
            </Text>
          ) : null}
          {text2 ? (
            <Text style={styles.message} numberOfLines={3}>
              {text2}
            </Text>
          ) : null}
        </View>

        <Pressable
          hitSlop={10}
          onPress={hide}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          style={styles.close}
        >
          <MaterialIcons name="close" size={16} color="#94A3B8" />
        </Pressable>
      </Pressable>
    </View>
  );
}

function buildRenderer(
  variant: Variant,
): (params: ToastConfigParams<unknown>) => React.ReactNode {
  return ({ text1, text2, onPress, hide }) => (
    <ModernToast
      variant={variant}
      text1={text1}
      text2={text2}
      onPress={onPress}
      hide={hide}
    />
  );
}

/**
 * Modern, floating toast config for `react-native-toast-message`.
 *
 * Each toast renders as a compact white card with:
 * - rounded corners + soft shadow / elevation
 * - tinted accent stripe on the left
 * - circular icon ring matching the variant
 * - subtle dismiss affordance
 *
 * The library handles the slide / fade animation and auto-dismiss timing.
 */
export const toastConfig: ToastConfig = {
  success: buildRenderer("success"),
  error: buildRenderer("error"),
  warning: buildRenderer("warning"),
  info: buildRenderer("info"),
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingHorizontal: 14,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#0A2540",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  cardPressed: {
    opacity: 0.95,
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#0A2540",
    letterSpacing: 0.15,
    includeFontPadding: false,
  },
  message: {
    fontSize: 12.5,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
    lineHeight: 17,
    includeFontPadding: false,
  },
  close: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});
