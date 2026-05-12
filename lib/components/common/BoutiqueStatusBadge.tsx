import React, { useEffect, useMemo } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { BOUTIQUE_STATUS_THEME } from "@/lib/constants/boutiqueStatusTheme";
import { formatTime12Hour } from "@/lib/boutiques/boutiqueUi";

export type BoutiqueStatusBadgeVariant =
  | "compact"
  | "default"
  | "featured"
  | "corner"
  | "hero";

export type BoutiqueStatusBadgeProps = {
  /** Prefer `isOpen`; `openNow` is supported for legacy call sites. */
  isOpen?: boolean;
  openNow?: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  /** When set, used instead of deriving from opensAt/closesAt. */
  subLabel?: string | null;
  variant?: BoutiqueStatusBadgeVariant;
  style?: StyleProp<ViewStyle>;
  /** When false, never show the secondary line. Defaults to true. */
  showSubLabel?: boolean;
};

function PulsingOpenDot({ size }: { size: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.38, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.88 + 0.14 * pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: BOUTIQUE_STATUS_THEME.open.dot,
        },
        animatedStyle,
      ]}
    />
  );
}

function ClosedDot({ size }: { size: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: BOUTIQUE_STATUS_THEME.closed.dot,
      }}
    />
  );
}

function resolveSecondaryLine(
  open: boolean,
  subLabel: string | null | undefined,
  opensAt: string | null | undefined,
  closesAt: string | null | undefined,
): string {
  const trimmed = subLabel?.trim();
  if (trimmed) return trimmed;
  if (open && closesAt?.trim()) {
    const t = formatTime12Hour(closesAt);
    return t ? `Closes at ${t}` : "";
  }
  if (!open && opensAt?.trim()) {
    const t = formatTime12Hour(opensAt);
    return t ? `Opens at ${t}` : "";
  }
  return "";
}

const VARIANT_METRICS: Record<
  BoutiqueStatusBadgeVariant,
  {
    titleSize: number;
    titleWeight: "700" | "800";
    subSize: number;
    dot: number;
    padH: number;
    padV: number;
    letter: number;
    gap: number;
    rowGap: number;
  }
> = {
  compact: {
    titleSize: 9,
    titleWeight: "800",
    subSize: 8,
    dot: 6,
    padH: 10,
    padV: 4,
    letter: 0.4,
    gap: 5,
    rowGap: 2,
  },
  default: {
    titleSize: 11,
    titleWeight: "700",
    subSize: 10,
    dot: 7,
    padH: 12,
    padV: 6,
    letter: 0.35,
    gap: 6,
    rowGap: 3,
  },
  corner: {
    titleSize: 10,
    titleWeight: "800",
    subSize: 9,
    dot: 6,
    padH: 10,
    padV: 5,
    letter: 0.35,
    gap: 6,
    rowGap: 2,
  },
  featured: {
    titleSize: 12,
    titleWeight: "700",
    subSize: 10,
    dot: 7,
    padH: 12,
    padV: 6,
    letter: 0.2,
    gap: 6,
    rowGap: 3,
  },
  hero: {
    titleSize: 14,
    titleWeight: "700",
    subSize: 11,
    dot: 8,
    padH: 16,
    padV: 8,
    letter: 0.3,
    gap: 8,
    rowGap: 4,
  },
};

export function BoutiqueStatusBadge({
  isOpen: isOpenProp,
  openNow,
  opensAt,
  closesAt,
  subLabel,
  variant = "default",
  style,
  showSubLabel = true,
}: BoutiqueStatusBadgeProps) {
  const open = isOpenProp ?? openNow ?? false;
  const theme = open ? BOUTIQUE_STATUS_THEME.open : BOUTIQUE_STATUS_THEME.closed;
  const m = VARIANT_METRICS[variant];

  const secondary = useMemo(
    () =>
      showSubLabel
        ? resolveSecondaryLine(open, subLabel, opensAt, closesAt)
        : "",
    [open, subLabel, opensAt, closesAt, showSubLabel],
  );

  const title = open ? "OPEN NOW" : "CLOSED";

  const shadowStyle =
    variant === "hero" || variant === "featured"
      ? Platform.select<ViewStyle>({
          ios: {
            shadowColor: open ? theme.dot : BOUTIQUE_STATUS_THEME.closed.dot,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: open ? 0.22 : 0.2,
            shadowRadius: 10,
          },
          android: { elevation: 6 },
          default: {},
        })
      : variant === "corner"
        ? Platform.select<ViewStyle>({
            ios: {
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 6,
            },
            android: { elevation: 3 },
            default: {},
          })
        : {};

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
          paddingHorizontal: m.padH,
          paddingVertical: m.padV,
        },
        shadowStyle,
        style,
      ]}
    >
      <View style={[styles.row, { gap: m.gap }]}>
        {open ? (
          <PulsingOpenDot size={m.dot} />
        ) : (
          <ClosedDot size={m.dot} />
        )}
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
              fontSize: m.titleSize,
              fontWeight: m.titleWeight,
              letterSpacing: m.letter,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      {secondary ? (
        <Text
          style={[
            styles.sub,
            {
              color: theme.text,
              fontSize: m.subSize,
              marginTop: m.rowGap,
              opacity: 0.92,
            },
          ]}
          numberOfLines={variant === "compact" ? 1 : 2}
        >
          {secondary}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {},
  sub: {
    fontWeight: "600",
    letterSpacing: 0.15,
    lineHeight: 14,
  },
});
