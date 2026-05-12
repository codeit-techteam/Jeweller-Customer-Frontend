import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { WishlistCard } from "@/lib/components/common/WishlistCard";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import { getProductById } from "@/lib/services/mock/products";
import { useCartStore } from "@/lib/stores/cartStore";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { fontSizes, spacing } from "@/src/constants/theme";

const NAVY = "#0f172a";
const MUTED = "#94a3b8";

export default function WishlistScreen() {
  const router = useRouter();
  const ids = useWishlistStore((s) => s.ids);
  const items = useWishlistStore((s) => s.items);
  const loading = useWishlistStore((s) => s.loading);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const removeWishlist = useWishlistStore((s) => s.remove);
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const cartCount = useMemo(
    () => cartItems.reduce((a, x) => a + x.qty, 0),
    [cartItems],
  );

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

  const onMoveToCart = useCallback(
    (id: string) => {
      const product = getProductById(id);
      if (!product) {
        Toast.show({ type: "error", text1: "Product unavailable" });
        return;
      }
      const row = items[id];
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        size: product.sizeOptions[0] ?? "16",
        metal: product.metal,
        qty: 1,
        subtitle: `${product.metal} / ${product.sizeOptions[0] ?? "16"}`,
        imageUri: row?.image?.startsWith("http") ? row.image : undefined,
      });
      void removeWishlist(id);
      Toast.show({
        type: "success",
        text1: "Added to cart",
        text2: product.name,
      });
    },
    [addItem, items, removeWishlist],
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
        <Pressable
          hitSlop={12}
          onPress={() => router.push("/(app)/cart")}
          style={styles.cartWrap}
          accessibilityRole="button"
        >
          <MaterialIcons name="shopping-bag" size={24} color={NAVY} />
          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {cartCount > 99 ? "99+" : String(cartCount)}
              </Text>
            </View>
          ) : null}
        </Pressable>
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
          <MaterialIcons name="favorite-border" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>
            Save pieces you love — they will show up here.
          </Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push("/(app)/trending")}
          >
            <Text style={styles.emptyBtnText}>Browse products</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <WishlistCard
              item={item}
              onPressCard={() => openProduct(item.id)}
              onPressHeart={() => onHeart(item.id)}
              onMoveToCart={() => onMoveToCart(item.id)}
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
  cartWrap: {
    position: "relative",
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
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
  },
  emptyTitle: {
    marginTop: spacing.lg,
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: NAVY,
  },
  emptySub: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
    backgroundColor: NAVY,
  },
  emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: fontSizes.sm },
});
