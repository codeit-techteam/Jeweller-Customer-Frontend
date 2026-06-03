import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { create } from "zustand";

import { reverseGeocodeDisplayLabel } from "@/services/reverseGeocode.service";
import type { UserCoords } from "@/services/boutique.service";
import { useUserLocationStore } from "@/lib/stores/userLocationStore";

const STORAGE_KEY = "discoveryLocationV1";
const PROMPT_SEEN_KEY = "discoveryLocationPromptSeen";

export type DiscoveryLocationSource = "gps" | "manual";

export type DiscoveryLocation = {
  label: string;
  lat: number;
  lng: number;
  source: DiscoveryLocationSource;
};

type DiscoveryLocationState = {
  location: DiscoveryLocation | null;
  labelLoading: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setManual: (loc: DiscoveryLocation) => Promise<void>;
  applyGpsCoords: (coords: UserCoords) => Promise<void>;
  useCurrentLocation: () => Promise<boolean>;
  getEffectiveCoords: () => UserCoords | null;
  markPromptSeen: () => Promise<void>;
  hasSeenPrompt: () => Promise<boolean>;
};

async function persistLocation(loc: DiscoveryLocation | null) {
  if (!loc) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
}

export const useDiscoveryLocationStore = create<DiscoveryLocationState>(
  (set, get) => ({
    location: null,
    labelLoading: false,
    hydrated: false,

    hydrate: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DiscoveryLocation;
          if (
            parsed?.label &&
            Number.isFinite(parsed.lat) &&
            Number.isFinite(parsed.lng)
          ) {
            set({ location: parsed });
          }
        }
      } catch {
        /* ignore corrupt storage */
      } finally {
        set({ hydrated: true });
      }
    },

    setManual: async (loc) => {
      set({ location: loc });
      await persistLocation(loc);
    },

    applyGpsCoords: async (coords) => {
      const { location } = get();
      if (location?.source === "manual") return;

      set({ labelLoading: true });
      try {
        const label = await reverseGeocodeDisplayLabel(coords.lat, coords.lng);
        const next: DiscoveryLocation = {
          label,
          lat: coords.lat,
          lng: coords.lng,
          source: "gps",
        };
        set({ location: next });
        await persistLocation(next);
      } finally {
        set({ labelLoading: false });
      }
    },

    useCurrentLocation: async () => {
      const store = useUserLocationStore.getState();
      let { permission } = store;
      if (permission !== Location.PermissionStatus.GRANTED) {
        await store.init();
        permission = useUserLocationStore.getState().permission;
      }
      if (permission !== Location.PermissionStatus.GRANTED) {
        return false;
      }
      set({ labelLoading: true });
      try {
        await store.refresh();
        const coords = useUserLocationStore.getState().coords;
        if (!coords) return false;
        const label = await reverseGeocodeDisplayLabel(coords.lat, coords.lng);
        const next: DiscoveryLocation = {
          label,
          lat: coords.lat,
          lng: coords.lng,
          source: "gps",
        };
        set({ location: next });
        await persistLocation(next);
        return true;
      } finally {
        set({ labelLoading: false });
      }
    },

    getEffectiveCoords: () => {
      const { location } = get();
      if (location) return { lat: location.lat, lng: location.lng };
      return useUserLocationStore.getState().coords;
    },

    markPromptSeen: async () => {
      await AsyncStorage.setItem(PROMPT_SEEN_KEY, "true");
    },

    hasSeenPrompt: async () => {
      const v = await AsyncStorage.getItem(PROMPT_SEEN_KEY);
      return v === "true";
    },
  }),
);
