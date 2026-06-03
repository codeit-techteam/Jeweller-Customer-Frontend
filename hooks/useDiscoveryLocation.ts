import * as Location from "expo-location";
import { useEffect, useMemo } from "react";

import { useDiscoveryLocationStore } from "@/lib/stores/discoveryLocationStore";
import { useUserLocationStore } from "@/lib/stores/userLocationStore";
import type { UserCoords } from "@/services/boutique.service";

export type DiscoveryLocationHook = {
  displayLabel: string;
  effectiveCoords: UserCoords | null;
  labelLoading: boolean;
  hydrated: boolean;
  source: "gps" | "manual" | null;
  permission: Location.PermissionStatus | null;
  gpsLoading: boolean;
  useCurrentLocation: () => Promise<boolean>;
  setManual: (label: string, lat: number, lng: number) => Promise<void>;
};

export function useDiscoveryLocation(): DiscoveryLocationHook {
  const location = useDiscoveryLocationStore((s) => s.location);
  const labelLoading = useDiscoveryLocationStore((s) => s.labelLoading);
  const hydrated = useDiscoveryLocationStore((s) => s.hydrated);
  const applyGpsCoords = useDiscoveryLocationStore((s) => s.applyGpsCoords);
  const setManualStore = useDiscoveryLocationStore((s) => s.setManual);
  const useCurrentLocationStore = useDiscoveryLocationStore(
    (s) => s.useCurrentLocation,
  );
  const gpsCoords = useUserLocationStore((s) => s.coords);
  const gpsLoading = useUserLocationStore((s) => s.loading);
  const permission = useUserLocationStore((s) => s.permission);

  useEffect(() => {
    if (!hydrated) return;
    if (location?.source === "manual") return;
    if (!gpsCoords) return;
    void applyGpsCoords(gpsCoords);
  }, [hydrated, location?.source, gpsCoords?.lat, gpsCoords?.lng, applyGpsCoords]);

  const effectiveCoords = useMemo(() => {
    if (location) return { lat: location.lat, lng: location.lng };
    return gpsCoords;
  }, [location, gpsCoords]);

  const displayLabel = useMemo(() => {
    if (labelLoading && !location?.label) return "Locating…";
    if (location?.label) return location.label;
    if (permission === Location.PermissionStatus.DENIED) {
      return "Choose your location";
    }
    return "Locating…";
  }, [location?.label, labelLoading, permission]);

  return {
    displayLabel,
    effectiveCoords,
    labelLoading,
    hydrated,
    source: location?.source ?? null,
    permission,
    gpsLoading,
    useCurrentLocation: useCurrentLocationStore,
    setManual: async (label, lat, lng) => {
      await setManualStore({ label, lat, lng, source: "manual" });
    },
  };
}
