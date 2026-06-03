import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { fontSizes, spacing } from "@/src/constants/theme";

const NAVY = "#0D1B2A";
const GOLD = "#8B7355";
const MUTED = "#6B7280";

type Props = {
  title?: string;
  displayLabel: string;
  labelLoading?: boolean;
  onChangePress?: () => void;
};

export function LocationHeader({
  title = "Boutiques",
  displayLabel,
  labelLoading,
  onChangePress,
}: Props) {
  const router = useRouter();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (labelLoading) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(1, { duration: 300 });
    }
  }, [labelLoading, pulse]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const openSelector = () => {
    if (onChangePress) {
      onChangePress();
      return;
    }
    router.push({
      pathname: "/(app)/location-selector",
      params: { returnTo: "boutiques" },
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Pressable
        onPress={openSelector}
        style={({ pressed }) => [styles.locationCard, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Current location ${displayLabel}. Change location`}
      >
        <View style={styles.locationTop}>
          <Text style={styles.locationCaption}>Current Location</Text>
          <View style={styles.changeRow}>
            <Text style={styles.changeText}>Change</Text>
            <MaterialIcons name="chevron-right" size={18} color="#2563EB" />
          </View>
        </View>
        <View style={styles.locationBottom}>
          <Animated.View style={iconStyle}>
            <MaterialIcons name="location-on" size={22} color={GOLD} />
          </Animated.View>
          <Text style={styles.locationLabel} numberOfLines={2}>
            {displayLabel}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: NAVY,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(15, 27, 42, 0.06)",
  },
  pressed: { opacity: 0.94 },
  locationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  locationCaption: {
    fontSize: 11,
    fontWeight: "600",
    color: MUTED,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  changeText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: "#2563EB",
  },
  locationBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: NAVY,
    lineHeight: 22,
  },
});
