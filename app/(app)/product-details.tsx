import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Image,
    LayoutAnimation,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    UIManager,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { getBoutiqueHoursStatus } from "@/lib/boutiques/boutiqueUi";
import { BoutiqueStatusBadge } from "@/lib/components/common/BoutiqueStatusBadge";
import { ProductSkeletonLoader } from "@/components/loaders";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/lib/components/common/EmptyState";
import { GoldMineModal } from "@/lib/components/common/GoldMineModal";
import { ProductImageSlider } from "@/lib/components/common/ProductImageSlider";
import { ProductInfo } from "@/lib/components/common/ProductInfo";
import {
    JewelleryMetalSegments,
    JewellerySizeChips,
} from "@/lib/components/product/JewelleryOptionSelectors";
import { RelatedProducts } from "@/lib/components/common/RelatedProducts";
import {
    fetchProductDetailUi,
    fetchRelatedProductDetails,
    type ProductDetail,
} from "@/lib/services/catalogApi";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import { boutiqueListingCoverImage } from "@/lib/services/mock/imageUrls";
import { snapshotFromProductDetail } from "@/lib/services/mock/wishlist";
import { useCartStore } from "@/lib/stores/cartStore";
import { useRecentlyViewedStore } from "@/lib/stores/recentlyViewedStore";
import { addRecentlyViewed } from "@/services/api";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

const GOLD = "#c29a33";
const NAVY = "#1e3a5f";
const DESC_TEXT = "#374151";
/** Official WhatsApp brand green */
const WHATSAPP_GREEN = "#25D366";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function paramId(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

const promiseTiles = [
  {
    title: "100% REFUND",
    body: "Return within 30 Days of Delivery",
    icon: "inventory" as const,
  },
  {
    title: "LIFETIME EXCHANGE & BUYBACK",
    body: "Exchange for current value or get cash",
    icon: "sync" as const,
  },
  {
    title: "100% CERTIFIED JEWELLERY",
    body: "BIS Hallmark, IGI, SGL, GIA, HKD",
    icon: "verified" as const,
  },
  {
    title: "EXCLUSIVE DESIGNS",
    body: "6000+ designs by award-winning designers",
    icon: "brush" as const,
  },
];

const promiseIcon = (name: (typeof promiseTiles)[number]["icon"]) => {
  switch (name) {
    case "inventory":
      return "inventory-2" as const;
    case "sync":
      return "sync" as const;
    case "verified":
      return "verified" as const;
    case "brush":
      return "brush" as const;
    default:
      return "star" as const;
  }
};

export default function ProductDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rawId = useLocalSearchParams<{ id?: string | string[] }>().id;
  const id = paramId(rawId);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const [size, setSize] = useState("");
  const [metal, setMetal] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(true);
  const [goldMineOpen, setGoldMineOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [priceBreakOpen, setPriceBreakOpen] = useState(true);

  const addItem = useCartStore((s) => s.addItem);
  const trackProductView = useRecentlyViewedStore((s) => s.trackProductView);
  const { user } = useAuth();

  // Fetch ONCE per product id. Never auto-triggered on focus, render, or
  // state changes — that previously caused an infinite refetch loop because
  // `setProduct` flipped the focus-effect dep.
  useEffect(() => {
    if (!id) {
      setProduct(null);
      setRelated([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const detail = await fetchProductDetailUi(id);
        if (cancelled) return;
        setProduct(detail);
        if (!detail) {
          setRelated([]);
          return;
        }
        const relatedItems = await fetchRelatedProductDetails(detail.relatedIds);
        if (cancelled) return;
        setRelated(relatedItems);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load product details", error);
        setProduct(null);
        setRelated([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Initialize size/metal selections only when the product id changes — never on
  // re-renders of the same product (otherwise user selections would reset).
  const productId = product?.id;
  useEffect(() => {
    if (!product) return;
    setSize(product.sizeOptions[0] ?? "");
    setMetal(product.metalOptions[0] ?? product.metal ?? "");
    setDescExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on productId only
  }, [productId]);

  // Record a recently-viewed entry once per (product, user) pair.
  useEffect(() => {
    if (!product) return;
    const imageUri = product.images[0]?.uri ?? "";
    void trackProductView(
      {
        id: product.boutique.id,
        name: product.boutique.name,
        image: boutiqueListingCoverImage(product.boutique.id),
        location: product.boutique.location,
      },
      {
        id: product.id,
        name: product.name,
        image: imageUri,
        price: product.price,
      },
      user?.id,
    );
    if (!user?.id) return;
    void addRecentlyViewed({
      user_id: user.id,
      product_id: product.id,
      boutique_id: product.boutique.id || undefined,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on productId + user.id only
  }, [productId, user?.id]);


  const toggleDescExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void Haptics.selectionAsync();
    setDescExpanded((prev) => !prev);
  }, []);

  const priceBreakTotals = useMemo(() => {
    if (!product) return { sumParts: 0, displayTotal: 0 };
    const sumParts =
      product.priceBreakup.gold +
      product.priceBreakup.gemstone +
      product.priceBreakup.making +
      product.priceBreakup.gst;
    const displayTotal = product.priceBreakupDisplayTotal ?? product.price;
    return { sumParts, displayTotal };
  }, [product]);

  const boutiqueHoursUi = useMemo(() => {
    if (!product?.boutique.opening_time || !product?.boutique.closing_time) {
      return null;
    }
    return getBoutiqueHoursStatus(
      product.boutique.opening_time,
      product.boutique.closing_time,
      product.boutique.working_days ?? [],
    );
  }, [product]);

  if (loading && !product) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={{ padding: spacing.md }}>
          <ProductSkeletonLoader count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    const continueBrowsing = () => {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace("/(app)/home");
    };
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.missingHeader}>
          <Pressable
            onPress={continueBrowsing}
            hitSlop={12}
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back-ios" size={22} color="#111827" />
          </Pressable>
          <Text style={styles.brand}>THE ATELIER</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.missingBody}>
          <EmptyState
            icon="inventory-2"
            title="Product unavailable"
            subtitle="This piece may have been removed or updated."
            actionLabel="Continue browsing"
            onAction={continueBrowsing}
          />
        </View>
      </SafeAreaView>
    );
  }

  const openCategory = () => {
    router.push({
      pathname: "/(app)/category-products",
      params: { category: product.category },
    });
  };

  const openRelated = (rid: string) => {
    pushProductDetails(router, rid);
  };

  const addToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      size,
      metal,
      qty: 1,
      subtitle: `${metal} / ${size}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back-ios" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.brand}>THE ATELIER</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ProductImageSlider
          productId={product.id}
          productName={product.name}
          images={product.images}
          wishlistSnapshot={snapshotFromProductDetail(product)}
        />

        <View style={styles.upperStack}>
          <ProductInfo
            name={product.name}
            price={product.price}
            rating={product.rating}
            reviews={product.reviews}
            discountLabel={product.discountLabel}
          />

          <JewellerySizeChips
            label={product.sizeSectionLabel}
            options={product.sizeOptions}
            selected={size}
            onSelect={setSize}
          />
          <JewelleryMetalSegments
            options={product.metalOptions}
            selected={metal}
            onSelect={setMetal}
          />
        </View>

        {product.tags &&
        (
          [
            product.tags.gender,
            product.tags.occasion,
            product.tags.style,
            product.tags.collection,
          ].filter(Boolean) as string[]
        ).length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagScroller}
          >
            {(
              [
                product.tags!.gender && { k: "Gender", v: product.tags!.gender },
                product.tags!.occasion && {
                  k: "Occasion",
                  v: product.tags!.occasion,
                },
                product.tags!.style && { k: "Style", v: product.tags!.style },
                product.tags!.collection && {
                  k: "Collection",
                  v: product.tags!.collection,
                },
              ].filter(Boolean) as { k: string; v: string }[]
            ).map(({ k, v }) => (
              <View key={`${k}-${v}`} style={styles.tagPill}>
                <Text style={styles.tagPillMuted}>{k}</Text>
                <Text style={styles.tagPillVal}>{v}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View style={[styles.trustRow, styles.trustRowSpaced]}>
          {[
            {
              icon: "workspace-premium" as const,
              label: "Certified Jewellery",
            },
            { icon: "autorenew" as const, label: "Lifetime Exchange" },
            { icon: "assignment-return" as const, label: "30-Day Return" },
          ].map((t) => (
            <View key={t.label} style={styles.trustItem}>
              <MaterialIcons name={t.icon} size={22} color="#4b5563" />
              <Text style={styles.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.descCard}>
          <Text style={styles.descHeading}>Product description</Text>
          <Text
            style={styles.descBody}
            numberOfLines={descExpanded ? undefined : 4}
          >
            {product.description && product.description.trim().length > 0
              ? product.description
              : "No description provided for this piece yet."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: descExpanded }}
            onPress={toggleDescExpanded}
            hitSlop={12}
            style={({ pressed }) => [
              styles.readMoreWrap,
              pressed && styles.readMorePressed,
            ]}
          >
            <Text style={styles.readMore}>
              {descExpanded ? "Read less" : "Read more"}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.boutiqueBlock, styles.boutiqueBlockSpaced]}>
          <Text style={styles.boutiqueHeading}>
            Available at Nearest Boutique
          </Text>
          <View style={styles.boutiqueCard}>
            <View style={styles.boutiqueRow}>
              {product.boutique.logo ?? product.boutique.image ? (
                <Image
                  accessibilityIgnoresInvertColors
                  source={{
                    uri: product.boutique.logo ?? product.boutique.image ?? "",
                  }}
                  style={styles.boutiqueLogo}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.boutiqueAvatar,
                    { backgroundColor: product.boutique.avatarTint },
                  ]}
                />
              )}
              <View style={styles.boutiqueMeta}>
                <View style={styles.boutiqueNameRow}>
                  <Text style={styles.boutiqueName} numberOfLines={1}>
                    {product.boutique.name}
                  </Text>
                  {product.boutique.verified ? (
                    <MaterialIcons
                      name="verified"
                      size={14}
                      color="#2563EB"
                      style={styles.boutiqueVerifiedIcon}
                    />
                  ) : null}
                </View>
                {boutiqueHoursUi ? (
                  <View style={styles.boutiqueStatusWrap}>
                    <BoutiqueStatusBadge
                      isOpen={boutiqueHoursUi.openNow}
                      subLabel={boutiqueHoursUi.statusSubLabel}
                      opensAt={product.boutique.opening_time}
                      closesAt={product.boutique.closing_time}
                      variant="compact"
                    />
                  </View>
                ) : null}
                <View style={styles.boutiqueRatingRow}>
                  <MaterialIcons name="star" size={14} color={GOLD} />
                  <Text style={styles.boutiqueRatingText}>
                    {product.boutique.rating &&
                    Number.isFinite(product.boutique.rating) &&
                    product.boutique.rating > 0
                      ? `${product.boutique.rating.toFixed(1)} partner rating`
                      : "Premium partner"}
                  </Text>
                </View>
                <Text style={styles.boutiqueLoc}>
                  {product.boutique.location}
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/boutique-profile",
                    params: {
                      id: product.boutique.id,
                    },
                  })
                }
              >
                <Text style={styles.viewProfile}>View Profile</Text>
              </Pressable>
            </View>
            <View style={styles.availRow}>
              <MaterialIcons name="check-circle" size={18} color="#16a34a" />
              <Text style={styles.availText}>
                Available at {product.boutiquesAvailable} boutiques near you.{" "}
                <Text style={styles.availLink} onPress={openCategory}>
                  View Stores
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.bookBtn}
          onPress={() => {
            const boutiquePayload = {
              id: product.boutique.id,
              name: product.boutique.name,
              address: product.boutique.address,
              location: product.boutique.location,
              rating: product.boutique.rating,
              distance: product.boutique.distance,
              image: product.boutique.image,
              logo: product.boutique.logo,
              phone: product.boutique.phone ?? null,
              whatsapp: product.boutique.whatsapp ?? null,
              coordinates: product.boutique.coordinates ?? null,
              latitude: product.boutique.latitude ?? null,
              longitude: product.boutique.longitude ?? null,
              openingTime: product.boutique.opening_time ?? null,
              closingTime: product.boutique.closing_time ?? null,
              workingDays: product.boutique.working_days ?? [],
            };
            const productPayload = {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.images[0]?.uri ?? null,
              category: product.category,
              boutique_id: product.boutique_id ?? product.boutique.id,
            };
            router.push({
              pathname: "/(app)/book-visit",
              params: {
                productId: product.id,
                boutiqueId: product.boutique.id,
                productData: JSON.stringify(productPayload),
                boutiqueData: JSON.stringify(boutiquePayload),
              },
            });
          }}
        >
          <Text style={styles.bookBtnText}>Book Store Visit</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </Pressable>

        <View style={styles.secondaryRow}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => {
              const phone = product.boutique.phone?.trim();
              if (!phone) {
                setActionError("Phone number not available for this boutique.");
                return;
              }
              Linking.openURL(`tel:${phone}`).catch(() =>
                setActionError("Unable to open dialer right now."),
              );
            }}
          >
            <MaterialIcons name="call" size={18} color={NAVY} />
            <Text style={styles.secondaryBtnText}>Call Boutique</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => {
              const digits = (product.boutique.whatsapp ?? "")
                .replace(/[^\d]/g, "")
                .trim();
              if (!digits) {
                setActionError("WhatsApp not available for this boutique.");
                return;
              }
              Linking.openURL(`https://wa.me/${digits}`).catch(() =>
                setActionError("Unable to open WhatsApp right now."),
              );
            }}
          >
            <FontAwesome5
              name="whatsapp"
              size={20}
              color={WHATSAPP_GREEN}
              brand
            />
            <Text style={styles.secondaryBtnText}>WhatsApp</Text>
          </Pressable>
        </View>

        <Pressable style={styles.addCart} onPress={addToCart}>
          <MaterialIcons name="shopping-bag" size={20} color="#fff" />
          <Text style={styles.addCartText}>Add to Cart</Text>
        </Pressable>

        {product.hasSpecsSection ? (
          <View style={styles.specsSection}>
            <Pressable
              style={styles.specsHead}
              onPress={() => setSpecsOpen((o) => !o)}
            >
              <Text style={styles.specsTitle}>Product Specifications</Text>
              <MaterialIcons
                name={specsOpen ? "expand-less" : "expand-more"}
                size={24}
                color="#111827"
              />
            </Pressable>
            {specsOpen ? (
              <View style={styles.specsCardWrap}>
                {[
                  ["METAL", product.specs.metal],
                  ["APPROX WEIGHT", product.specs.weight],
                  ["DIAMOND CARAT", product.specs.diamond],
                  ["DIMENSIONS", product.specs.dimensions],
                ].map(([k, v]) => (
                  <View key={String(k)} style={styles.specCard}>
                    <Text style={styles.specKey}>{k}</Text>
                    <Text style={styles.specVal}>{v}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {product.hasPriceBreakFromApi ? (
          <View style={styles.breakSection}>
            <Pressable
              style={styles.breakHead}
              onPress={() => setPriceBreakOpen((o) => !o)}
            >
              <Text style={[styles.breakTitle, styles.breakTitleHead]}>
                Price Break-up
              </Text>
              <MaterialIcons
                name={priceBreakOpen ? "expand-less" : "expand-more"}
                size={22}
                color="#111827"
              />
            </Pressable>
            {priceBreakOpen ? (
              <View style={styles.breakCardPremium}>
                {[
                  ["Gold", product.priceBreakup.gold],
                  ["Gemstone", product.priceBreakup.gemstone],
                  ["Making Charge", product.priceBreakup.making],
                  ["GST", product.priceBreakup.gst],
                ].map(([label, amt]) => (
                  <View key={label} style={styles.breakRow}>
                    <Text style={styles.breakLabel}>{label}</Text>
                    <Text style={styles.breakAmt}>
                      ₹{Number(amt).toLocaleString("en-IN")}
                    </Text>
                  </View>
                ))}
                <View style={styles.breakDivider} />
                <View style={styles.breakRow}>
                  <Text style={styles.breakTotalLabel}>Total</Text>
                  <Text style={styles.breakTotalAmt}>
                    ₹{priceBreakTotals.displayTotal.toLocaleString("en-IN")}
                  </Text>
                </View>
                {Math.abs(priceBreakTotals.sumParts - priceBreakTotals.displayTotal) > 3 ? (
                  <Text style={styles.breakNote}>
                    Components may reconcile with invoice totals.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.promiseSection}>
          <Text style={styles.promiseHeading}>Our Promise</Text>
          <View style={styles.promiseGrid}>
            {promiseTiles.map((tile) => (
              <View key={tile.title} style={styles.promiseTile}>
                <MaterialIcons
                  name={promiseIcon(tile.icon)}
                  size={28}
                  color={NAVY}
                />
                <Text style={styles.promiseTileTitle}>{tile.title}</Text>
                <Text style={styles.promiseTileBody}>{tile.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <RelatedProducts
          items={related}
          onSelect={openRelated}
          onViewAll={openCategory}
        />
        {actionError ? (
          <Text style={styles.inlineError}>{actionError}</Text>
        ) : null}

        <View style={styles.certBanner}>
          <View style={styles.certCol}>
            <Text style={styles.certMain}>BIS HALLMARK</Text>
            <Text style={styles.certSub}>BIS CERTIFIED</Text>
          </View>
          <View style={styles.certDivider} />
          <View style={styles.certCol}>
            <Text style={styles.certMain}>IGI DIAMOND</Text>
            <Text style={styles.certSub}>IGI CERTIFIED</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ]}
      >
        <Pressable
          style={styles.bottomOutline}
          onPress={() => setGoldMineOpen(true)}
        >
          <Text style={styles.bottomOutlineText}>10+1 Monthly Plan</Text>
        </Pressable>
        <Pressable
          style={styles.bottomSolid}
          onPress={() => {
            if (!product.boutique_id) {
              setActionError(
                "Boutique details are unavailable for this product.",
              );
              return;
            }
            router.push({
              pathname: "/(app)/contact-boutique",
              params: {
                boutiqueId: product.boutique_id,
                productId: product.id,
              },
            });
          }}
        >
          <Text style={styles.bottomSolidText}>Contact to Jeweller</Text>
        </Pressable>
      </View>

      <GoldMineModal
        visible={goldMineOpen}
        onClose={() => setGoldMineOpen(false)}
        productName={product.name}
        productPrice={product.price}
        imageUri={product.images[0]?.uri}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  brand: {
    fontSize: fontSizes.sm,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#111827",
  },
  scrollContent: { paddingBottom: spacing.xl },
  upperStack: { gap: spacing.lg },
  trustRowSpaced: {
    marginTop: spacing.xl,
  },
  trustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#f3f4f6",
  },
  trustItem: { flex: 1, alignItems: "center", gap: 4 },
  trustLabel: {
    fontSize: fontSizes.xs,
    color: "#4b5563",
    textAlign: "center",
    fontWeight: "500",
  },
  descCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing["2xl"],
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: "#fff",
    borderRadius: radius.lg + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eef0f4",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === "ios" ? 0.08 : 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  descHeading: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  descBody: {
    fontSize: 16,
    color: DESC_TEXT,
    lineHeight: 28,
    fontWeight: "400",
  },
  readMoreWrap: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  readMorePressed: { opacity: 0.75, backgroundColor: "#f3f4f6" },
  readMore: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    letterSpacing: 0.2,
  },
  boutiqueBlock: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  boutiqueBlockSpaced: { marginTop: spacing["2xl"] },
  boutiqueHeading: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#111827",
    marginBottom: spacing.sm,
  },
  boutiqueCard: {
    backgroundColor: "#f9fafb",
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  boutiqueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  boutiqueAvatar: { width: 48, height: 48, borderRadius: 24 },
  boutiqueLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
  },
  tagScroller: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
    flexGrow: 0,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#f3f4f6",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    marginRight: spacing.sm,
  },
  tagPillMuted: {
    fontSize: fontSizes.xs,
    color: "#9ca3af",
    fontWeight: "600",
  },
  tagPillVal: {
    fontSize: fontSizes.xs,
    color: "#111827",
    fontWeight: "700",
  },
  boutiqueMeta: { flex: 1 },
  boutiqueName: { fontSize: fontSizes.md, fontWeight: "700", color: "#111827" },
  boutiqueNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  boutiqueVerifiedIcon: {
    marginTop: 1,
  },
  boutiqueStatusWrap: { marginTop: 6, alignSelf: "flex-start" },
  boutiqueRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  boutiqueRatingText: { fontSize: fontSizes.xs, color: "#6b7280" },
  boutiqueLoc: { fontSize: fontSizes.xs, color: "#9ca3af", marginTop: 2 },
  viewProfile: { fontSize: fontSizes.sm, fontWeight: "600", color: NAVY },
  availRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  availText: { flex: 1, fontSize: fontSizes.sm, color: "#374151" },
  availLink: {
    fontWeight: "700",
    color: NAVY,
    textDecorationLine: "underline",
  },
  bookBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: GOLD,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  bookBtnText: { fontSize: fontSizes.md, fontWeight: "700", color: "#fff" },
  secondaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  secondaryBtnText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "#111827",
  },
  addCart: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: NAVY,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  addCartText: { fontSize: fontSizes.md, fontWeight: "700", color: "#fff" },
  specsSection: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  specsHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  specsTitle: { fontSize: fontSizes.md, fontWeight: "700", color: "#111827" },
  specsCardWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  specCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#fafafa",
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#f3f4f6",
  },
  specKey: { fontSize: fontSizes.xs, color: "#9ca3af", marginBottom: 4 },
  specVal: { fontSize: fontSizes.sm, fontWeight: "600", color: "#111827" },
  breakSection: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  breakHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  breakTitle: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#111827",
    marginBottom: spacing.sm,
  },
  breakTitleHead: { marginBottom: 0 },
  breakCardPremium: {
    backgroundColor: "#f8fafc",
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  breakDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#d1d5db",
    marginVertical: spacing.xs,
  },
  breakRow: { flexDirection: "row", justifyContent: "space-between" },
  breakLabel: { fontSize: fontSizes.sm, color: "#6b7280" },
  breakAmt: { fontSize: fontSizes.sm, color: "#111827" },
  breakTotalRow: {},
  breakTotalLabel: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#111827",
  },
  breakTotalAmt: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#111827",
  },
  breakNote: { fontSize: fontSizes.xs, color: "#9ca3af" },
  promiseSection: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  promiseHeading: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: "#111827",
    marginBottom: spacing.md,
  },
  promiseGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  promiseTile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#f9fafb",
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  promiseTileTitle: { fontSize: fontSizes.xs, fontWeight: "800", color: NAVY },
  promiseTileBody: { fontSize: fontSizes.xs, color: "#6b7280", lineHeight: 16 },
  certBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#f3f4f6",
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  certCol: { flex: 1, alignItems: "center" },
  certDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#d1d5db",
    marginHorizontal: spacing.md,
  },
  certMain: { fontSize: fontSizes.sm, fontWeight: "700", color: "#6b7280" },
  certSub: { fontSize: fontSizes.xs, color: "#9ca3af", marginTop: 4 },
  inlineError: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    color: "#b91c1c",
    fontSize: fontSizes.xs,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  bottomOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomOutlineText: { fontSize: fontSizes.sm, fontWeight: "700", color: NAVY },
  bottomSolid: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSolidText: { fontSize: fontSizes.sm, fontWeight: "700", color: "#fff" },
  missingHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  missingBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  missingTitle: { fontSize: fontSizes.lg, fontWeight: "600", color: "#6b7280" },
  missingBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: NAVY,
    borderRadius: radius.md,
  },
  missingBtnText: { color: "#fff", fontWeight: "700" },
});
