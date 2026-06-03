import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CurrentLocationCard,
  LocationCityCard,
  LocationListSkeleton,
  LocationScreenBackground,
  LocationSearchBar,
  LocationSelectorHeader,
  SectionHeading,
  listContentStyle,
  LOCATION_SCREEN_GUTTER,
} from "@/components/location/LocationSelectorUi";
import { useDiscoveryLocation } from "@/hooks/useDiscoveryLocation";
import type { BoutiqueApiListRow } from "@/lib/boutiques/boutiqueUi";
import {
  buildLocationSearchIndex,
  filterPlaces,
  geocodeSearchPlaces,
  resolvePlaceCoordinates,
  type LocationPlace,
} from "@/lib/location/locationSearch";
import { exitScreen } from "@/lib/navigation/safeRouter";
import { useUserLocationStore } from "@/lib/stores/userLocationStore";
import { getBoutiques } from "@/services/api";
import { fontSizes, spacing } from "@/src/constants/theme";

const MUTED = "#6B7280";

function parseReturnTo(
  raw: string | string[] | undefined,
): "/(app)/boutiques" | "/(app)/home" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "home" ? "/(app)/home" : "/(app)/boutiques";
}

function placeIcon(
  kind: LocationPlace["kind"],
): React.ComponentProps<typeof MaterialIcons>["name"] {
  if (kind === "metro") return "location-city";
  if (kind === "geocode") return "travel-explore";
  return "storefront";
}

export default function LocationSelectorScreen() {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams<{
    returnTo?: string | string[];
  }>();
  const returnHref = parseReturnTo(returnToParam);

  const { setManual, useCurrentLocation, displayLabel } = useDiscoveryLocation();
  const [query, setQuery] = useState("");
  const [metros, setMetros] = useState<LocationPlace[]>([]);
  const [areas, setAreas] = useState<LocationPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [usingGps, setUsingGps] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    void useUserLocationStore.getState().init();
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const rows = await getBoutiques();
        if (!mounted) return;
        const index = await buildLocationSearchIndex(rows as BoutiqueApiListRow[]);
        setMetros(index.metros);
        setAreas(index.areas);
      } catch {
        if (mounted) {
          setMetros([]);
          setAreas([]);
        }
      } finally {
        if (mounted) setLoadingPlaces(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const allLocalPlaces = useMemo(() => [...metros, ...areas], [metros, areas]);

  const localResults = useMemo(() => {
    const q = query.trim();
    if (!q) return metros;
    return filterPlaces(allLocalPlaces, q);
  }, [allLocalPlaces, metros, query]);

  const [geocodeResults, setGeocodeResults] = useState<LocationPlace[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setGeocodeResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setGeocodeLoading(true);
      void geocodeSearchPlaces(q)
        .then((rows) => setGeocodeResults(rows))
        .finally(() => setGeocodeLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const displayResults = useMemo(() => {
    const seen = new Set<string>();
    const merged: LocationPlace[] = [];
    const pool =
      query.trim().length >= 2 ? [...localResults, ...geocodeResults] : localResults;
    for (const p of pool) {
      const key = p.label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(p);
    }
    return merged;
  }, [localResults, geocodeResults, query]);

  const finishAndExit = useCallback(() => {
    Keyboard.dismiss();
    exitScreen(router, { fallbackHref: returnHref });
  }, [router, returnHref]);

  const handleSelect = useCallback(
    async (place: LocationPlace) => {
      setSelectingId(place.id);
      try {
        const coords = await resolvePlaceCoordinates(place);
        if (!coords) return;
        await setManual(place.label, coords.lat, coords.lng);
        finishAndExit();
      } finally {
        setSelectingId(null);
      }
    },
    [finishAndExit, setManual],
  );

  const handleUseGps = useCallback(async () => {
    setGpsError(null);
    setUsingGps(true);
    try {
      const ok = await useCurrentLocation();
      if (ok) {
        finishAndExit();
      } else {
        setGpsError(
          "Could not detect location. Enable GPS or pick a city below.",
        );
      }
    } finally {
      setUsingGps(false);
    }
  }, [finishAndExit, useCurrentLocation]);

  const sectionTitle = query.trim()
    ? "Search results"
    : metros.length > 0
      ? "Popular cities"
      : "Boutique areas";

  const renderItem = useCallback(
    ({ item }: { item: LocationPlace }) => (
      <LocationCityCard
        title={item.label}
        subtitle={item.subtitle}
        icon={placeIcon(item.kind)}
        busy={selectingId === item.id}
        onPress={() => void handleSelect(item)}
      />
    ),
    [handleSelect, selectingId],
  );

  const ListHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <CurrentLocationCard
          onPress={() => void handleUseGps()}
          busy={usingGps}
          displayLabel={displayLabel}
          error={gpsError}
        />
        <SectionHeading title={sectionTitle} />
      </View>
    ),
    [displayLabel, gpsError, handleUseGps, sectionTitle, usingGps],
  );

  return (
    <LocationScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <LocationSelectorHeader
          onBack={() => exitScreen(router, { fallbackHref: returnHref })}
        />

        <LocationSearchBar
          value={query}
          onChangeText={setQuery}
          loading={geocodeLoading}
        />

        {loadingPlaces ? (
          <LocationListSkeleton />
        ) : (
          <FlatList
            style={styles.list}
            data={displayResults}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={ListHeader}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              listContentStyle(),
              displayResults.length === 0 && styles.listEmptyGrow,
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              query.trim().length >= 2 && !geocodeLoading ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>No results found</Text>
                  <Text style={styles.emptyHint}>
                    Try searching Kolkata, Delhi, Mumbai, or your area name.
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </LocationScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { flex: 1 },
  listHeader: {
    marginTop: 4,
    width: "100%",
    alignSelf: "stretch",
  },
  listEmptyGrow: { flexGrow: 1 },
  separator: { height: 0 },
  emptyWrap: {
    marginHorizontal: LOCATION_SCREEN_GUTTER,
    marginTop: spacing.lg,
    padding: spacing.xl,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "700",
    color: "#0D1B2A",
  },
  emptyHint: {
    marginTop: 8,
    textAlign: "center",
    color: MUTED,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
});
