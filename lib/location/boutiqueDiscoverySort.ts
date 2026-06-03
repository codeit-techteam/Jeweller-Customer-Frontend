import type { BoutiqueSortOptionId } from "@/components/boutiques/BoutiqueSortDropdown";
import type { BoutiqueUiListItem } from "@/lib/boutiques/boutiqueUi";
import { boutiqueMatchesCityToken } from "@/lib/location/locationSearch";

export function sortBoutiquesForDiscovery(
  list: BoutiqueUiListItem[],
  sort: BoutiqueSortOptionId | null,
  cityToken: string | null,
): BoutiqueUiListItem[] {
  const sorted = [...list];
  const effective: BoutiqueSortOptionId = sort ?? "NEAREST";

  const cityRank = (item: BoutiqueUiListItem) =>
    boutiqueMatchesCityToken(item.location, cityToken) ? 0 : 1;

  switch (effective) {
    case "NEAREST":
      sorted.sort((a, b) => {
        const cr = cityRank(a) - cityRank(b);
        if (cr !== 0) return cr;
        const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
      break;
    case "HIGHEST_RATED":
      sorted.sort(
        (a, b) =>
          b.rating - a.rating ||
          b.reviewsCount - a.reviewsCount ||
          cityRank(a) - cityRank(b),
      );
      break;
    case "MOST_REVIEWED":
      sorted.sort(
        (a, b) =>
          b.reviewsCount - a.reviewsCount ||
          b.rating - a.rating ||
          cityRank(a) - cityRank(b),
      );
      break;
    case "RECENTLY_ADDED":
      sorted.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta || cityRank(a) - cityRank(b);
      });
      break;
    case "OPEN_NOW":
      sorted.sort((a, b) => {
        if (a.openNow !== b.openNow) return a.openNow ? -1 : 1;
        const cr = cityRank(a) - cityRank(b);
        if (cr !== 0) return cr;
        const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
      break;
    default:
      break;
  }
  return sorted;
}
