import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { useBoutique } from "@/hooks/useBoutique";
import {
  normalizeFilterKey,
  preloadBoutiqueBannerUris,
  type BoutiqueProductItemUi,
  type BoutiqueProfileViewModel,
} from "@/lib/boutiques/boutiqueUi";
import { BoutiqueActionButtons } from "@/lib/components/common/BoutiqueActionButtons";
import { BoutiqueCard } from "@/lib/components/common/BoutiqueCard";
import { BoutiqueHeader } from "@/lib/components/common/BoutiqueHeader";
import { BoutiqueHeroStatusBadge } from "@/lib/components/common/BoutiqueHeroStatusBadge";
import { BoutiqueProductCard } from "@/lib/components/common/BoutiqueProductCard";
import { RemoteImage } from "@/lib/components/common/RemoteImage";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import { useRecentlyViewedStore } from "@/lib/stores/recentlyViewedStore";
import { useSavedBoutiquesStore } from "@/lib/stores/savedBoutiquesStore";
import { applyLiveHoursToProfile } from "@/services/boutique.service";
import { addRecentlyViewed } from "@/services/api";
import { recordBoutiqueVisitAnalytics } from "@/services/analyticsTracking";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

const NAVY = "#0a1a33";
const UUID_V4_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const H_PADDING = spacing.lg;
/** Gutter between 2 collection columns (matches Figma ~12px). */
const COLLECTION_GAP = 12;
type BoutiqueProfileTab = string;
type BoutiqueProductItem = BoutiqueProductItemUi;
type BoutiqueProfile = BoutiqueProfileViewModel;

function paramId(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

function filterByTab(
  tab: BoutiqueProfileTab,
  items: BoutiqueProductItem[],
): BoutiqueProductItem[] {
  if (tab === "all") return items;
  const normalizedTab = normalizeFilterKey(tab);
  return items.filter((p) => normalizeFilterKey(p.collection) === normalizedTab);
}

function sanitizeWhatsapp(input: string): string {
  return input.replace(/[\s+-]/g, "");
}

export default function BoutiqueProfileScreen() {
  const router = useRouter();
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = paramId(params.id);
  const boutiqueQuery = useBoutique(id);
  const [minuteTick, setMinuteTick] = useState(0);
  const profile = useMemo(() => {
    const base = boutiqueQuery.data ?? null;
    if (!base) return null;
    return applyLiveHoursToProfile(base);
  }, [boutiqueQuery.data, minuteTick]);

  const [bannerIndex, setBannerIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<BoutiqueProfileTab>("all");
  const [saved, setSaved] = useState(false);
  const bannerListRef = React.useRef<FlatList<{ tint: string; uri?: string }> | null>(null);
  const [isGalleryModalVisible, setIsGalleryModalVisible] = useState(false);

  const collectionTileW = useMemo(
    () => Math.max(0, (SCREEN_W - H_PADDING * 2 - COLLECTION_GAP) / 2),
    [SCREEN_W],
  );

  /** Taller responsive hero — fills gap above title; capped so title/actions stay clear. */
  const heroHeight = useMemo(() => {
    const ideal = Math.round(SCREEN_H * 0.43);
    const minH = 296;
    const maxH = Math.min(440, Math.round(SCREEN_H * 0.48));
    return Math.max(minH, Math.min(maxH, ideal));
  }, [SCREEN_H]);
  const filteredProducts = useMemo(
    () => (profile ? filterByTab(activeTab, profile.products) : []),
    [profile, activeTab],
  );

  const tabCounts = useMemo(() => {
    if (!profile) return {} as Record<string, number>;
    const counts: Record<string, number> = { all: profile.products.length };
    for (const p of profile.products) {
      const k = p.collection;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [profile]);

  const trackBoutiqueVisit = useRecentlyViewedStore(
    (s) => s.trackBoutiqueVisit,
  );
  const { user, isAuthenticated } = useAuth();
  const requireAuth = useAuthGuard();
  const savedIds = useSavedBoutiquesStore((s) => s.ids);
  const hydrateSavedForUser = useSavedBoutiquesStore(
    (s) => s.hydrateForUser,
  );
  const saveForUser = useSavedBoutiquesStore((s) => s.saveForUser);
  const unsaveForUser = useSavedBoutiquesStore((s) => s.unsaveForUser);

  useEffect(() => {
    const timer = setInterval(() => setMinuteTick((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const base = boutiqueQuery.data;
    if (!base) return;
    preloadBoutiqueBannerUris(base.banners.map((b) => b.uri));
  }, [boutiqueQuery.data]);

  useEffect(() => {
    if (!profile || profile.banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIndex((prev) => {
        const nextIndex = (prev + 1) % profile.banners.length;
        bannerListRef.current?.scrollToOffset({
          offset: nextIndex * SCREEN_W,
          animated: true,
        });
        return nextIndex;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, [SCREEN_W, profile]);

  useEffect(() => {
    if (!profile) return;
    recordBoutiqueVisitAnalytics(profile.id, user?.id ?? null);
    void trackBoutiqueVisit(
      {
        id: profile.id,
        name: profile.name,
        image: profile.banners.find((ban) => ban.uri)?.uri ?? "",
        location: profile.location,
      },
      user?.id,
    );
    if (!user?.id) return;
    void addRecentlyViewed({
      user_id: user.id,
      boutique_id: profile.id,
    }).catch(() => {});
  }, [profile, trackBoutiqueVisit, user?.id]);

  const onBannerScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / SCREEN_W);
      if (!profile?.banners.length) return;
      const last = profile.banners.length - 1;
      setBannerIndex(Math.min(Math.max(i, 0), last));
    },
    [profile, SCREEN_W],
  );

  const openProduct = useCallback(
    (productId: string) => {
      pushProductDetails(router, productId, {
        boutiqueId: profile?.id ?? null,
      });
    },
    [router, profile?.id],
  );

  const openMaps = useCallback(() => {
    if (!profile) return;
    const latLng =
      profile.coordinates?.lat != null && profile.coordinates?.lng != null
        ? `${profile.coordinates.lat},${profile.coordinates.lng}`
        : null;
    const encodedQuery = encodeURIComponent(
      (latLng ?? profile.contactAddress ?? profile.mapsQuery).replace(/\+/g, " "),
    );
    const webFallback = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
    const nativeGoogle = latLng
      ? `google.navigation:q=${latLng}`
      : `google.navigation:q=${encodedQuery}`;
    const apple = latLng
      ? `http://maps.apple.com/?ll=${latLng}&q=${encodedQuery}`
      : `http://maps.apple.com/?q=${encodedQuery}`;
    void (async () => {
      try {
        if (Platform.OS === "android" && (await Linking.canOpenURL(nativeGoogle))) {
          await Linking.openURL(nativeGoogle);
          return;
        }
        if (Platform.OS === "ios" && (await Linking.canOpenURL(apple))) {
          await Linking.openURL(apple);
          return;
        }
        await Linking.openURL(webFallback);
      } catch {
        await Linking.openURL(webFallback);
      }
    })();
  }, [profile]);

  const dial = useCallback(() => {
    if (!profile) return;
    Linking.openURL(`tel:${profile.phone}`);
  }, [profile]);

  const openContact = useCallback(() => {
    if (!profile) return;
    router.push({
      pathname: "/(app)/contact-boutique",
      params: { boutiqueId: profile.id },
    });
  }, [profile, router]);

  const openBookAppointment = useCallback(() => {
    if (!profile?.id) {
      return;
    }
    requireAuth(
      () => {
        router.push({
          pathname: "/(app)/book-appointment",
          params: { boutiqueId: profile.id },
        });
      },
      {
        pendingAction: { type: "appointment", boutiqueId: profile.id },
        analyticsEvent: "appointment",
      },
    );
  }, [profile, requireAuth, router]);

  const openWhatsApp = useCallback(() => {
    if (!profile) return;
    Linking.openURL(`https://wa.me/${sanitizeWhatsapp(profile.whatsapp)}`);
  }, [profile]);

  useEffect(() => {
    if (!user?.id || !profile?.id) return;
    void hydrateSavedForUser(user.id);
  }, [hydrateSavedForUser, profile?.id, user?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    setSaved(savedIds.includes(profile.id));
  }, [profile?.id, savedIds]);

  useEffect(() => {
    if (!profile) return;
    if (!profile.collections.some((tab) => tab.key === activeTab)) {
      setActiveTab("all");
    }
  }, [activeTab, profile]);

  const handleSaveToggle = useCallback(() => {
    if (!profile?.id) return;
    if (!UUID_V4_LIKE.test(profile.id)) {
      return;
    }
    if (!isAuthenticated) {
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      requireAuth(
        () => {
          if (!user?.id) return;
          void saveForUser(user.id, profile.id);
          setSaved(true);
        },
        {
          pendingAction: { type: "boutique_save", boutiqueId: profile.id },
        },
      );
      return;
    }
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const next = !saved;
    setSaved(next);
    if (next) {
      void saveForUser(user!.id, profile.id);
    } else {
      void unsaveForUser(user!.id, profile.id);
    }
  }, [profile?.id, saved, saveForUser, unsaveForUser, user, isAuthenticated, requireAuth]);

  const listLoading = Boolean(id) && boutiqueQuery.isPending && !boutiqueQuery.data;
  const notFoundMessage =
    !id || boutiqueQuery.isError || (boutiqueQuery.isSuccess && !boutiqueQuery.data)
      ? "Boutique not found"
      : null;

  if (listLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <BoutiqueHeader onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading boutique...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile || notFoundMessage) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <BoutiqueHeader onBack={() => router.back()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{notFoundMessage ?? "Boutique not found"}</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.body}>
        <BoutiqueHeader
          onBack={() => router.back()}
          shareMessage={`${profile.name} — The Atelier`}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 120 + insets.bottom },
          ]}
        >
          <View style={styles.bannerWrap}>
            <FlatList
              ref={bannerListRef}
              data={profile.banners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              keyExtractor={(_, i) => `b-${i}`}
              onScroll={onBannerScroll}
              onMomentumScrollEnd={onBannerScroll}
              getItemLayout={(_, i) => ({
                length: SCREEN_W,
                offset: SCREEN_W * i,
                index: i,
              })}
              renderItem={({ item }) => (
                <Pressable onPress={() => setIsGalleryModalVisible(true)}>
                  <RemoteImage
                    uri={item.uri}
                    fallbackTint={item.tint}
                    style={{ width: SCREEN_W, height: heroHeight }}
                  />
                </Pressable>
              )}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)"]}
              locations={[0.25, 1]}
              style={[styles.heroGradient, { height: heroHeight }]}
              pointerEvents="none"
            />
            <BoutiqueHeroStatusBadge
              key={profile.openNow ? "boutique-open" : "boutique-closed"}
              openNow={profile.openNow}
              statusSubLabel={profile.statusSubLabel}
              opensAt={profile.openingTime}
              closesAt={profile.closingTime}
              style={styles.openBadge}
            />
            {profile.banners.length > 1 ? (
              <View style={styles.swipeHint} pointerEvents="none">
                <Ionicons
                  name="chevron-back"
                  size={12}
                  color="rgba(255,255,255,0.75)"
                />
                <Text style={styles.swipeHintText}>Swipe to explore</Text>
                <Ionicons
                  name="chevron-forward"
                  size={12}
                  color="rgba(255,255,255,0.75)"
                />
              </View>
            ) : null}
            {profile.banners.length > 1 ? (
              <View style={styles.dotsContainer}>
                {profile.banners.map((_, i) => (
                  <View
                    key={`bd-${i}`}
                    style={[styles.dot, i === bannerIndex && styles.activeDot]}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.heroCardOverlap}>
            <BoutiqueCard profile={profile} />
          </View>

          <BoutiqueActionButtons
            onDirections={openMaps}
            onCall={dial}
            onBookAppt={openBookAppointment}
            style={styles.boutiqueActionsRow}
          />

          <View style={styles.profileQuickActionsOuter}>
            <View
              className="flex-row items-center"
              style={styles.profileQuickActionsRow}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                accessibilityRole="button"
                className="mr-2 flex-1 flex-row items-center justify-center rounded-xl bg-green-500 py-3"
                style={styles.profileQuickActionWhatsApp}
                onPress={openWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text
                  className="ml-2 font-medium text-white"
                  style={styles.profileQuickActionWhatsAppText}
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: saved }}
                className={`ml-2 flex-1 flex-row items-center justify-center rounded-xl border border-gray-300 py-3 ${saved ? "bg-gray-100" : "bg-white"}`}
                style={[
                  styles.profileQuickActionSave,
                  saved && styles.profileQuickActionSaveOn,
                ]}
                onPress={handleSaveToggle}
              >
                <Ionicons
                  name={saved ? "bookmark" : "bookmark-outline"}
                  size={18}
                  color="#0B1C2C"
                />
                <Text
                  className="ml-2 font-medium text-[#0B1C2C]"
                  style={styles.profileQuickActionSaveText}
                >
                  {saved ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.about}>
            <Text style={styles.aboutTitle} numberOfLines={2}>
              {`About ${profile.name}`.toUpperCase()}
            </Text>
            <Text style={styles.aboutBody}>{profile.description}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}
            style={styles.tabBar}
          >
            {profile.collections.map((t) => {
              const on = activeTab === t.key;
              const count = t.key === "all" ? profile.products.length : tabCounts[t.key] ?? 0;
              const tabLabelText =
                t.key === "all" ? t.label : `${t.label} (${count})`;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setActiveTab(t.key)}
                  style={styles.tabItem}
                >
                  <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>
                    {tabLabelText}
                  </Text>
                  {on ? (
                    <View style={styles.tabUnderline} />
                  ) : (
                    <View style={styles.tabUnderlineHidden} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {filteredProducts.length === 0 ? (
            <Text style={styles.noItems}>
              No pieces in this collection yet.
            </Text>
          ) : (
            <FlatList
              data={filteredProducts}
              numColumns={2}
              scrollEnabled={false}
              nestedScrollEnabled
              keyExtractor={(item) => item.id}
              columnWrapperStyle={styles.collectionColumnWrapper}
              contentContainerStyle={styles.collectionListContent}
              renderItem={({ item }) => (
                <BoutiqueProductCard
                  item={item}
                  width={collectionTileW}
                  onPress={() => openProduct(item.id)}
                />
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, spacing.sm) },
          ]}
        >
          <Pressable style={styles.footerContact} onPress={openContact}>
            <Text style={styles.footerContactText}>CONTACT</Text>
          </Pressable>
          <Pressable style={styles.footerBook} onPress={openBookAppointment}>
            <Text style={styles.footerBookText}>BOOK APPOINTMENT</Text>
          </Pressable>
        </View>
      </View>
      <Modal visible={isGalleryModalVisible} transparent animationType="fade" onRequestClose={() => setIsGalleryModalVisible(false)}>
        <View style={styles.galleryModalBackdrop}>
          <Pressable style={styles.galleryModalClose} onPress={() => setIsGalleryModalVisible(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <FlatList
            data={profile.banners}
            horizontal
            pagingEnabled
            keyExtractor={(_, i) => `gm-${i}`}
            renderItem={({ item }) => (
              <RemoteImage uri={item.uri} fallbackTint={item.tint} style={[styles.galleryModalImage, { width: SCREEN_W }]} />
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  body: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  bannerWrap: {
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroCardOverlap: {
    marginTop: -30,
  },
  openBadge: { position: "absolute", right: spacing.md, top: spacing.md },
  swipeHint: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swipeHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    letterSpacing: 0.4,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 10,
  },
  boutiqueActionsRow: {
    marginBottom: spacing.md,
    paddingHorizontal: H_PADDING,
    gap: 12,
  },
  /** Matches `boutiqueActionsRow` / about section — padding only on wrapper, not on buttons. */
  profileQuickActionsOuter: {
    paddingHorizontal: H_PADDING,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileQuickActionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileQuickActionWhatsApp: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: "#22c55e",
    minHeight: 48,
  },
  profileQuickActionWhatsAppText: {
    marginLeft: 8,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "#fff",
  },
  profileQuickActionSave: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    minHeight: 48,
  },
  profileQuickActionSaveOn: {
    backgroundColor: "#f3f4f6",
  },
  profileQuickActionSaveText: {
    marginLeft: 8,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: "#0B1C2C",
  },
  about: { paddingHorizontal: H_PADDING, marginBottom: spacing.lg },
  aboutTitle: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: NAVY,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  aboutBody: { fontSize: fontSizes.sm, color: "#6b7280", lineHeight: 22 },
  tabBar: { marginBottom: spacing.md, maxHeight: 48 },
  tabScroll: {
    paddingHorizontal: H_PADDING,
    gap: spacing.lg,
    alignItems: "flex-end",
  },
  tabItem: { marginRight: spacing.md, paddingBottom: spacing.xs },
  tabLabel: { fontSize: fontSizes.sm, fontWeight: "600", color: "#9ca3af" },
  tabLabelOn: { color: NAVY, fontWeight: "700" },
  tabUnderline: {
    height: 3,
    backgroundColor: NAVY,
    marginTop: 4,
    borderRadius: 2,
  },
  tabUnderlineHidden: { height: 3, marginTop: 4, opacity: 0 },
  collectionColumnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: H_PADDING,
    marginBottom: 0,
  },
  collectionListContent: {
    paddingBottom: spacing.sm,
  },
  noItems: {
    textAlign: "center",
    color: "#9ca3af",
    padding: spacing.lg,
    fontSize: fontSizes.sm,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: H_PADDING,
    paddingTop: spacing.sm,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  footerContact: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: "#fff",
  },
  footerContactText: {
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: NAVY,
    letterSpacing: 0.5,
  },
  footerBook: {
    flex: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: NAVY,
  },
  footerBookText: {
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: { fontSize: fontSizes.md, color: "#6b7280" },
  emptyBtn: {
    backgroundColor: NAVY,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700" },
  galleryModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  galleryModalImage: {
    height: "100%",
  },
  galleryModalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 2,
    padding: 8,
  },
});
