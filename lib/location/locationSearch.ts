import * as Location from "expo-location";

import type { BoutiqueApiListRow } from "@/lib/boutiques/boutiqueUi";
import {
  formatBoutiqueLocation,
  formatBoutiqueShortLocation,
} from "@/lib/utils/formatBoutiqueLocation";
import { parseCoord } from "@/utils/calculateDistance";

export type LocationPlace = {
  id: string;
  label: string;
  subtitle?: string;
  lat: number;
  lng: number;
  needsGeocode?: boolean;
  kind: "metro" | "area" | "geocode";
};

const STATE_CODES = new Set([
  "mh",
  "wb",
  "dl",
  "hr",
  "ka",
  "tn",
  "up",
  "rj",
  "gj",
  "pb",
  "mp",
  "ap",
  "ts",
  "kl",
  "or",
  "as",
  "br",
  "jh",
  "ct",
  "uk",
  "ga",
  "hp",
  "jk",
  "la",
  "mn",
  "ml",
  "mz",
  "nl",
  "sk",
  "tr",
]);

const STATE_NAMES = new Set([
  "west bengal",
  "maharashtra",
  "haryana",
  "karnataka",
  "tamil nadu",
  "uttar pradesh",
  "rajasthan",
  "gujarat",
  "punjab",
  "madhya pradesh",
  "andhra pradesh",
  "telangana",
  "kerala",
  "odisha",
  "assam",
  "bihar",
  "jharkhand",
  "chhattisgarh",
  "uttarakhand",
]);

/** Metro labels detected inside boutique address text (data-driven list). */
const METRO_DETECTORS: { label: string; keys: string[] }[] = [
  { label: "Kolkata", keys: ["kolkata", "salt lake", "new town", "howrah"] },
  {
    label: "Delhi",
    keys: [
      "delhi",
      "new delhi",
      "connaught",
      "karol bagh",
      "south extension",
      "greater kailash",
    ],
  },
  { label: "Mumbai", keys: ["mumbai", "bandra", "andheri", "zaveri bazaar"] },
  { label: "Gurgaon", keys: ["gurgaon", "gurugram"] },
  { label: "Bangalore", keys: ["bangalore", "bengaluru"] },
  { label: "Hyderabad", keys: ["hyderabad"] },
  { label: "Jaipur", keys: ["jaipur"] },
  { label: "Lucknow", keys: ["lucknow"] },
  { label: "Chennai", keys: ["chennai"] },
  { label: "Pune", keys: ["pune"] },
];

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function placeKey(label: string): string {
  return norm(label);
}

export function isPoorPlaceLabel(label: string): boolean {
  const n = norm(label);
  if (!n || n.length < 3) return true;
  if (STATE_CODES.has(n)) return true;
  if (STATE_NAMES.has(n)) return true;
  if (/^\d{5,6}$/.test(n)) return true;
  if (/shop\s*no|upper\s*ground|mehrauli|arcade\s*mall/i.test(label)) {
    return true;
  }
  if (label.length > 48) return true;
  return false;
}

function detectMetrosInText(...parts: Array<string | null | undefined>): string[] {
  const hay = norm(parts.filter(Boolean).join(" "));
  const found: string[] = [];
  for (const metro of METRO_DETECTORS) {
    if (metro.keys.some((k) => hay.includes(k))) {
      found.push(metro.label);
    }
  }
  return found;
}

function compactAreaLabel(full: string): string {
  const parts = full
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return full;
  if (parts.length === 1) return parts[0];
  const city = parts[parts.length - 1];
  const area = parts[0];
  if (isPoorPlaceLabel(city)) {
    return area;
  }
  if (norm(area) === norm(city)) return city;
  return `${area}, ${city}`;
}

export async function resolvePlaceCoordinates(
  place: LocationPlace,
): Promise<{ lat: number; lng: number } | null> {
  if (
    !place.needsGeocode &&
    Number.isFinite(place.lat) &&
    Number.isFinite(place.lng) &&
    !(place.lat === 0 && place.lng === 0)
  ) {
    return { lat: place.lat, lng: place.lng };
  }
  const hits = await geocodeSearchPlaces(place.label);
  const first = hits[0];
  if (!first) return null;
  return { lat: first.lat, lng: first.lng };
}

/** Popular cities that have boutiques in the database. */
export async function buildMetroPlacesFromBoutiques(
  rows: BoutiqueApiListRow[],
): Promise<LocationPlace[]> {
  const metroNames = new Set<string>();
  for (const row of rows) {
    for (const name of detectMetrosInText(
      row.location,
      row.address,
      row.full_address,
    )) {
      metroNames.add(name);
    }
  }

  const out: LocationPlace[] = [];
  for (const name of [...metroNames].sort()) {
    const geo = await geocodeSearchPlaces(name);
    const hit = geo[0];
    if (!hit) continue;
    out.push({
      id: `metro-${placeKey(name)}`,
      label: name,
      subtitle: "Explore boutiques in this city",
      lat: hit.lat,
      lng: hit.lng,
      kind: "metro",
    });
  }
  return out;
}

/** Boutique neighbourhoods (short labels only). */
export function buildAreaPlacesFromBoutiques(
  rows: BoutiqueApiListRow[],
): LocationPlace[] {
  const seen = new Set<string>();
  const out: LocationPlace[] = [];

  for (const row of rows) {
    const full = formatBoutiqueLocation({
      location: row.location ?? null,
      address: row.address ?? null,
      full_address: row.full_address ?? null,
    });
    if (!full || full.toLowerCase() === "location unavailable") continue;

    const label = compactAreaLabel(full);
    if (isPoorPlaceLabel(label)) continue;

    const key = placeKey(label);
    if (seen.has(key)) continue;
    seen.add(key);

    const lat = parseCoord(row.latitude);
    const lng = parseCoord(row.longitude);
    const short = formatBoutiqueShortLocation({
      location: row.location ?? null,
      address: row.address ?? null,
      full_address: row.full_address ?? null,
    });

    out.push({
      id: `area-${row.id}`,
      label,
      subtitle: short !== label ? short : "Boutique area",
      lat: lat ?? 0,
      lng: lng ?? 0,
      needsGeocode: lat == null || lng == null,
      kind: "area",
    });
  }

  return out.sort((a, b) => a.label.localeCompare(b.label));
}

export async function buildLocationSearchIndex(
  rows: BoutiqueApiListRow[],
): Promise<{ metros: LocationPlace[]; areas: LocationPlace[] }> {
  const [metros, areas] = await Promise.all([
    buildMetroPlacesFromBoutiques(rows),
    Promise.resolve(buildAreaPlacesFromBoutiques(rows)),
  ]);
  return { metros, areas };
}

export function filterPlaces(places: LocationPlace[], query: string): LocationPlace[] {
  const q = norm(query);
  if (!q) return places;

  const scored = places
    .map((p) => {
      const hay = norm(`${p.label} ${p.subtitle ?? ""}`);
      let score = 0;
      if (hay.startsWith(q)) score += 100;
      else if (hay.includes(q)) score += 50;
      for (const t of q.split(/\s+/).filter(Boolean)) {
        if (hay.includes(t)) score += 12;
      }
      if (p.kind === "metro") score += 8;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.label.localeCompare(b.p.label));

  return scored.map((x) => x.p).slice(0, 20);
}

export async function geocodeSearchPlaces(query: string): Promise<LocationPlace[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const results = await Location.geocodeAsync(`${q}, India`);
    return results
      .slice(0, 8)
      .map((r, i) => {
        const city = r.city ?? r.region ?? "";
        const area = r.district ?? r.subregion ?? r.street ?? "";
        const label =
          area && city && !samePlace(area, city)
            ? `${area}, ${city}`
            : city || area || q;
        if (isPoorPlaceLabel(label)) return null;
        return {
          id: `geocode-${i}-${placeKey(label)}`,
          label,
          subtitle: [r.region, r.country].filter(Boolean).join(", ") || "India",
          lat: r.latitude,
          lng: r.longitude,
          kind: "geocode" as const,
        };
      })
      .filter((p): p is LocationPlace => p != null);
  } catch {
    return [];
  }
}

function samePlace(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

export function extractCityToken(displayLabel: string): string | null {
  const parts = displayLabel
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  if (isPoorPlaceLabel(last) && parts.length > 1) {
    return parts[parts.length - 2].toLowerCase();
  }
  return last.toLowerCase();
}

export function boutiqueMatchesCityToken(
  boutiqueLocation: string,
  cityToken: string | null,
): boolean {
  if (!cityToken) return true;
  return norm(boutiqueLocation).includes(cityToken);
}
