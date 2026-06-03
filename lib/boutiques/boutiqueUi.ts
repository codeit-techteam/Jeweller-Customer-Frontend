/**
 * Single source of truth for boutique → UI mapping (listing, profile, home cards).
 * Aligns with API / DB fields: image (cover), logo_url, gallery_images, reviews_count, etc.
 */

import { Image } from "react-native";

import {
  boutiqueLocationFieldsFromRow,
  formatBoutiqueLocation,
  formatBoutiqueShortLocation,
} from "@/lib/utils/formatBoutiqueLocation";
import { calculateDistanceKm, parseCoord } from "@/utils/calculateDistance";

/** Raw boutique row from GET /api/boutiques or nested in product. */
export type BoutiqueApiListRow = {
  id: string;
  name: string;
  image?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
  /** Alias for logo_url when API adds explicit column. */
  logo_image?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  location?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  rating?: number | null;
  reviews_count?: number | null;
  description?: string | null;
  verified?: boolean;
  is_verified?: boolean;
  featured?: boolean;
  status?: string | null;
  gallery_images?: string[] | null;
  banner_images?: string[] | null;
  opening_time?: string | null;
  closing_time?: string | null;
  working_days?: string[] | null;
  opening_hours?: string | null;
  full_address?: string | null;
  latest_collection_name?: string | null;
  coordinates?: { lat: number; lng: number } | string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  lon?: number | null;
  phone?: string | null;
  phone_number?: string | null;
  whatsapp?: string | null;
  whatsapp_number?: string | null;
  created_at?: string | null;
};

export type BoutiqueProductItemUi = {
  id: string;
  name: string;
  price: number;
  tag: string;
  categoryLabel: string;
  imageTint: string;
  imageUri?: string;
  collection: string;
};

export type BoutiqueProfileViewModel = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  location: string;
  shortLocation: string;
  description: string;
  trustedTag: string;
  banners: { tint: string; uri?: string }[];
  openNow: boolean;
  hoursLabel: string;
  logoTint: string;
  logoCaption: string;
  logoSubtitle?: string;
  logoUrl?: string | null;
  products: BoutiqueProductItemUi[];
  phone: string;
  whatsapp: string;
  mapsQuery: string;
  contactAddress: string;
  collections: { key: string; label: string }[];
  openingTime?: string | null;
  closingTime?: string | null;
  workingDays?: string[];
  statusSubLabel?: string;
  coordinates?: { lat: number; lng: number } | null;
};

export type BoutiqueUiListItem = {
  id: string;
  name: string;
  /** Cover image URL (same source as profile hero fallback). */
  image: string | null;
  logoImage: string | null;
  location: string;
  rating: number;
  /** Haversine km from user when both positions known; otherwise null. */
  distanceKm: number | null;
  reviewsCount: number;
  tag: string;
  tags: string[];
  /** Short status for cards: "Open" | "Closed" */
  status: string;
  statusSubLabel: string;
  openNow: boolean;
  hoursLabel: string;
  description: string;
  latestCollectionLabel: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
  workingDays?: string[];
  phone?: string | null;
  whatsapp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt?: string | null;
};

const COLLECTION_KEY_ALIASES: Record<string, string> = {
  earings: "earrings",
  earing: "earrings",
  bracelet: "bracelets",
  ring: "rings",
  necklace: "necklaces",
};

export function normalizeCollectionKey(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function normalizeFilterKey(value: string | null | undefined): string {
  const k = normalizeCollectionKey(value);
  return COLLECTION_KEY_ALIASES[k] ?? k;
}

export function fixCollectionLabelText(name: string): string {
  return name.replace(/\bEarings\b/gi, "Earrings");
}

export function formatTime12Hour(raw: string | null | undefined): string {
  if (!raw) return "";
  const [h, m] = raw.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return raw;
  const suffix = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
): string {
  if (!openingTime || !closingTime) return "";
  return `${formatTime12Hour(openingTime)} - ${formatTime12Hour(closingTime)}`;
}

export function normalizeWorkingDays(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((d): d is string => typeof d === "string");
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((d): d is string => typeof d === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function getBoutiqueHoursStatus(
  openingTime: string | null | undefined,
  closingTime: string | null | undefined,
  workingDays: string[] | null | undefined,
): { openNow: boolean; statusSubLabel: string } {
  if (!openingTime || !closingTime) return { openNow: false, statusSubLabel: "" };
  const daySet = new Set((workingDays ?? []).map((day) => day.toLowerCase()));
  const now = new Date();
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  })
    .format(now)
    .toLowerCase();
  if (daySet.size && !daySet.has(day)) {
    return {
      openNow: false,
      statusSubLabel: `Opens at ${formatTime12Hour(openingTime)}`,
    };
  }
  const [openHour, openMinute] = openingTime.split(":").map(Number);
  const [closeHour, closeMinute] = closingTime.split(":").map(Number);
  if (
    !Number.isFinite(openHour) ||
    !Number.isFinite(openMinute) ||
    !Number.isFinite(closeHour) ||
    !Number.isFinite(closeMinute)
  ) {
    return { openNow: false, statusSubLabel: "" };
  }
  const currentParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const currentHour = Number(
    currentParts.find((part) => part.type === "hour")?.value ?? "0",
  );
  const currentMinute = Number(
    currentParts.find((part) => part.type === "minute")?.value ?? "0",
  );
  const currentTotal = currentHour * 60 + currentMinute;
  const openTotal = openHour * 60 + openMinute;
  const closeTotal = closeHour * 60 + closeMinute;
  const openNow =
    closeTotal >= openTotal
      ? currentTotal >= openTotal && currentTotal <= closeTotal
      : currentTotal >= openTotal || currentTotal <= closeTotal;
  return {
    openNow,
    statusSubLabel: openNow
      ? `Closes at ${formatTime12Hour(closingTime)}`
      : `Opens at ${formatTime12Hour(openingTime)}`,
  };
}

function httpUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const s = item != null ? String(item).trim() : "";
    if (!s.startsWith("http")) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export function resolveCoverImage(row: BoutiqueApiListRow): string | null {
  const gallery = httpUrls(row.gallery_images);
  const c =
    (typeof row.cover_image_url === "string" && row.cover_image_url.trim()) ||
    (typeof row.cover_image === "string" && row.cover_image.trim()) ||
    (typeof row.image === "string" && row.image.trim()) ||
    gallery[0] ||
    null;
  const url = c && c.startsWith("http") ? c.trim() : null;
  if (__DEV__ && url) {
    console.log("[boutiqueUi] cover", { id: row.id, name: row.name, url });
  }
  return url;
}

export function resolveLogoImage(row: BoutiqueApiListRow): string | null {
  const l =
    (typeof row.logo_image === "string" && row.logo_image.trim()) ||
    (typeof row.logo_url === "string" && row.logo_url.trim()) ||
    (typeof row.logo === "string" && row.logo.trim()) ||
    null;
  return l && l.startsWith("http") ? l : null;
}

/** Gallery slides: prefer `gallery_images`; if empty, use cover only. */
export function buildGalleryBannerSlides(row: {
  gallery_images?: string[] | null;
  banner_images?: string[] | null;
  image?: string | null;
  cover_image?: string | null;
  cover_image_url?: string | null;
}): { tint: string; uri?: string }[] {
  const fromGallery = httpUrls(row.gallery_images);
  const fromBanners = httpUrls(row.banner_images);
  const urls = fromGallery.length ? fromGallery : fromBanners;
  const cover = resolveCoverImage(row as BoutiqueApiListRow);
  const slides =
    urls.length > 0
      ? urls
      : cover
        ? [cover]
        : [];
  if (!slides.length) {
    return [{ tint: "#3d3428", uri: undefined }];
  }
  return slides.map((uri, index) => ({
    tint: index % 2 ? "#c4b28f" : "#3d3428",
    uri,
  }));
}

export function preloadBoutiqueBannerUris(uris: (string | undefined)[]) {
  for (const u of uris) {
    if (u && u.startsWith("http")) {
      void Image.prefetch(u);
    }
  }
}

function titleCaseFromSlug(key: string): string {
  return fixCollectionLabelText(
    key
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
  );
}

export function mapProductsForProfile(
  products: Array<{
    id: string;
    name: string;
    price: number;
    image?: string | null;
    thumbnail?: string | null;
    primary_image?: string | null;
    category?: { id: string; name: string } | null;
    collection_name?: string | null;
    collection?: string | null;
    boutique_collection?: { slug?: string; name?: string } | null;
  }>,
): BoutiqueProductItemUi[] {
  return products.map((p) => {
    const ext = p as { category_name?: string };
    const categoryLabel =
      (p.category?.name ?? "").trim() ||
      (typeof ext.category_name === "string" ? ext.category_name.trim() : "") ||
      "Jewellery";
    const filterSource =
      p.collection_name ??
      (typeof p.collection === "string" ? p.collection : "") ??
      p.boutique_collection?.slug ??
      p.boutique_collection?.name ??
      p.category?.name ??
      "";
    const collection = normalizeFilterKey(filterSource) || "other";
    const img = p as { thumbnail?: string | null; primary_image?: string | null };
    const thumb =
      (typeof p.image === "string" && p.image.trim().startsWith("http") && p.image.trim()) ||
      (typeof img.thumbnail === "string" &&
        img.thumbnail.trim().startsWith("http") &&
        img.thumbnail.trim()) ||
      (typeof img.primary_image === "string" &&
        img.primary_image.trim().startsWith("http") &&
        img.primary_image.trim()) ||
      undefined;
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      tag: categoryLabel,
      categoryLabel,
      imageTint: "#d4c4a8",
      imageUri: thumb,
      collection,
    };
  });
}

export function buildCollectionTabsFromProducts(
  items: BoutiqueProductItemUi[],
  rowCollections: Array<{ id?: string; name: string; slug: string }>,
): { key: string; label: string }[] {
  const keys = new Set<string>();
  for (const p of items) {
    const k = normalizeFilterKey(p.collection);
    if (k && k !== "other") keys.add(k);
  }
  const ordered = [...keys].sort((a, b) => a.localeCompare(b));
  const tabs: { key: string; label: string }[] = [{ key: "all", label: "All Collections" }];
  for (const key of ordered) {
    const fromDb = rowCollections.find(
      (c) => normalizeFilterKey(c.slug || c.name) === key,
    );
    const label = fixCollectionLabelText(fromDb?.name ?? titleCaseFromSlug(key));
    tabs.push({ key, label });
  }
  return tabs;
}

/** Earth surface distance in km (0.1 km resolution). @see calculateDistanceKm */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  return calculateDistanceKm(lat1, lon1, lat2, lon2);
}

function parseMaybeJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const v = JSON.parse(raw) as unknown;
      return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function coordsFromGeoJsonPoint(o: Record<string, unknown>): { lat: number; lng: number } | null {
  if (String(o.type ?? "").toLowerCase() !== "point") return null;
  const c = o.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const lng = parseCoord(c[0]);
  const lat = parseCoord(c[1]);
  if (lat != null && lng != null) return { lat, lng };
  return null;
}

/** Resolves boutique lat/lng from flat fields, `{ lat, lng }`, GeoJSON Point, or JSON strings. */
export function resolveBoutiqueCoordinates(
  row: BoutiqueApiListRow & { lat?: unknown; lng?: unknown; lon?: unknown },
): { lat: number; lng: number } | null {
  const coordObj = parseMaybeJsonObject(row.coordinates as unknown);
  if (coordObj) {
    const fromPoint = coordsFromGeoJsonPoint(coordObj);
    if (fromPoint) return fromPoint;
    const flatLat = parseCoord(coordObj.lat);
    const flatLng = parseCoord(coordObj.lng ?? coordObj.lon);
    if (flatLat != null && flatLng != null) return { lat: flatLat, lng: flatLng };
  }
  const aliasLat = parseCoord(row.lat);
  const aliasLng = parseCoord(row.lng ?? row.lon);
  if (aliasLat != null && aliasLng != null) return { lat: aliasLat, lng: aliasLng };
  const la = parseCoord(row.latitude);
  const lo = parseCoord(row.longitude);
  if (la != null && lo != null) return { lat: la, lng: lo };
  return null;
}

export function mapBoutiqueForUi(
  row: BoutiqueApiListRow & { latitude?: number | null; longitude?: number | null },
  _index: number,
  opts?: { userLocation?: { lat: number; lng: number } | null },
): BoutiqueUiListItem {
  const cover = resolveCoverImage(row);
  const logo = resolveLogoImage(row);
  const ratingNum = row.rating != null ? Number(row.rating) : NaN;
  const rating = Number.isFinite(ratingNum) ? ratingNum : 0;
  const reviewsCount = Math.max(
    0,
    Math.floor(Number(row.reviews_count ?? 0)),
  );
  const verified = Boolean(row.is_verified ?? row.verified);
  const hoursLabel =
    formatTimeRange(row.opening_time, row.closing_time) ||
    (row.opening_hours?.trim() ?? "");
  const statusInfo = getBoutiqueHoursStatus(
    row.opening_time,
    row.closing_time,
    row.working_days ?? [],
  );
  const latest =
    typeof row.latest_collection_name === "string" && row.latest_collection_name.trim()
      ? fixCollectionLabelText(row.latest_collection_name.trim())
      : null;

  const boutiqueCoords = resolveBoutiqueCoordinates(row);
  let distanceKm: number | null = null;
  if (opts?.userLocation && boutiqueCoords) {
    distanceKm = calculateDistanceKm(
      opts.userLocation.lat,
      opts.userLocation.lng,
      boutiqueCoords.lat,
      boutiqueCoords.lng,
    );
  }

  const phoneRaw =
    (typeof row.phone === "string" && row.phone.trim()) ||
    (typeof row.phone_number === "string" && row.phone_number.trim()) ||
    null;
  const whatsappRaw =
    (typeof row.whatsapp === "string" && row.whatsapp.trim()) ||
    (typeof row.whatsapp_number === "string" && row.whatsapp_number.trim()) ||
    null;

  const locationFields = boutiqueLocationFieldsFromRow(row);
  const formattedLocation = formatBoutiqueLocation(locationFields);
  if (__DEV__) {
    console.log("[mapBoutiqueForUi] location", {
      id: row.id,
      raw: locationFields,
      formatted: formattedLocation,
    });
  }

  return {
    id: row.id,
    name: row.name,
    image: cover,
    logoImage: logo,
    location: formattedLocation,
    rating,
    distanceKm,
    reviewsCount,
    tag: verified ? "VERIFIED PARTNER" : "PARTNER",
    tags: verified ? ["JEWELLERY", "VERIFIED"] : ["JEWELLERY"],
    status: statusInfo.openNow ? "Open" : "Closed",
    statusSubLabel: statusInfo.statusSubLabel,
    openNow: statusInfo.openNow,
    hoursLabel,
    description: (row.description?.trim() || `${row.name} boutique`).trim(),
    latestCollectionLabel: latest,
    openingTime: row.opening_time ?? null,
    closingTime: row.closing_time ?? null,
    workingDays: row.working_days ?? [],
    phone: phoneRaw,
    whatsapp: whatsappRaw,
    latitude: boutiqueCoords?.lat ?? null,
    longitude: boutiqueCoords?.lng ?? null,
    createdAt: row.created_at ?? null,
  };
}

export function mapBoutiqueDetailToProfileViewModel(row: BoutiqueApiListRow & {
  full_address?: string | null;
  address?: string | null;
  phone_number?: string | null;
  phone?: string | null;
  whatsapp_number?: string | null;
  whatsapp?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  latitude?: number | null;
  longitude?: number | null;
  collections?: Array<{ id: string; name: string; slug: string }>;
  products?: Parameters<typeof mapProductsForProfile>[0];
}): BoutiqueProfileViewModel {
  const items = mapProductsForProfile(row.products ?? []);
  const collectionTabs = buildCollectionTabsFromProducts(items, row.collections ?? []);

  const locationFields = boutiqueLocationFieldsFromRow(row);
  const formattedLocation = formatBoutiqueLocation(locationFields);
  const shortLocation = formatBoutiqueShortLocation(locationFields);
  if (__DEV__) {
    console.log("[mapBoutiqueDetailToProfileViewModel] location", {
      id: row.id,
      raw: locationFields,
      formatted: formattedLocation,
    });
  }
  const openingLabel =
    formatTimeRange(row.opening_time, row.closing_time) ||
    row.opening_hours?.trim() ||
    "Hours not available";
  const statusInfo = getBoutiqueHoursStatus(
    row.opening_time,
    row.closing_time,
    row.working_days ?? [],
  );
  const ratingNum = row.rating != null ? Number(row.rating) : NaN;
  const rating = Number.isFinite(ratingNum) ? ratingNum : 0;
  const reviewCount = Math.max(0, Math.floor(Number(row.reviews_count ?? 0)));

  const resolved = resolveBoutiqueCoordinates(row);
  const coords = resolved ? { lat: resolved.lat, lng: resolved.lng } : null;

  const phone = String(row.phone_number ?? row.phone ?? "").trim();
  const whatsappRaw = String(row.whatsapp_number ?? row.whatsapp ?? "").trim();
  const whatsapp = whatsappRaw.replace(/[\s+-]/g, "");

  return {
    id: row.id,
    name: row.name,
    rating,
    reviewCount,
    location: formattedLocation,
    shortLocation,
    description:
      row.description?.trim() ||
      `${row.name} boutique offering curated fine jewellery collections.`,
    trustedTag: (row.is_verified ?? row.verified) ? "TRUSTED" : "PARTNER",
    banners: buildGalleryBannerSlides(row),
    openNow: statusInfo.openNow,
    statusSubLabel: statusInfo.statusSubLabel,
    hoursLabel: openingLabel,
    logoTint: "#e8dcc8",
    logoCaption:
      row.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 6)
        .toUpperCase() || "STORE",
    logoSubtitle: "BOUTIQUE",
    logoUrl: resolveLogoImage(row),
    products: items,
    phone,
    whatsapp,
    mapsQuery:
      coords != null
        ? `${coords.lat},${coords.lng}`
        : `${formattedLocation.replace(/,/g, " ").trim()} jewellery`,
    contactAddress: formattedLocation,
    collections: collectionTabs,
    openingTime: row.opening_time ?? null,
    closingTime: row.closing_time ?? null,
    workingDays: row.working_days ?? [],
    coordinates: coords,
  };
}
