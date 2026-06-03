import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fontSizes, spacing } from "@/src/constants/theme";

const NAVY = "#0D1B2A";
const GOLD = "#8B7355";

type Props = {
  visible: boolean;
  onAllow: () => void;
  onManual: () => void;
  onDismiss: () => void;
  allowing?: boolean;
};

export function LocationPermissionSheet({
  visible,
  onAllow,
  onManual,
  onDismiss,
  allowing,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />
          <View style={styles.iconRing}>
            <MaterialIcons name="my-location" size={36} color={GOLD} />
          </View>
          <Text style={styles.title}>Discover Boutiques Near You</Text>
          <Text style={styles.body}>
            Allow location access to find nearby jewellery boutiques and
            personalized recommendations.
          </Text>
          <Pressable
            style={[styles.primaryBtn, allowing && styles.primaryDisabled]}
            onPress={onAllow}
            disabled={allowing}
            accessibilityRole="button"
          >
            <MaterialIcons name="location-on" size={20} color="#fff" />
            <Text style={styles.primaryText}>
              {allowing ? "Enabling…" : "Allow Location"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => {
              onManual();
              router.push({
                pathname: "/(app)/location-selector",
                params: { returnTo: "boutiques" },
              });
            }}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Choose Location Manually</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginBottom: 20,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(139, 115, 85, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: NAVY,
    textAlign: "center",
    marginBottom: 10,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
  },
  body: {
    fontSize: fontSizes.sm,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: NAVY,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryDisabled: { opacity: 0.7 },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  secondaryText: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: NAVY,
  },
});
