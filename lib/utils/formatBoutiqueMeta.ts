/**
 * Formats the boutique meta line that appears under product price/name on every
 * product card across the app:  e.g.  "Tanishq Jeweller · 4.8".
 *
 * The rendered line is fully data-driven from the linked boutique row — there
 * is intentionally NO "VERIFIED BOUTIQUE" placeholder copy. When a product is
 * not yet associated to a boutique (transient admin state), we fall back to a
 * minimal "Partner Boutique" label so the layout never breaks.
 */

export type BoutiqueMetaInput = {
  name?: string | null;
  rating?: number | null;
  verified?: boolean | null;
};

/** Round to 1 decimal, drop trailing `.0` so "4.0" → "4". */
function roundRating(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function safeBoutiqueName(name?: string | null): string {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed.length > 0 ? trimmed : "Partner Boutique";
}

export function safeBoutiqueRating(rating?: number | null): string | null {
  if (rating == null) return null;
  const numeric = Number(rating);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return roundRating(Math.min(5, numeric));
}

/**
 * Returns a meta line in the form:
 *   "Tanishq Jeweller · 4.8"   (with rating)
 *   "Tanishq Jeweller"          (no rating)
 *
 * `verifiedSymbol` (defaults to "✓") is appended next to the name when the
 * boutique is flagged as verified in the database. The marker is intentionally
 * inline + subtle to preserve the existing luxury aesthetic.
 */
export function formatBoutiqueMeta(
  input: BoutiqueMetaInput,
  options: { verifiedSymbol?: string } = {},
): string {
  const name = safeBoutiqueName(input.name);
  const rating = safeBoutiqueRating(input.rating);
  const verifiedSymbol = options.verifiedSymbol ?? "✓";
  const verified = Boolean(input.verified);
  const namePart = verified ? `${name} ${verifiedSymbol}` : name;
  return rating ? `${namePart} · ${rating}` : namePart;
}
