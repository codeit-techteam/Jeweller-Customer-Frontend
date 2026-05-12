import * as Location from "expo-location";
import type { LocationOptions } from "expo-location";
import { Platform } from "react-native";

export type CurrentLocationResult = {
  latitude: number;
  longitude: number;
} | null;

const currentOptions = (accuracy: Location.Accuracy): LocationOptions => ({
  accuracy,
  mayShowUserSettingsDialog: true,
});

/**
 * Best-effort fix after foreground permission is already GRANTED.
 * Uses Android high-accuracy mode when available, then last-known, then a low-power GPS read.
 */
export async function readCurrentPositionWithFallbacks(): Promise<{
  lat: number;
  lng: number;
} | null> {
  if (Platform.OS === "android") {
    await Location.enableNetworkProviderAsync().catch(() => {
      /* Play services / settings may block; still try GPS */
    });
  }

  const tryBalanced = async () => {
    const location = await Location.getCurrentPositionAsync(
      currentOptions(Location.Accuracy.Balanced),
    );
    return { lat: location.coords.latitude, lng: location.coords.longitude };
  };

  try {
    const first = await tryBalanced();
    if (__DEV__) {
      console.log("[location.service] Balanced fix:", first);
    }
    return first;
  } catch (e) {
    if (__DEV__) {
      console.log("[location.service] Balanced fix failed, trying fallbacks:", e);
    }
  }

  const last = await Location.getLastKnownPositionAsync({
    maxAge: 1_800_000,
    requiredAccuracy: 5000,
  }).catch(() => null);
  if (last) {
    const coords = { lat: last.coords.latitude, lng: last.coords.longitude };
    if (__DEV__) {
      console.log("[location.service] Using last known position:", coords);
    }
    return coords;
  }

  try {
    const location = await Location.getCurrentPositionAsync(
      currentOptions(Location.Accuracy.Low),
    );
    const coords = { lat: location.coords.latitude, lng: location.coords.longitude };
    if (__DEV__) {
      console.log("[location.service] Low accuracy fix:", coords);
    }
    return coords;
  } catch (e) {
    if (__DEV__) {
      console.log("[location.service] Low accuracy fix failed:", e);
    }
    return null;
  }
}

/**
 * One-shot foreground fix (permission + current position).
 * Prefer `userLocationStore` for app-wide subscription + watch updates.
 */
export async function getCurrentLocation(): Promise<CurrentLocationResult> {
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    let status = existing.status;
    if (status === Location.PermissionStatus.UNDETERMINED) {
      const asked = await Location.requestForegroundPermissionsAsync();
      status = asked.status;
    }
    if (status !== Location.PermissionStatus.GRANTED) {
      if (__DEV__) {
        console.log("[location.service] Foreground location permission not granted:", status);
      }
      return null;
    }
    const coords = await readCurrentPositionWithFallbacks();
    if (!coords) return null;
    if (__DEV__) {
      console.log("[location.service] Current position:", coords);
    }
    return { latitude: coords.lat, longitude: coords.lng };
  } catch (error) {
    if (__DEV__) {
      console.log("[location.service] getCurrentLocation error:", error);
    }
    return null;
  }
}
