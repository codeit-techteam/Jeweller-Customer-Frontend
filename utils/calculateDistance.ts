/**
 * Haversine distance between two WGS84 points (km), rounded to 0.1 km.
 * Use for boutique ↔ user distance everywhere.
 */

const R_KM = 6371;

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/** Parse Supabase / JSON lat or lng which may be string or number. */
export function parseCoord(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R_KM * c * 10) / 10;
}
