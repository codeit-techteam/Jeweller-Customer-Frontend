/**
 * Single formatter for boutique address display (listing, profile, saved, search).
 */

export type BoutiqueLocationFields = {
  area?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  location?: string | null;
  full_address?: string | null;
};

const LOCATION_UNAVAILABLE = "Location unavailable";

/** Longest-first so "West Bengal" matches before "West". */
const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
].sort((a, b) => b.length - a.length);

function cleanPart(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

function parseJsonLocation(value: unknown): Partial<BoutiqueLocationFields> | null {
  if (value == null) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    return {
      area: cleanPart(o.area ?? o.locality ?? o.neighborhood),
      address: cleanPart(o.address ?? o.street ?? o.line1),
      city: cleanPart(o.city ?? o.town),
      state: cleanPart(o.state ?? o.region),
      country: cleanPart(o.country),
      pincode: cleanPart(o.pincode ?? o.pin ?? o.zip),
    };
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    return parseJsonLocation(JSON.parse(trimmed));
  } catch {
    return null;
  }
}

function mergeFields(
  ...sources: Array<Partial<BoutiqueLocationFields> | null | undefined>
): BoutiqueLocationFields {
  const out: BoutiqueLocationFields = {};
  for (const src of sources) {
    if (!src) continue;
    if (!out.area && src.area) out.area = src.area;
    if (!out.address && src.address) out.address = src.address;
    if (!out.city && src.city) out.city = src.city;
    if (!out.state && src.state) out.state = src.state;
    if (!out.country && src.country) out.country = src.country;
    if (!out.pincode && src.pincode) out.pincode = src.pincode;
    if (!out.location && src.location) out.location = src.location;
    if (!out.full_address && src.full_address) out.full_address = src.full_address;
  }
  return out;
}

function parseUnstructuredLine(text: string): {
  area?: string;
  city?: string;
  state?: string;
} {
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (trimmed.includes(",")) {
    const parts = trimmed
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      return { area: parts[0], city: parts[1], state: parts.slice(2).join(", ") };
    }
    if (parts.length === 2) {
      return { city: parts[0], state: parts[1] };
    }
    return { city: parts[0] };
  }

  const lower = trimmed.toLowerCase();
  for (const stateName of INDIAN_STATES) {
    const suffix = stateName.toLowerCase();
    if (lower === suffix) return { state: stateName };
    if (lower.endsWith(` ${suffix}`)) {
      const before = trimmed.slice(0, trimmed.length - stateName.length).trim();
      const words = before.split(/\s+/).filter(Boolean);
      if (words.length >= 2) {
        return {
          area: words.slice(0, -1).join(" "),
          city: words[words.length - 1],
          state: stateName,
        };
      }
      if (words.length === 1) {
        return { city: words[0], state: stateName };
      }
      return { state: stateName };
    }
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return {
      area: words.slice(0, -2).join(" "),
      city: words[words.length - 2],
      state: words[words.length - 1],
    };
  }
  if (words.length === 2) {
    return { city: words[0], state: words[1] };
  }
  return { city: trimmed };
}

function resolvedParts(fields: BoutiqueLocationFields): {
  area: string | null;
  city: string | null;
  state: string | null;
} {
  const jsonFromAddress = parseJsonLocation(fields.address);
  const jsonFromFull = parseJsonLocation(fields.full_address);
  const jsonFromLocation = parseJsonLocation(fields.location);
  const merged = mergeFields(jsonFromAddress, jsonFromFull, jsonFromLocation, fields);

  let area = cleanPart(merged.area);
  let city = cleanPart(merged.city);
  let state = cleanPart(merged.state);

  const addrLine = cleanPart(merged.address);
  if (addrLine && !addrLine.includes(",") && !area) {
    const parsed = parseUnstructuredLine(addrLine);
    area = area ?? cleanPart(parsed.area);
    city = city ?? cleanPart(parsed.city);
    state = state ?? cleanPart(parsed.state);
  }

  const fallbackLine =
    cleanPart(merged.full_address) ??
    cleanPart(merged.location) ??
    (addrLine && addrLine.includes(",") ? addrLine : null);

  if ((!area && !city && !state) && fallbackLine) {
    const parsed = parseUnstructuredLine(fallbackLine);
    area = cleanPart(parsed.area);
    city = cleanPart(parsed.city);
    state = cleanPart(parsed.state);
    if (!area && !city && !state && fallbackLine.includes(",")) {
      return { area: null, city: fallbackLine, state: null };
    }
    if (!area && !city && !state) {
      return { area: null, city: fallbackLine, state: null };
    }
  }

  if (!area && addrLine && area !== addrLine) {
    const onlyAddr = parseUnstructuredLine(addrLine);
    if (!city && onlyAddr.city) city = cleanPart(onlyAddr.city);
    if (!state && onlyAddr.state) state = cleanPart(onlyAddr.state);
    if (!area && onlyAddr.area) area = cleanPart(onlyAddr.area);
  }

  return { area, city, state };
}

/**
 * Formats boutique location for cards and headers.
 * Examples: "Kalyani, Kolkata, West Bengal" · "Kolkata, West Bengal" · "Kolkata"
 */
export function formatBoutiqueLocation(input: BoutiqueLocationFields): string {
  const { area, city, state } = resolvedParts(input);
  const parts: string[] = [];
  if (area) parts.push(area);
  if (city && city !== area) parts.push(city);
  if (state && state !== city && state !== area) parts.push(state);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  const raw =
    cleanPart(input.full_address) ??
    cleanPart(input.address) ??
    cleanPart(input.location);
  if (raw) {
    if (raw.includes(",")) return raw;
    const parsed = parseUnstructuredLine(raw);
    const fallbackParts: string[] = [];
    if (parsed.area) fallbackParts.push(parsed.area);
    if (parsed.city && parsed.city !== parsed.area) fallbackParts.push(parsed.city);
    if (parsed.state) fallbackParts.push(parsed.state);
    if (fallbackParts.length > 0) return fallbackParts.join(", ");
    return raw;
  }

  return LOCATION_UNAVAILABLE;
}

/** First segment for compact profile meta (area or city). */
export function formatBoutiqueShortLocation(input: BoutiqueLocationFields): string {
  const full = formatBoutiqueLocation(input);
  if (full === LOCATION_UNAVAILABLE) return full;
  const segment = full.split(",")[0]?.trim();
  return segment || full;
}

export function boutiqueLocationFieldsFromRow(
  row: BoutiqueLocationFields & Record<string, unknown>,
): BoutiqueLocationFields {
  return {
    area: cleanPart(row.area),
    address: cleanPart(row.address),
    city: cleanPart(row.city),
    state: cleanPart(row.state),
    country: cleanPart(row.country),
    pincode: cleanPart(row.pincode),
    location: cleanPart(row.location),
    full_address: cleanPart(row.full_address),
  };
}
