/**
 * Normalizes a search string for storage / display (recent searches).
 * Trims, collapses whitespace, and drops a trailing token that looks incomplete
 * (very short last word when there are multiple tokens).
 */
export function normalizeSearchKeyword(raw: string): string {
  const parts = raw
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0);
  if (parts.length === 0) return "";
  const last = parts[parts.length - 1]!;
  if (parts.length > 1 && last.length < 3) {
    parts.pop();
  }
  return parts.join(" ").trim();
}
