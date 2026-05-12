import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import {
    Dimensions,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BoutiqueStatusBadge } from "@/lib/components/common/BoutiqueStatusBadge";
import { ProductCard } from "@/lib/components/common/ProductCard";
import { RemoteImage } from "@/lib/components/common/RemoteImage";
import {
  selectDistanceLineGpsFailed,
  useUserLocationStore,
} from "@/lib/stores/userLocationStore";
import {
  boutiqueHasCoordinates,
  formatBoutiqueDistanceLine,
} from "@/lib/utils/formatBoutiqueDistance";
import {
    toSpotlightProduct,
    type RecentlyViewedBoutique,
} from "@/lib/services/mock/recentlyViewed";
import { parseCoord } from "@/utils/calculateDistance";
import { snapshotFromRecentProduct } from "@/lib/services/mock/wishlist";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

const GOLD = "#b8860b";
const GOLD_DARK = "#9a8436";
const NAVY = "#0f172a";
const MUTED = "#666666";

type Props = {
  item: RecentlyViewedBoutique;
  productCardWidth: number;
  onPressBoutique: () => void;
  onPressProduct: (productId: string) => void;
  onContinueExploring: () => void;
  onViewProducts: () => void;
  onRemove?: () => void;
};

export function RecentlyViewedBoutiqueCard({
  item,
  productCardWidth,
  onPressBoutique,
  onPressProduct,
  onContinueExploring,
  onViewProducts,
  onRemove,
}: Props) {
  const wishIds = useWishlistStore((s) => s.ids);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const locationLoading = useUserLocationStore((s) => s.loading);
  const locationPermission = useUserLocationStore((s) => s.permission);
  const userLocationGpsFailed = useUserLocationStore(selectDistanceLineGpsFailed);

  const onCall = () => {
    const raw = item.phone?.trim();
    if (!raw) return;
    Linking.openURL(`tel:${raw.replace(/\s/g, "")}`).catch(() => {});
  };

  const onDirections = () => {
    const la = parseCoord(item.latitude);
    const lo = parseCoord(item.longitude);
    if (la != null && lo != null) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${la},${lo}`,
      ).catch(() => {});
      return;
    }
    const q = encodeURIComponent(`${item.location} jewellery`);
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${q}`,
    ).catch(() => {});
  };

  return (
    <Pressable
      style={styles.card}
      onLongPress={onRemove}
      delayLongPress={500}
      disabled={!onRemove}
    >
      <Pressable onPress={onPressBoutique}>
        <View style={styles.heroWrap}>
          <RemoteImage
            uri={item.heroImage}
            fallbackTint="#e5e7eb"
            style={styles.hero}
          />
          {item.verified ? (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={12} color={GOLD} />
              <Text style={styles.verifiedText}>VERIFIED</Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Pressable onPress={onPressBoutique} style={styles.namePress}>
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
          <View style={styles.roundActions}>
            <Pressable style={styles.roundBtn} onPress={onCall} hitSlop={8}>
              <MaterialIcons name="phone" size={18} color={MUTED} />
            </Pressable>
            <Pressable
              style={styles.roundBtn}
              onPress={onDirections}
              hitSlop={8}
            >
              <MaterialIcons name="send" size={18} color={MUTED} />
            </Pressable>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingPill}>
            <MaterialIcons name="star" size={12} color={GOLD} />
            <Text style={styles.ratingNum}>{item.rating.toFixed(1)}</Text>
          </View>
          <Text style={styles.reviews}>
            (
            {item.reviews > 0 ? `${item.reviews} reviews` : "No reviews yet"})
          </Text>
        </View>

        <View style={styles.locRow}>
          <MaterialIcons name="place" size={14} color={MUTED} />
          <Text style={styles.locText}>
            {item.location}
            {" • "}
            {formatBoutiqueDistanceLine({
              distanceKm: item.distanceKm,
              locationLoading,
              hasBoutiqueCoords: boutiqueHasCoordinates(item),
              permission: locationPermission,
              userLocationGpsFailed,
            })}
          </Text>
        </View>

        <View style={styles.tagsRow}>
          {item.tags.map((t) => (
            <View key={t} style={styles.tagChip}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
          <BoutiqueStatusBadge
            isOpen={item.openNow}
            subLabel={item.statusSubLabel}
            opensAt={item.openingTime}
            closesAt={item.closingTime}
            variant="compact"
          />
        </View>

        <Text style={styles.context}>{item.contextText}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
        >
          {item.products.slice(0, 3).map((p) => (
            <View key={p.id} style={styles.thumbWrap}>
              <ProductCard
                product={toSpotlightProduct(p)}
                cardWidth={productCardWidth}
                onPress={() => onPressProduct(p.id)}
                isWishlisted={wishIds.includes(p.id)}
                onWishlistPress={() =>
                  void toggleWishlist(p.id, snapshotFromRecentProduct(p))
                }
              />
            </View>
          ))}
          {item.moreCount > 0 ? (
            <View
              style={[
                styles.moreTile,
                {
                  width: productCardWidth,
                  minHeight: productCardWidth + 52,
                },
              ]}
            >
              <Text style={styles.moreText}>+{item.moreCount}</Text>
            </View>
          ) : null}
        </ScrollView>

        <Pressable
          style={({ pressed }) => [
            styles.btnPrimary,
            pressed && styles.pressed,
          ]}
          onPress={onContinueExploring}
        >
          <Text style={styles.btnPrimaryText}>CONTINUE EXPLORING</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.btnOutline,
            pressed && styles.pressed,
          ]}
          onPress={onViewProducts}
        >
          <Text style={styles.btnOutlineText}>VIEW PRODUCTS</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const { width: SCREEN_W } = Dimensions.get("window");

export function recentlyViewedProductCardWidth(): number {
  const pad = spacing.lg * 2 + spacing.md * 2;
  return Math.min(132, (SCREEN_W - pad) * 0.32);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: spacing.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroWrap: {
    position: "relative",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  hero: {
    width: "100%",
    height: 160,
  },
  verifiedBadge: {
    position: "absolute",
    left: spacing.sm,
    top: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: "800",
    color: NAVY,
    letterSpacing: 0.4,
  },
  body: { padding: spacing.md },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  namePress: { flex: 1 },
  name: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: NAVY,
    lineHeight: 22,
  },
  roundActions: { flexDirection: "row", gap: spacing.sm },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef9e7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  ratingNum: { fontSize: fontSizes.sm, fontWeight: "800", color: NAVY },
  reviews: { fontSize: fontSizes.sm, color: MUTED },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },
  locText: { fontSize: fontSizes.sm, color: MUTED, flex: 1 },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: "#f3f4f6",
  },
  tagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#4b5563",
    letterSpacing: 0.4,
  },
  context: {
    fontSize: fontSizes.xs,
    color: MUTED,
    marginBottom: spacing.md,
  },
  thumbRow: {
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingRight: spacing.sm,
  },
  thumbWrap: {
    marginRight: spacing.sm,
  },
  moreTile: {
    borderRadius: radius.md,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  moreText: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: "#64748b",
  },
  btnPrimary: {
    backgroundColor: GOLD_DARK,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.8,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: GOLD_DARK,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  btnOutlineText: {
    color: GOLD_DARK,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.8,
  },
  pressed: { opacity: 0.9 },
});
