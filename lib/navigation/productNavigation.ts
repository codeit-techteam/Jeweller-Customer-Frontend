import type { Router } from "expo-router";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidProductId(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

/**
 * Navigate to the product detail screen only if the id looks like a real backend UUID.
 * Returns true when navigation was issued, false when the id was rejected.
 */
export function pushProductDetails(
  router: Router,
  id: string | null | undefined,
  extras?: { boutiqueId?: string | null; categorySlug?: string | null },
): boolean {
  if (!isValidProductId(id)) return false;
  const params: Record<string, string> = { id: id.trim() };
  if (extras?.boutiqueId) params.boutiqueId = extras.boutiqueId;
  if (extras?.categorySlug) params.categorySlug = extras.categorySlug;
  router.push({
    pathname: "/(app)/product-details",
    params,
  });
  return true;
}
