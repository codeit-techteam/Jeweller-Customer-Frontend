import React, { useEffect } from "react";
import { type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { BoutiqueStatusBadge } from "@/lib/components/common/BoutiqueStatusBadge";

type BoutiqueHeroStatusBadgeProps = {
  openNow: boolean;
  statusSubLabel?: string | null;
  opensAt?: string | null;
  closesAt?: string | null;
  style?: ViewStyle;
};

/**
 * Hero overlay status — uses shared {@link BoutiqueStatusBadge} colors and typography.
 */
export function BoutiqueHeroStatusBadge({
  openNow,
  statusSubLabel,
  opensAt,
  closesAt,
  style,
}: BoutiqueHeroStatusBadgeProps) {
  const fade = useSharedValue(0);
  const scale = useSharedValue(openNow ? 0.94 : 1);

  useEffect(() => {
    fade.value = 0;
    scale.value = openNow ? 0.94 : 1;
    fade.value = withTiming(1, {
      duration: openNow ? 360 : 520,
      easing: Easing.out(Easing.cubic),
    });
    if (openNow) {
      scale.value = withSpring(1, {
        damping: 14,
        stiffness: 220,
        mass: 0.75,
      });
    }
  }, [openNow, fade, scale]);

  const shellStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[style, shellStyle]}
      pointerEvents="none"
    >
      <BoutiqueStatusBadge
        isOpen={openNow}
        subLabel={statusSubLabel}
        opensAt={opensAt}
        closesAt={closesAt}
        variant="hero"
      />
    </Animated.View>
  );
}
