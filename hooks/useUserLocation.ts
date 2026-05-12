import * as Location from "expo-location";
import type { PermissionStatus } from "expo-location";
import { useEffect, useMemo } from "react";

import { useUserLocationStore } from "@/lib/stores/userLocationStore";
import type { UserCoords } from "@/services/boutique.service";

export type UserLocationState = {
  coords: UserCoords | null;
  error: string | null;
  permission: PermissionStatus | null;
  loading: boolean;
  /** Granted but no GPS fix after attempts (show distance-unavailable copy only in this case). */
  gpsFailed: boolean;
};

/**
 * Subscribes to global user location (single init + watch). Call with `enabled` from any screen.
 */
export function useUserLocation(enabled = true): UserLocationState {
  const coords = useUserLocationStore((s) => s.coords);
  const loading = useUserLocationStore((s) => s.loading);
  const error = useUserLocationStore((s) => s.error);
  const permission = useUserLocationStore((s) => s.permission);

  useEffect(() => {
    if (!enabled) return;
    void useUserLocationStore.getState().init();
  }, [enabled]);

  const gpsFailed = useMemo(
    () =>
      permission === Location.PermissionStatus.GRANTED &&
      !loading &&
      coords == null &&
      Boolean(error),
    [permission, loading, coords, error],
  );

  return { coords, error, permission, loading, gpsFailed };
}
