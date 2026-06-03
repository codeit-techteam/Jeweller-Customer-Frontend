import * as Location from "expo-location";

/** Human-readable label e.g. "Karol Bagh, Delhi" from GPS coordinates. */
export async function reverseGeocodeDisplayLabel(
  lat: number,
  lng: number,
): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    const r = results[0];
    if (!r) return "Current location";

    const area =
      pickPart(r.district) ??
      pickPart(r.subregion) ??
      pickPart(r.street) ??
      pickPart(r.name);
    const city = pickPart(r.city) ?? pickPart(r.region);

    if (area && city && !samePlace(area, city)) {
      return `${area}, ${city}`;
    }
    if (city) return city;
    if (area) return area;
    const joined = [r.city, r.region, r.country].filter(Boolean).join(", ");
    return joined.trim() || "Current location";
  } catch {
    return "Current location";
  }
}

function pickPart(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

function samePlace(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
