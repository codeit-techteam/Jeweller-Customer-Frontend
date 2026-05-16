import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { TrendingSearchChip } from "@/lib/services/mock/search";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

type RecentProps = {
  variant: "recent";
  label: string;
  onPress: () => void;
  onRemove: () => void;
};

type TrendingProps = {
  variant: "trending";
  item: TrendingSearchChip;
  onPress: () => void;
};

export type SearchItemProps = RecentProps | TrendingProps;

export function SearchItem(props: SearchItemProps) {
  if (props.variant === "recent") {
    return (
      <View style={styles.recentRow}>
        <Pressable
          onPress={props.onPress}
          style={({ pressed }) => [
            styles.chipRecent,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons
            name="history"
            size={14}
            color="#6b7280"
            style={styles.leadingIcon}
          />
          <Text style={styles.recentText} numberOfLines={1}>
            {props.label}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Remove ${props.label}`}
          hitSlop={10}
          onPress={props.onRemove}
          style={styles.removeBtn}
        >
          <MaterialIcons name="close" size={13} color="#9ca3af" />
        </Pressable>
      </View>
    );
  }

  const { item, onPress } = props;

  if (item.variant === "vday") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <LinearGradient
          colors={["#fff8e1", "#fff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chipVday}
        >
          <MaterialIcons
            name="local-fire-department"
            size={13}
            color="#b8860b"
            style={styles.leadingIcon}
          />
          <Text style={styles.vdayText}>{item.label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chipTrending, pressed && styles.pressed]}
    >
      <MaterialIcons
        name="trending-up"
        size={13}
        color="#b8860b"
        style={styles.leadingIcon}
      />
      <Text style={styles.trendingText}>{item.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: radius.full,
    paddingLeft: 14,
    paddingVertical: 6,
    paddingRight: 4,
  },
  chipRecent: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  leadingIcon: {
    marginRight: 6,
  },
  recentText: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: "#374151",
  },
  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  chipTrending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#faf6ea",
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#e9d9a7",
  },
  chipVday: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#c9a227",
  },
  vdayText: {
    fontSize: fontSizes.xs,
    fontStyle: "italic",
    fontWeight: "700",
    color: "#b8860b",
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
  },
  trendingText: {
    fontSize: fontSizes.xs,
    fontWeight: "700",
    color: "#8a6a1c",
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
