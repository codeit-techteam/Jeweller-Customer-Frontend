import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { RemoteImage } from "@/lib/components/common/RemoteImage";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

const NAVY = "#0D1B2A";
const GRADIENT_CTA = ["#1C2E4A", "#020F1F"] as const;

const EXPLORE_BTN_H = 56;
const ICON_WRAPPER = 40;
/** Fixed columns so label `flex: 1` + `textAlign: center` stays stable on Android */
const ICON_COL_W = 50;

type Props = {
  imageUri: string;
  label: string;
  title: string;
  body: string;
  buttonLabel: string;
  onPressExplore: () => void;
};

export function EditorialCard({
  imageUri,
  label,
  title,
  body,
  buttonLabel,
  onPressExplore,
}: Props) {
  const cta = (buttonLabel || "EXPLORE COLLECTION").trim().toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <RemoteImage
          uri={imageUri}
          fallbackTint="#1a1a1a"
          style={styles.image}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={[styles.exploreShadowHost, BTN_SHADOW]}>
        <TouchableOpacity
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={cta}
          onPress={onPressExplore}
          style={styles.exploreTouchable}
        >
          <View style={styles.exploreInner}>
            <LinearGradient
              pointerEvents="none"
              colors={[...GRADIENT_CTA]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.exploreRow} pointerEvents="box-none">
              <View style={styles.iconCol}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="arrow-forward" size={18} color={NAVY} />
                </View>
              </View>
              <Text
                style={styles.exploreText}
                numberOfLines={1}
                ellipsizeMode="tail"
                {...Platform.select({
                  android: { includeFontPadding: false },
                  default: {},
                })}
              >
                {cta}
              </Text>
              <View style={styles.iconColSpacer} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BTN_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  android: { elevation: 5 },
  default: {},
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EEF1F5",
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(13, 27, 42, 0.08)",
  },
  imageWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: radius.lg,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#111827",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes["2xl"],
    fontWeight: "800",
    color: NAVY,
    marginBottom: spacing.md,
    lineHeight: 30,
    ...Platform.select({
      ios: { fontFamily: "Georgia" },
      android: { fontFamily: "serif" },
      default: {},
    }),
  },
  body: {
    fontSize: fontSizes.sm,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  exploreShadowHost: {
    alignSelf: "stretch",
    width: "100%",
    borderRadius: 30,
    backgroundColor: NAVY,
  },
  exploreTouchable: {
    width: "100%",
    height: EXPLORE_BTN_H,
    borderRadius: 30,
    overflow: "hidden",
  },
  exploreInner: {
    width: "100%",
    height: EXPLORE_BTN_H,
    position: "relative",
  },
  exploreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: EXPLORE_BTN_H,
    width: "100%",
    paddingHorizontal: 6,
  },
  iconCol: {
    width: ICON_COL_W,
    alignItems: "center",
    justifyContent: "center",
  },
  iconColSpacer: {
    width: ICON_COL_W,
  },
  iconCircle: {
    width: ICON_WRAPPER,
    height: ICON_WRAPPER,
    borderRadius: ICON_WRAPPER / 2,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  exploreText: {
    flex: 1,
    minWidth: 0,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    textAlign: "center",
  },
});
