import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    BOUTIQUE_SORT_OPTIONS,
    BoutiqueSortDropdown,
    type BoutiqueSortOptionId,
} from "@/components/boutiques/BoutiqueSortDropdown";
import { BoutiqueSkeletonLoader } from "@/components/loaders";
import { useNetworkReachable } from "@/hooks/useNetworkReachable";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useUserLocation } from "@/hooks/useUserLocation";
import type { BoutiqueUiListItem } from "@/lib/boutiques/boutiqueUi";
import { BoutiqueStatusBadge } from "@/lib/components/common/BoutiqueStatusBadge";
import { RemoteImage } from "@/lib/components/common/RemoteImage";
import { fetchBoutiquesUi } from "@/lib/services/catalogApi";
import {
    boutiqueHasCoordinates,
    formatBoutiqueDistanceLine,
} from "@/lib/utils/formatBoutiqueDistance";
import { ApiError } from "@/services/api";
import { applyUserLocationToBoutiqueList } from "@/services/boutique.service";
import { BottomTabBar } from "@/src/components/navigation/BottomTabBar";
import { fontSizes, spacing } from "@/src/constants/theme";

type Boutique = BoutiqueUiListItem;

const NAVY = "#0D1B2A";
const MUTED = "#6B7280";
const CHIP_BG = "#F2F2F2";
const SCREEN_BG = "#F5F5F5";

const DISTANCE_OPTIONS = ["1 km", "5 km", "10 km"] as const;

function parseSectionType(
  raw: string | string[] | undefined,
): string | undefined {
  if (raw == null) return undefined;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "featured" || v === "nearest" ? v : undefined;
}

function parseDistanceKm(label: string | null): number | null {
  if (!label) return null;
  const n = parseInt(label.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function matchesSearch(item: Boutique, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [
    item.name,
    item.location,
    item.tag,
    item.description,
    item.latestCollectionLabel ?? "",
    ...item.tags,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

function applySortOption(
  list: Boutique[],
  sort: BoutiqueSortOptionId | null,
): Boutique[] {
  const sorted = [...list];
  /** `null` = nearest-first (default). */
  const effective: BoutiqueSortOptionId = sort ?? "NEAREST";

  switch (effective) {
    case "NEAREST":
      sorted.sort((a, b) => {
        const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
      break;
    case "HIGHEST_RATED":
      sorted.sort(
        (a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount,
      );
      break;
    case "OPEN_NOW":
      sorted.sort((a, b) => {
        if (a.openNow !== b.openNow) return a.openNow ? -1 : 1;
        const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
      break;
    case "MOST_REVIEWED":
      sorted.sort(
        (a, b) => b.reviewsCount - a.reviewsCount || b.rating - a.rating,
      );
      break;
    default:
      break;
  }
  return sorted;
}

function filterAndSort(
  list: Boutique[],
  searchQuery: string,
  maxDistanceKm: number | null,
  sort: BoutiqueSortOptionId | null,
): Boutique[] {
  let out = list.filter((item) => matchesSearch(item, searchQuery));
  if (maxDistanceKm != null) {
    out = out.filter(
      (item) => item.distanceKm != null && item.distanceKm <= maxDistanceKm,
    );
  }
  return applySortOption(out, sort);
}

export default function BoutiquesScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string | string[] }>();
  const sectionType = parseSectionType(type);

  const [searchQuery, setSearchQuery] = useState("");
  const [rawBoutiques, setRawBoutiques] = useState<Boutique[]>([]);
  const [selectedSort, setSelectedSort] = useState<BoutiqueSortOptionId | null>(
    null,
  );
  const [selectedDistance, setSelectedDistance] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reachable = useNetworkReachable();
  const {
    coords: userCoords,
    loading: locationLoading,
    permission: locationPermission,
    gpsFailed: locationGpsFailed,
  } = useUserLocation(true);

  const boutiquesData = useMemo(
    () => applyUserLocationToBoutiqueList(rawBoutiques, userCoords),
    [rawBoutiques, userCoords],
  );

  const loadBoutiques = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const rows = await fetchBoutiquesUi();
      setRawBoutiques(rows);
      setError(null);
    } catch (err) {
      console.error("Failed to load boutiques", err);
      const message =
        err instanceof ApiError ? err.message : "Unable to load boutiques";
      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const { refreshControl } = usePullToRefresh(
    useCallback(() => loadBoutiques({ silent: true }), [loadBoutiques]),
  );

  useFocusEffect(
    useCallback(() => {
      void loadBoutiques();
      return () => {};
    }, [loadBoutiques]),
  );

  const maxDistanceKm = useMemo(
    () => parseDistanceKm(selectedDistance),
    [selectedDistance],
  );

  const filteredBoutiques = useMemo(
    () =>
      filterAndSort(boutiquesData, searchQuery, maxDistanceKm, selectedSort),
    [boutiquesData, searchQuery, maxDistanceKm, selectedSort],
  );

  const hasUserAppliedFilters = useMemo(
    () => Boolean(searchQuery.trim() || selectedDistance || selectedSort),
    [searchQuery, selectedDistance, selectedSort],
  );

  const openProfile = useCallback(
    (item: Boutique) => {
      router.push({
        pathname: "/(app)/boutique-profile",
        params: { id: item.id },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Boutique }) => {
      return (
        <View style={styles.card}>
          <Pressable onPress={() => openProfile(item)} style={styles.cardMain}>
            <View style={styles.cardImageWrap}>
              <RemoteImage
                uri={item.image ?? undefined}
                fallbackTint="#c4b28f"
                style={styles.cardImage}
              />
              <View style={styles.cardStatusCorner} pointerEvents="none">
                <BoutiqueStatusBadge
                  isOpen={item.openNow}
                  subLabel={item.statusSubLabel}
                  opensAt={item.openingTime}
                  closesAt={item.closingTime}
                  variant="corner"
                  showSubLabel={false}
                />
              </View>
              {item.logoImage ? (
                <View style={styles.cardLogoRing} pointerEvents="none">
                  <RemoteImage
                    uri={item.logoImage}
                    style={styles.cardLogoImage}
                  />
                </View>
              ) : null}
            </View>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.tag}>{item.tag}</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              ★ {item.rating.toFixed(1)} (
              {item.reviewsCount > 0
                ? `${item.reviewsCount} reviews`
                : "No reviews yet"}
              ) ·{" "}
              {formatBoutiqueDistanceLine({
                distanceKm: item.distanceKm,
                locationLoading,
                hasBoutiqueCoords: boutiqueHasCoordinates(item),
                permission: locationPermission,
                userLocationGpsFailed: locationGpsFailed,
              })}{" "}
              {item.location}
            </Text>
            {item.hoursLabel ? (
              <Text style={styles.hoursLine}>{item.hoursLabel}</Text>
            ) : null}
            <Text style={styles.collectionLine}>LATEST COLLECTION</Text>
            <Text style={styles.collectionValue} numberOfLines={2}>
              {item.latestCollectionLabel ??
                "Assigned collections & new arrivals"}
            </Text>
          </Pressable>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => openProfile(item)}
            >
              <Text style={styles.primaryBtnText}>Book Visit</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => openProfile(item)}
            >
              <Text style={styles.secondaryBtnText}>View Profile</Text>
            </Pressable>
          </View>
        </View>
      );
    },
    [openProfile, locationLoading, locationPermission, locationGpsFailed],
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.heading}>Boutiques</Text>
        {reachable === false ? (
          <Text style={styles.offlineHint}>
            No connection. Confirm Wi‑Fi and LAN API URL (EXPO_PUBLIC_API_URL).
          </Text>
        ) : null}
        {loading ? (
          <Text style={styles.sectionHint}>Loading boutiques...</Text>
        ) : null}
        {error && !loading ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadBoutiques()}
              style={styles.retryBtn}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
        {sectionType ? (
          <Text style={styles.sectionHint}>
            {sectionType === "featured"
              ? "Featured selection"
              : "Nearest locations"}
          </Text>
        ) : null}

        <View style={styles.locationRow}>
          <MaterialIcons
            name="location-on"
            size={20}
            color="#8B7355"
            style={styles.locationIcon}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            Karol Bagh, Delhi
          </Text>
          <Pressable hitSlop={8} onPress={() => {}} accessibilityRole="button">
            <Text style={styles.changeLink}>CHANGE</Text>
          </Pressable>
        </View>

        <View style={[styles.searchContainer, SEARCH_SHADOW]}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search boutiques, collections, designers..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setFilterVisible(true)}
            hitSlop={8}
            style={styles.filterIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Open filters"
          >
            <MaterialIcons name="tune" size={22} color={NAVY} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaPrimary} numberOfLines={1}>
            <Text style={styles.metaCount}>{filteredBoutiques.length}</Text>
            {` Boutiques`}
          </Text>
          <View style={styles.sortDropdownWrap}>
            <BoutiqueSortDropdown
              value={selectedSort}
              onChange={setSelectedSort}
            />
          </View>
        </View>
      </View>
    ),
    [
      sectionType,
      loading,
      error,
      reachable,
      searchQuery,
      selectedSort,
      filteredBoutiques.length,
      loadBoutiques,
    ],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        style={styles.listFlex}
        data={filteredBoutiques}
        keyExtractor={(item) => item.id}
        extraData={`${searchQuery}-${selectedSort}-${selectedDistance}-${locationLoading}-${locationPermission}-${userCoords?.lat ?? ""}-${userCoords?.lng ?? ""}-${locationGpsFailed}`}
        contentContainerStyle={styles.content}
        refreshControl={refreshControl}
        ListHeaderComponent={ListHeader}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptySkeleton}>
              <BoutiqueSkeletonLoader count={8} />
            </View>
          ) : !error && boutiquesData.length > 0 && hasUserAppliedFilters ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No boutiques match</Text>
              <Text style={styles.emptySub}>
                Try adjusting search, distance, or sort.
              </Text>
            </View>
          ) : !error && boutiquesData.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No boutiques found</Text>
              <Text style={styles.emptySub}>
                Pull to refresh or tap Retry above.
              </Text>
            </View>
          ) : null
        }
      />
      <BottomTabBar />

      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setFilterVisible(false)}
            accessibilityLabel="Close"
          />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filters</Text>

            <Text style={styles.sheetSectionTitle}>Distance</Text>
            {DISTANCE_OPTIONS.map((d) => {
              const selected = selectedDistance === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setSelectedDistance(selected ? null : d)}
                  style={styles.sheetRow}
                >
                  <Text
                    style={[
                      styles.sheetRowText,
                      selected && styles.sheetRowTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                  {selected ? (
                    <MaterialIcons name="check" size={20} color={NAVY} />
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setSelectedDistance(null)}
              style={styles.clearDistance}
            >
              <Text style={styles.clearDistanceText}>
                Clear distance filter
              </Text>
            </Pressable>

            <Text style={styles.sheetSectionTitle}>Sort by</Text>
            {BOUTIQUE_SORT_OPTIONS.map((opt) => {
              const selected = selectedSort === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setSelectedSort(opt.id)}
                  style={styles.sheetRow}
                >
                  <Text
                    style={[
                      styles.sheetRowText,
                      selected && styles.sheetRowTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected ? (
                    <MaterialIcons name="check" size={20} color={NAVY} />
                  ) : null}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setSelectedSort(null)}
              style={styles.clearDistance}
            >
              <Text style={styles.clearDistanceText}>Clear sort</Text>
            </Pressable>

            <Pressable
              style={styles.applyBtn}
              onPress={() => setFilterVisible(false)}
            >
              <Text style={styles.applyText}>Apply filters</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SEARCH_SHADOW = Platform.select({
  ios: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  android: { elevation: 2 },
  default: {},
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SCREEN_BG },
  listFlex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    flexGrow: 1,
    paddingTop: 4,
  },
  header: { marginBottom: spacing.lg, paddingTop: 6 },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: NAVY,
    letterSpacing: -0.3,
  },
  sectionHint: {
    marginTop: 4,
    fontSize: fontSizes.xs,
    color: MUTED,
    fontWeight: "600",
  },
  offlineHint: {
    marginTop: 8,
    fontSize: fontSizes.xs,
    color: "#92400e",
    fontWeight: "600",
    lineHeight: 16,
  },
  errorBanner: { marginTop: 10, gap: 8 },
  errorText: {
    fontSize: fontSizes.xs,
    color: "#b91c1c",
    fontWeight: "600",
    lineHeight: 16,
  },
  retryBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: NAVY,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: fontSizes.xs },
  emptySkeleton: { paddingTop: spacing.sm },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  locationIcon: { marginRight: 2 },
  locationText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: "#374151",
    fontWeight: "500",
  },
  changeLink: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.6,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(15, 27, 42, 0.05)",
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: NAVY,
    paddingVertical: 0,
    fontWeight: "500",
  },
  filterIconBtn: { padding: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 4,
    gap: 12,
  },
  metaPrimary: {
    fontSize: fontSizes.sm,
    color: MUTED,
    flex: 1,
    minWidth: 0,
  },
  metaCount: {
    fontWeight: "700",
    color: NAVY,
  },
  sortDropdownWrap: { flexShrink: 0 },
  card: {
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: spacing.md,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      default: {},
    }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(15, 27, 42, 0.06)",
  },
  cardMain: { borderRadius: 12 },
  cardImageWrap: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  cardImage: { height: 180, borderRadius: 12, overflow: "hidden" },
  cardStatusCorner: {
    position: "absolute",
    top: 10,
    right: 10,
    alignItems: "flex-end",
    gap: 4,
    maxWidth: "55%",
  },
  cardLogoRing: {
    position: "absolute",
    bottom: -14,
    left: "50%",
    marginLeft: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#fff",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  cardLogoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  tag: { fontSize: 9, letterSpacing: 1, color: "#6B7280", fontWeight: "600" },
  name: {
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: NAVY,
    marginTop: spacing.xs,
  },
  meta: { marginTop: 4, fontSize: fontSizes.xs, color: MUTED, lineHeight: 18 },
  hoursLine: {
    marginTop: 4,
    fontSize: fontSizes.xs,
    color: "#374151",
    fontWeight: "600",
  },
  collectionLine: {
    marginTop: 8,
    fontSize: 9,
    letterSpacing: 0.9,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  collectionValue: {
    marginTop: 4,
    fontSize: fontSizes.xs,
    color: NAVY,
    fontWeight: "600",
    lineHeight: 18,
  },
  buttonRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  primaryBtn: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { fontSize: fontSizes.xs, color: "#fff", fontWeight: "700" },
  secondaryBtn: {
    flex: 1,
    backgroundColor: CHIP_BG,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: fontSizes.xs, color: NAVY, fontWeight: "700" },
  empty: {
    paddingVertical: spacing["2xl"],
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: { fontSize: fontSizes.md, fontWeight: "700", color: NAVY },
  emptySub: {
    marginTop: 8,
    fontSize: fontSizes.sm,
    color: MUTED,
    textAlign: "center",
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 34, default: 24 }),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: NAVY,
    marginBottom: 16,
  },
  sheetSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 10,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  sheetRowText: {
    fontSize: 16,
    color: "#374151",
  },
  sheetRowTextSelected: {
    fontWeight: "700",
    color: NAVY,
  },
  clearDistance: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  clearDistanceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  applyBtn: {
    backgroundColor: NAVY,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  applyText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
