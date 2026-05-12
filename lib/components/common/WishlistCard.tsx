import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RemoteImage } from "@/lib/components/common/RemoteImage";
import { WISHLIST_HEART_ACTIVE } from "@/lib/constants/wishlistHeart";
import type { WishlistItemRow } from "@/lib/services/mock/wishlist";
import { formatBoutiqueMeta } from "@/lib/utils/formatBoutiqueMeta";
import { fontSizes, spacing } from "@/src/constants/theme";

const NAVY = "#0f172a";

type WishlistCardProps = {
  item: WishlistItemRow;
  onPressCard: () => void;
  onPressHeart: () => void;
  onMoveToCart: () => void;
};

export function WishlistCard({
  item,
  onPressCard,
  onPressHeart,
  onMoveToCart,
}: WishlistCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <Pressable
          onPress={onPressCard}
          style={({ pressed }) => [
            styles.imagePress,
            pressed && styles.imagePressPressed,
          ]}
        >
          <RemoteImage
            uri={item.image}
            fallbackTint={item.tintFallback}
            style={styles.image}
          />
        </Pressable>
        <Pressable
          style={styles.heartBtn}
          onPress={onPressHeart}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Remove from wishlist"
        >
          <MaterialIcons
            name="favorite"
            size={18}
            color={WISHLIST_HEART_ACTIVE}
          />
        </Pressable>
      </View>
      <Pressable
        onPress={onPressCard}
        style={({ pressed }) => [
          styles.infoPress,
          pressed && styles.infoPressPressed,
        ]}
      >
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        {item.boutiqueName ? (
          <Text style={styles.boutique} numberOfLines={1}>
            {formatBoutiqueMeta({
              name: item.boutiqueName,
              rating: item.boutiqueRating ?? null,
              verified: item.boutiqueVerified ?? false,
            })}
          </Text>
        ) : null}
        <Text style={styles.price}>
          ₹
          {item.price.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </Pressable>
      <Pressable style={styles.cta} onPress={onMoveToCart}>
        <Text style={styles.ctaText}>MOVE TO CART</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    maxWidth: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: spacing.sm,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#f0f0f0",
  },
  imagePress: { flex: 1, borderRadius: 12, overflow: "hidden" },
  imagePressPressed: { opacity: 0.92 },
  infoPress: { paddingBottom: 0 },
  infoPressPressed: { opacity: 0.85 },
  imageWrap: {
    borderRadius: 12,
    overflow: "hidden",
    aspectRatio: 1,
    marginBottom: spacing.sm,
    backgroundColor: "transparent",
  },
  image: { width: "100%", height: "100%" },
  heartBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: NAVY,
    marginBottom: 4,
    minHeight: 36,
  },
  price: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: NAVY,
    marginBottom: spacing.sm,
  },
  boutique: {
    fontSize: fontSizes.xs,
    color: "#64748b",
    marginBottom: 4,
  },
  cta: {
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  ctaText: {
    fontSize: 9,
    fontWeight: "800",
    color: NAVY,
    letterSpacing: 0.6,
  },
});
