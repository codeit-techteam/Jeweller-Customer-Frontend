import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { WishlistCard } from "@/lib/components/common/WishlistCard";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { FLAT_LIST_WINDOWED_PROPS } from "@/lib/constants/flatListPerformance";
import { fontSizes, spacing } from "@/src/constants/theme";

const NAVY = "#0f172a";
const MUTED = "#94a3b8";
const GOLD = "#c29a33";

export default function WishlistScreen() {
  const router = useRouter();
  const ids = useWishlistStore((s) => s.ids);
  const items = useWishlistStore((s) => s.items);
  const loading = useWishlistStore((s) => s.loading);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const refreshWishlist = useWishlistStore((s) => s.refresh);

  const rows = useMemo(() => ids.map((id) => items[id]).filter(Boolean), [ids, items]);

  const openProduct = useCallback(
    (id: string) => {
      pushProductDetails(router, id);
    },
    [router],
  );

  const onHeart = useCallback(
    (id: string) => {
      void toggleWishlist(id);
    },
    [toggleWishlist],
  );

  const { refreshControl } = usePullToRefresh(
    useCallback(() => refreshWishlist({ silent: true }), [refreshWishlist]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabRow}>
        <View style={styles.tabActive}>
          <Text style={styles.tabActiveText}>All Items ({rows.length})</Text>
          <View style={styles.tabUnderline} />
        </View>
      </View>
      <View style={styles.tabBorder} />

      {loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptySub}>Loading wishlist...</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>❤️</Text>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>
            Save jewellery you love and find it here later.
          </Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push("/(app)/categories")}
          >
            <Text style={styles.emptyBtnText}>Explore Collections</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          {...FLAT_LIST_WINDOWED_PROPS}
          data={rows}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          renderItem={({ item }) => (
            <WishlistCard
              item={item}
              onPressCard={() => openProduct(item.id)}
              onPressHeart={() => onHeart(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: NAVY,
  },
  headerSpacer: { width: 40 },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    backgroundColor: "#fff",
    paddingTop: spacing.sm,
  },
  tabActive: { alignItems: "flex-start" },
  tabActiveText: { fontSize: fontSizes.sm, fontWeight: "700", color: NAVY },
  tabUnderline: {
    marginTop: spacing.sm,
    height: 3,
    width: "100%",
    backgroundColor: NAVY,
    borderRadius: 2,
  },
  tabBorder: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    width: "100%",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  column: { justifyContent: "space-between", gap: spacing.md },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    backgroundColor: "#f8f9fa",
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: NAVY,
  },
  emptySub: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  emptyBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
    backgroundColor: NAVY,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GOLD,
  },
  emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: fontSizes.sm },
});
