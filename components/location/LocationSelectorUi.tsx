import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const NAVY = "#0D1B2A";
const MUTED = "#6B7280";
const GOLD = "#8B7355";
const GOLD_LIGHT = "rgba(139, 115, 85, 0.12)";
const CREAM = "#FAF8F5";

/** Shared horizontal inset — search bar, GPS card, and city list align to this. */
export const LOCATION_SCREEN_GUTTER = 20;

export function shortenLocationLabel(label: string): string {
  const t = label.trim();
  if (!t || t === "Locating…") return t;
  const parts = t.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) return t;
  return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
}

type ScreenHeaderProps = {
  onBack: () => void;
};

export function LocationSelectorHeader({ onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={22} color={NAVY} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Choose location</Text>
          <Text style={styles.headerSubtitle}>
            Discover jewellery boutiques near you
          </Text>
        </View>
      </View>
    </View>
  );
}

type SearchBarProps = {
  value: string;
  onChangeText: (t: string) => void;
  loading?: boolean;
};

export function LocationSearchBar({ value, onChangeText, loading }: SearchBarProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View
      style={[
        styles.searchOuter,
        focused && styles.searchOuterFocused,
      ]}
    >
      <MaterialIcons
        name="search"
        size={22}
        color={focused ? GOLD : "#9CA3AF"}
      />
      <View style={styles.searchInputWrap}>
        <Text style={styles.searchLabel}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="City, area, or pincode"
          placeholderTextColor="#B0B5BD"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
      </View>
      {loading ? <ActivityIndicator size="small" color={GOLD} /> : null}
    </View>
  );
}

type GpsCardProps = {
  onPress: () => void;
  busy: boolean;
  displayLabel: string;
  error?: string | null;
};

export function CurrentLocationCard({
  onPress,
  busy,
  displayLabel,
  error,
}: GpsCardProps) {
  const short =
    displayLabel && displayLabel !== "Locating…"
      ? shortenLocationLabel(displayLabel)
      : null;

  return (
    <View style={styles.gpsWrap}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          onPress();
        }}
        disabled={busy}
        style={({ pressed }) => [pressed && !busy && styles.pressed]}
      >
        <LinearGradient
          colors={["#0D1B2A", "#1a2f47", "#0D1B2A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gpsGradient}
        >
          <View style={styles.gpsInner}>
            <View style={styles.gpsIconRing}>
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="my-location" size={24} color="#fff" />
              )}
            </View>
            <View style={styles.gpsCopy}>
              <Text style={styles.gpsTitle}>Use current location</Text>
              <Text style={styles.gpsSub} numberOfLines={2}>
                {busy
                  ? "Detecting your area…"
                  : short
                    ? short
                    : "Enable GPS for nearby boutiques"}
              </Text>
            </View>
            <View style={styles.trailingSlot}>
              <MaterialIcons name="chevron-right" size={26} color="rgba(255,255,255,0.85)" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
      {error ? (
        <View style={styles.errorPill}>
          <MaterialIcons name="info-outline" size={16} color="#b45309" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

type CityRowProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress: () => void;
  busy?: boolean;
};

export function LocationCityCard({
  title,
  subtitle,
  icon,
  onPress,
  busy,
}: CityRowProps) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={busy}
      style={({ pressed }) => [
        styles.cityCard,
        pressed && styles.pressed,
        busy && styles.cityBusy,
      ]}
    >
      <View style={styles.cityIconWrap}>
        <MaterialIcons name={icon} size={22} color={GOLD} />
      </View>
      <View style={styles.cityText}>
        <Text style={styles.cityTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.citySub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.trailingSlot}>
        {busy ? (
          <ActivityIndicator size="small" color={GOLD} />
        ) : (
          <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
        )}
      </View>
    </Pressable>
  );
}

export function SectionHeading({ title }: { title: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

export function LocationListSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: "55%" }]} />
            <View style={[styles.skeletonLine, { width: "78%", marginTop: 8 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function LocationScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.screenRoot}>
      <LinearGradient
        colors={[CREAM, "#F5F2EC", "#EDE9E3"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

export function listContentStyle(): StyleProp<ViewStyle> {
  return styles.listContent;
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  headerBlock: {
    paddingHorizontal: LOCATION_SCREEN_GUTTER,
    paddingTop: 4,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...cardShadow,
  },
  headerTitles: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: NAVY,
    letterSpacing: -0.4,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
  },
  searchOuter: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: LOCATION_SCREEN_GUTTER,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "rgba(15, 27, 42, 0.06)",
    ...cardShadow,
  },
  searchOuterFocused: {
    borderColor: "rgba(139, 115, 85, 0.45)",
  },
  searchInputWrap: { flex: 1, minWidth: 0 },
  searchLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: GOLD,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: "500",
    color: NAVY,
    padding: 0,
    margin: 0,
  },
  gpsWrap: {
    marginBottom: 20,
    alignSelf: "stretch",
    width: "100%",
  },
  gpsGradient: {
    borderRadius: 18,
    overflow: "hidden",
    alignSelf: "stretch",
    ...Platform.select({
      ios: {
        shadowColor: NAVY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  gpsInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
  },
  gpsIconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsCopy: { flex: 1, minWidth: 0 },
  gpsTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.1,
  },
  gpsSub: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    lineHeight: 18,
    fontWeight: "500",
  },
  trailingSlot: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  errorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    alignSelf: "stretch",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.15)",
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: "#b45309",
    fontWeight: "600",
    lineHeight: 17,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    alignSelf: "stretch",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: GOLD,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(139, 115, 85, 0.25)",
  },
  listContent: {
    paddingHorizontal: LOCATION_SCREEN_GUTTER,
    paddingBottom: 40,
  },
  cityCard: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
    marginBottom: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(15, 27, 42, 0.04)",
    ...cardShadow,
  },
  cityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: GOLD_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  cityText: { flex: 1, minWidth: 0, justifyContent: "center" },
  cityTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: NAVY,
    letterSpacing: -0.2,
  },
  citySub: {
    marginTop: 3,
    fontSize: 13,
    color: MUTED,
    fontWeight: "500",
  },
  cityBusy: { opacity: 0.85 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  skeletonWrap: {
    paddingHorizontal: LOCATION_SCREEN_GUTTER,
    gap: 10,
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    gap: 14,
    opacity: 0.7,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E8E4DC",
  },
  skeletonLines: { flex: 1 },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E8E4DC",
  },
});
