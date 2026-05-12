import * as Location from "expo-location";
import { Platform } from "react-native";
import { create } from "zustand";

import { readCurrentPositionWithFallbacks } from "@/services/location.service";
import type { UserCoords } from "@/services/boutique.service";

export type UserLocationSlice = {
  coords: UserCoords | null;
  permission: Location.PermissionStatus | null;
  loading: boolean;
  error: string | null;
  /** Starts permission + first fix + watch; safe to call multiple times. */
  init: () => Promise<void>;
  refresh: () => Promise<void>;
};

/** Permission granted but no fix after loading finished (timeouts / services off). */
export function selectDistanceLineGpsFailed(s: UserLocationSlice): boolean {
  return (
    s.permission === Location.PermissionStatus.GRANTED &&
    !s.loading &&
    s.coords == null &&
    Boolean(s.error)
  );
}

let watchSub: Location.LocationSubscription | null = null;
let initInFlight: Promise<void> | null = null;

async function startWatch(set: (p: Partial<UserLocationSlice>) => void) {
  watchSub?.remove();
  watchSub = null;
  try {
    if (Platform.OS === "android") {
      await Location.enableNetworkProviderAsync().catch(() => {});
    }
    watchSub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50,
        timeInterval: 20_000,
        mayShowUserSettingsDialog: true,
      },
      (loc) => {
        set({
          coords: { lat: loc.coords.latitude, lng: loc.coords.longitude },
        });
        if (__DEV__) {
          console.log("[userLocationStore] watch update:", {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        }
      },
    );
  } catch (e) {
    if (__DEV__) {
      console.log("[userLocationStore] watchPositionAsync failed:", e);
    }
  }
}

export const useUserLocationStore = create<UserLocationSlice>((set, get) => ({
  coords: null,
  permission: null,
  loading: true,
  error: null,

  refresh: async () => {
    const { permission } = get();
    if (permission !== Location.PermissionStatus.GRANTED) {
      await get().init();
      return;
    }
    try {
      const coords = await readCurrentPositionWithFallbacks();
      if (coords) {
        set({ coords });
      } else {
        set({
          error: "Could not read current location",
        });
      }
      if (__DEV__ && coords) {
        console.log("[userLocationStore] refresh:", coords);
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Location unavailable",
      });
    }
  },

  init: async () => {
    if (initInFlight) {
      await initInFlight;
      return;
    }
    initInFlight = (async () => {
      set({ loading: true, error: null });
      try {
        const existing = await Location.getForegroundPermissionsAsync();
        let status = existing.status;
        if (status === Location.PermissionStatus.UNDETERMINED) {
          const asked = await Location.requestForegroundPermissionsAsync();
          status = asked.status;
        }
        set({ permission: status });
        if (status !== Location.PermissionStatus.GRANTED) {
          set({ coords: null, error: "Location permission not granted" });
          if (__DEV__) {
            console.log("[userLocationStore] permission:", status);
          }
          return;
        }
        const coords = await readCurrentPositionWithFallbacks();
        if (!coords) {
          set({
            coords: null,
            error: "Could not read current location",
          });
          if (__DEV__) {
            console.log("[userLocationStore] initial fix failed after fallbacks");
          }
          return;
        }
        set({ coords });
        if (__DEV__) {
          console.log("[userLocationStore] initial fix:", coords);
        }
        await startWatch(set);
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : "Location unavailable",
          coords: null,
        });
        if (__DEV__) {
          console.log("[userLocationStore] init error:", e);
        }
      } finally {
        set({ loading: false });
        initInFlight = null;
      }
    })();
    await initInFlight;
  },
}));
