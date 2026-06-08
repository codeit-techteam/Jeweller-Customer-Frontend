import * as Location from "expo-location";

import { parseCoord } from "@/utils/calculateDistance";

export function boutiqueHasCoordinates(item: {
  latitude?: number | null;
  longitude?: number | null;
}): boolean {
  const la = parseCoord(item.latitude);
  const lo = parseCoord(item.longitude);
  return la != null && lo != null;
}

/**
 * Single copy for cards/list rows: loading vs denied vs missing boutique coords vs km.
 */
export function formatBoutiqueDistanceLine(args: {
  distanceKm: number | null | undefined;
  locationLoading: boolean;
  hasBoutiqueCoords: boolean;
  permission: Location.PermissionStatus | null;
  /** Foreground permission granted but we could not obtain a fix (timeout, mode, etc.). */
  userLocationGpsFailed?: boolean;
}): string {
  const denied = args.permission === Location.PermissionStatus.DENIED;

  if (!args.hasBoutiqueCoords) {
    return "";
  }
  if (denied) {
    return "Enable location for distance";
  }
  if (args.distanceKm != null && Number.isFinite(args.distanceKm)) {
    return `${args.distanceKm.toFixed(1)} km away`;
  }
  if (args.userLocationGpsFailed) {
    return "Distance unavailable";
  }
  return "Calculating distance...";
}

/**
 * Distance line for featured boutique cards (below location).
 * Under 1 km → meters; 1–50 km → km; over 50 km → hidden.
 */
export function formatFeaturedCardDistanceLine(
  distanceKm: number | null | undefined,
): string {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return "";
  if (distanceKm > 50) return "";
  if (distanceKm < 1) {
    const meters = Math.max(1, Math.round(distanceKm * 1000));
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}
