import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { FLAT_LIST_HORIZONTAL_PROPS } from "@/lib/constants/flatListPerformance";
import { spacing } from "@/src/constants/theme";

const CARD_WIDTH = 300;
const CARD_HEIGHT = 152;
const TABLET_BREAKPOINT = 768;

type TrustIcon =
  | { family: "ionicons"; name: keyof typeof Ionicons.glyphMap }
  | { family: "material"; name: keyof typeof MaterialCommunityIcons.glyphMap };

type TrustItem = {
  id: string;
  icon: TrustIcon;
  iconColor: string;
  gradient: [string, string];
  title: string;
  subtitle: string;
  tagline: string;
};

const TRUST_ITEMS: TrustItem[] = [
  {
    id: "verified",
    icon: { family: "material", name: "shield-check" },
    iconColor: "#2D6A4F",
    gradient: ["#F2F9F5", "#D8EBE2"],
    title: "Verified Boutiques",
    subtitle: "Only verified jewellery sellers",
    tagline: "Trusted Marketplace",
  },
  {
    id: "certified",
    icon: { family: "material", name: "diamond-stone" },
    iconColor: "#1E3A5F",
    gradient: ["#F0F4FA", "#D6E2F0"],
    title: "Certified Jewellery",
    subtitle: "BIS Hallmark & certified diamonds",
    tagline: "Quality Assured",
  },
  {
    id: "gold-rates",
    icon: { family: "material", name: "gold" },
    iconColor: "#9A7B2F",
    gradient: ["#FBF7EE", "#F0E4C8"],
    title: "Live Gold Rates",
    subtitle: "Updated daily market prices",
    tagline: "Transparent Pricing",
  },
  {
    id: "custom",
    icon: { family: "ionicons", name: "color-wand-outline" },
    iconColor: "#8B5A4A",
    gradient: ["#FBF4F1", "#F2E0D6"],
    title: "Custom Orders",
    subtitle: "Create jewellery your way",
    tagline: "Bespoke Design",
  },
  {
    id: "exchange",
    icon: { family: "ionicons", name: "swap-horizontal-outline" },
    iconColor: "#5C4A72",
    gradient: ["#F6F1F8", "#E8DFF0"],
    title: "Lifetime Exchange",
    subtitle: "Easy exchange at market value",
    tagline: "Lifetime Value",
  },
];

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: "#1A1814",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TrustIconGlyph({
  icon,
  color,
  size = 22,
}: {
  icon: TrustIcon;
  color: string;
  size?: number;
}) {
  if (icon.family === "material") {
    return (
      <MaterialCommunityIcons name={icon.name} size={size} color={color} />
    );
  }
  return <Ionicons name={icon.name} size={size} color={color} />;
}

function PremiumTrustCard({
  item,
  index,
  width,
}: {
  item: TrustItem;
  index: number;
  width: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 200 });
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 200 });
  }, [scale]);

  const onPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  return (
    <Animated.View
      entering={FadeInRight.duration(320).delay(Math.min(index * 70, 280))}
      style={[animatedStyle, { width }]}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.subtitle}`}
        android_ripple={{ color: "rgba(26, 24, 20, 0.06)", borderless: false }}
        style={[styles.cardOuter, CARD_SHADOW, { width, height: CARD_HEIGHT }]}
      >
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.glassOverlay} pointerEvents="none" />
          <View style={styles.cardContent}>
            <View style={styles.iconCircle}>
              <TrustIconGlyph icon={item.icon} color={item.iconColor} />
            </View>
            <View style={styles.cardTextBlock}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.taglineRow}>
              <Ionicons name="arrow-forward" size={12} color="#8A857D" />
              <Text style={styles.taglineText}>{item.tagline}</Text>
            </View>
          </View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

function TrustGrid({ items, columns }: { items: TrustItem[]; columns: 2 | 3 }) {
  const { width } = useWindowDimensions();
  const horizontalPad = spacing.lg * 2;
  const gap = 14;
  const cardWidth =
    (width - horizontalPad - gap * (columns - 1)) / columns;

  return (
    <View style={[styles.grid, { gap }]}>
      {items.map((item, index) => (
        <PremiumTrustCard
          key={item.id}
          item={item}
          index={index}
          width={cardWidth}
        />
      ))}
    </View>
  );
}

export function WhyChooseGehnaHubSection() {
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET_BREAKPOINT;
  const columns: 2 | 3 = width >= 1024 ? 3 : 2;

  return (
    <View style={styles.section}>
      <View style={styles.goldAccent} pointerEvents="none" />
      <View style={styles.header}>
        <Text style={styles.heading}>Why Choose GehnaHub</Text>
        <Text style={styles.subheading}>
          Trusted by thousands of jewellery buyers across India
        </Text>
      </View>

      {isWide ? (
        <TrustGrid items={TRUST_ITEMS} columns={columns} />
      ) : (
        <FlatList
          {...FLAT_LIST_HORIZONTAL_PROPS}
          data={TRUST_ITEMS}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          renderItem={({ item, index }) => (
            <PremiumTrustCard item={item} index={index} width={CARD_WIDTH} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
    backgroundColor: "#FAF8F4",
    position: "relative",
    overflow: "hidden",
  },
  goldAccent: {
    position: "absolute",
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 1,
    backgroundColor: "rgba(201, 162, 39, 0.28)",
  },
  header: {
    marginBottom: spacing.lg,
    paddingRight: spacing.sm,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1814",
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  subheading: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#8A857D",
    fontWeight: "400",
  },
  carouselContent: {
    gap: 14,
    paddingRight: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cardOuter: {
    borderRadius: 20,
    overflow: "hidden",
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.65)",
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  cardTextBlock: {
    flexShrink: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1814",
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  cardSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#6B6560",
    fontWeight: "400",
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8A857D",
    letterSpacing: 0.2,
  },
});
