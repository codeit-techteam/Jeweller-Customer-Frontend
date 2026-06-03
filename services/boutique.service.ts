/**
 * Central boutique data layer — all screens should use these helpers + hooks
 * so Admin/API remains the single source of truth.
 */

import {
  formatTimeRange,
  getBoutiqueHoursStatus,
  haversineDistanceKm,
  mapBoutiqueDetailToProfileViewModel,
  mapBoutiqueForUi,
  type BoutiqueApiListRow,
  type BoutiqueProfileViewModel,
  type BoutiqueUiListItem,
} from "@/lib/boutiques/boutiqueUi";
import { getBoutiqueById, getBoutiques } from "@/services/api";
import {
  calculateDistanceKm as geoDistanceKm,
  parseCoord,
} from "@/utils/calculateDistance";

export function applyLiveHoursToProfile(p: BoutiqueProfileViewModel): BoutiqueProfileViewModel {
  const s = getBoutiqueHoursStatus(p.openingTime, p.closingTime, p.workingDays ?? []);
  if (p.openNow === s.openNow && p.statusSubLabel === s.statusSubLabel) return p;
  return { ...p, openNow: s.openNow, statusSubLabel: s.statusSubLabel };
}

export type UserCoords = { lat: number; lng: number };

export type BoutiqueStatusUi = {
  isOpen: boolean;
  label: string;
  secondaryLabel: string;
  /** Hex for status pill / accent */
  color: string;
};

/**
 * Fetches boutiques without baking in distance (GPS may arrive after first paint).
 * Use `applyUserLocationToBoutiqueList` with the global user coords for card distances.
 */
export async function fetchBoutiques(_userLocation?: UserCoords | null): Promise<BoutiqueUiListItem[]> {
  const rows = await getBoutiques();
  if (__DEV__) {
    for (const row of rows.slice(0, 5)) {
      const cover =
        (row as BoutiqueApiListRow).cover_image_url ??
        (row as BoutiqueApiListRow).cover_image ??
        (row as BoutiqueApiListRow).image;
      console.log("[fetchBoutiques] row", {
        id: row.id,
        name: row.name,
        cover,
      });
    }
  }
  return rows.map((row, index) =>
    mapBoutiqueForUi(row as BoutiqueApiListRow, index, { userLocation: null }),
  );
}

export function applyUserLocationToBoutiqueList(
  items: BoutiqueUiListItem[],
  userLocation: UserCoords | null,
): BoutiqueUiListItem[] {
  if (!userLocation) {
    return items.map((item) => ({ ...item, distanceKm: null }));
  }
  return items.map((item) => {
    const la = parseCoord(item.latitude);
    const lo = parseCoord(item.longitude);
    if (la == null || lo == null) {
      if (__DEV__) {
        console.log("[applyUserLocationToBoutiqueList] unparsed boutique coords", {
          id: item.id,
          latitude: item.latitude,
          longitude: item.longitude,
        });
      }
      return { ...item, distanceKm: null };
    }
    return {
      ...item,
      distanceKm: geoDistanceKm(userLocation.lat, userLocation.lng, la, lo),
    };
  });
}

export async function fetchBoutiqueById(id: string) {
  return getBoutiqueById(id);
}

export function formatBoutiqueTimeRange(
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
): string {
  return formatTimeRange(openingTime, closingTime).trim();
}

/** Alias for `formatBoutiqueTimeRange`. */
export const formatTiming = formatBoutiqueTimeRange;

export function calculateBoutiqueStatus(
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
  workingDays: string[] | null | undefined,
): BoutiqueStatusUi {
  const s = getBoutiqueHoursStatus(openingTime, closingTime, workingDays ?? []);
  return {
    isOpen: s.openNow,
    label: s.openNow ? "Open" : "Closed",
    secondaryLabel: s.statusSubLabel,
    color: s.openNow ? "#22c55e" : "#ef4444",
  };
}

export function calculateDistanceKm(
  user: UserCoords,
  boutiqueLat: number,
  boutiqueLng: number,
): number {
  return haversineDistanceKm(user.lat, user.lng, boutiqueLat, boutiqueLng);
}

export function mapBoutiqueForUI(
  row: BoutiqueApiListRow,
  index: number,
  userLocation?: UserCoords | null,
): BoutiqueUiListItem {
  return mapBoutiqueForUi(row, index, { userLocation: userLocation ?? null });
}

export function mapBoutiqueDetailForProfile(
  row: Parameters<typeof mapBoutiqueDetailToProfileViewModel>[0],
): BoutiqueProfileViewModel {
  return mapBoutiqueDetailToProfileViewModel(row);
}

export { haversineDistanceKm, mapBoutiqueDetailToProfileViewModel, mapBoutiqueForUi };
