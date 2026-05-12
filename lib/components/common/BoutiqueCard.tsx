import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { RemoteImage } from "@/lib/components/common/RemoteImage";
import type { BoutiqueProfileViewModel } from "@/lib/boutiques/boutiqueUi";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

const NAVY = "#0a1a33";
const GOLD = "#c5a059";

type Props = {
  profile: BoutiqueProfileViewModel;
};

/**
 * Identity block: overlapping logo, name, trusted badge, rating · location · hours.
 */
export function BoutiqueCard({ profile }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.logoRing, { borderColor: "#fff" }]}>
        <View style={[styles.logoInner, { backgroundColor: profile.logoTint }]}>
          {profile.logoUrl ? (
            <RemoteImage uri={profile.logoUrl} style={styles.logoImage} />
          ) : (
            <>
              <MaterialIcons name="diamond" size={24} color={GOLD} />
              <Text style={styles.logoCaption}>{profile.logoCaption}</Text>
              {profile.logoSubtitle ? (
                <Text style={styles.logoSub}>{profile.logoSubtitle}</Text>
              ) : null}
            </>
          )}
        </View>
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name}>{profile.name}</Text>
        <View style={styles.trustedPill}>
          <MaterialIcons name="verified" size={12} color={GOLD} />
          <Text style={styles.trustedText}>{profile.trustedTag}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <MaterialIcons name="star" size={14} color={GOLD} />
        <Text style={styles.metaText}>{profile.rating.toFixed(1)}</Text>
        {profile.reviewCount > 0 ? (
          <Text style={styles.metaMuted}> • {profile.reviewCount} reviews</Text>
        ) : null}
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaMuted}>{profile.shortLocation}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaMuted}>{profile.hoursLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginTop: 0,
    marginBottom: spacing.md,
    zIndex: 2,
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logoInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoCaption: {
    fontSize: 8,
    fontWeight: "800",
    color: NAVY,
    letterSpacing: 0.5,
  },
  logoSub: {
    fontSize: 7,
    fontWeight: "700",
    color: NAVY,
    letterSpacing: 0.8,
    opacity: 0.85,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  name: {
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
    color: NAVY,
    textAlign: "center",
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: undefined,
    }),
  },
  trustedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: "#f5f0e6",
  },
  trustedText: {
    fontSize: 9,
    fontWeight: "800",
    color: NAVY,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: spacing.sm,
    gap: 4,
  },
  metaText: { fontSize: fontSizes.sm, fontWeight: "600", color: "#4b5563" },
  metaMuted: { fontSize: fontSizes.sm, color: "#6b7280" },
  metaDot: { fontSize: fontSizes.sm, color: "#9ca3af", marginHorizontal: 2 },
});
