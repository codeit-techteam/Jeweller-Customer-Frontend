import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RemoteImage } from "@/lib/components/common/RemoteImage";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import type { FeaturedSectionUi } from "@/lib/services/catalogApi";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

type Props = {
  section: FeaturedSectionUi;
  cardWidth?: number;
};

/**
 * Dynamic featured-section rail powered entirely from the Admin Panel. It
 * renders the section title, optional subtitle, and a horizontal list of the
 * attached products. Empty sections are filtered out by the caller — this
 * component does not draw anything if `section.products` is empty.
 */
export function FeaturedSectionRail({ section, cardWidth = 168 }: Props) {
  const router = useRouter();
  if (!section?.products?.length) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{section.title}</Text>
          {section.subtitle ? (
            <Text style={styles.subtitle}>{section.subtitle}</Text>
          ) : null}
        </View>
      </View>
      <FlatList
        data={section.products}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { width: cardWidth }]}
            onPress={() => pushProductDetails(router, item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.name}
          >
            <View style={styles.imageWrap}>
              <RemoteImage
                uri={item.image ?? undefined}
                fallbackTint="#e5e7eb"
                style={styles.image}
              />
              {item.discountPercentage != null && item.discountPercentage > 0 ? (
                <View style={styles.discount}>
                  <Text style={styles.discountText}>
                    -{Math.round(item.discountPercentage)}%
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.price}>
              ₹{Number(item.price ?? 0).toLocaleString("en-IN")}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  listContent: {
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  card: {
    marginRight: spacing.md,
  },
  imageWrap: {
    width: "100%",
    height: 168,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    marginBottom: spacing.xs,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discount: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#dc2626",
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 2,
  },
});
