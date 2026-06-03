import { create } from 'zustand';

import type { BoutiqueApiListRow } from '@/lib/boutiques/boutiqueUi';
import { formatBoutiqueLocation } from '@/lib/utils/formatBoutiqueLocation';
import {
  getBoutiqueHoursStatus,
  normalizeWorkingDays,
  resolveBoutiqueCoordinates,
  resolveCoverImage,
} from '@/lib/boutiques/boutiqueUi';
import {
  mapStoredBoutiquesToRecentlyViewed,
  type RecentlyViewedBoutique,
} from '@/lib/services/mock/recentlyViewed';
import { getProductById } from '@/lib/services/mock/products';
import {
  clearRecentlyViewed,
  getRecentlyViewed,
  removeRecentBoutique,
  trackBoutiqueVisit as persistBoutiqueVisit,
  trackProductView as persistProductView,
  type TrackBoutiqueInput,
  type TrackProductInput,
} from '@/lib/services/recentlyViewedStorage';
import {
  addRecentlyViewed as addRecentlyViewedApi,
  getRecentlyViewed as getRecentlyViewedApi,
  clearRecentlyViewedForUser as clearRecentlyViewedForUserApi,
} from '@/services/api';

function mapApiBoutiqueToRecentCard(
  boutique: Record<string, unknown> | null | undefined,
  boutiqueId: string,
  boutiqueName: string,
): Pick<
  RecentlyViewedBoutique,
  | 'name'
  | 'heroImage'
  | 'rating'
  | 'reviews'
  | 'location'
  | 'tags'
  | 'verified'
  | 'openNow'
  | 'statusSubLabel'
  | 'openingTime'
  | 'closingTime'
  | 'phone'
  | 'whatsapp'
  | 'latitude'
  | 'longitude'
> {
  const b = boutique ?? {};
  const listRow = {
    id: boutiqueId,
    name: boutiqueName,
    image: (b.image as string | null) ?? null,
    cover_image: (b.cover_image as string | null) ?? null,
    gallery_images: Array.isArray(b.gallery_images)
      ? (b.gallery_images as string[])
      : null,
    banner_images: Array.isArray(b.banner_images)
      ? (b.banner_images as string[])
      : null,
    location: (b.location as string | null) ?? null,
    rating: b.rating != null ? Number(b.rating) : null,
    reviews_count: b.reviews_count != null ? Number(b.reviews_count) : null,
    opening_time: (b.opening_time as string | null) ?? null,
    closing_time: (b.closing_time as string | null) ?? null,
    working_days: normalizeWorkingDays(b.working_days),
    is_verified: Boolean(b.is_verified ?? b.verified),
    verified: Boolean(b.verified),
    coordinates: (b.coordinates as BoutiqueApiListRow['coordinates']) ?? null,
    latitude: b.latitude as number | null | undefined,
    longitude: b.longitude as number | null | undefined,
    lat: b.lat as number | null | undefined,
    lng: b.lng as number | null | undefined,
    lon: b.lon as number | null | undefined,
  } as BoutiqueApiListRow;
  const resolvedCoords = resolveBoutiqueCoordinates(listRow);
  const heroImage = resolveCoverImage(listRow) || '';
  const wd = normalizeWorkingDays(b.working_days);
  const hoursOpen = getBoutiqueHoursStatus(
    (b.opening_time as string | null) ?? null,
    (b.closing_time as string | null) ?? null,
    wd,
  );
  const phone =
    (typeof b.phone_number === 'string' && b.phone_number.trim()) ||
    (typeof b.contact_number === 'string' && b.contact_number.trim()) ||
    null;
  const whatsapp =
    (typeof b.whatsapp_number === 'string' && b.whatsapp_number.trim()) ||
    (typeof b.whatsapp === 'string' && b.whatsapp.trim()) ||
    null;
  const locationLine = formatBoutiqueLocation({
    location: typeof b.location === 'string' ? b.location : null,
    full_address: typeof b.full_address === 'string' ? b.full_address : null,
    address: typeof b.address === 'string' ? b.address : null,
    area: typeof b.area === 'string' ? b.area : null,
    city: typeof b.city === 'string' ? b.city : null,
    state: typeof b.state === 'string' ? b.state : null,
  });
  const ratingNum = b.rating != null ? Number(b.rating) : NaN;
  const rating = Number.isFinite(ratingNum) ? ratingNum : 0;
  const reviews = Math.max(0, Math.floor(Number(b.reviews_count ?? 0)));
  const verified = Boolean(b.is_verified ?? b.verified);
  return {
    name: boutiqueName,
    heroImage,
    rating,
    reviews,
    location: locationLine,
    tags: verified ? ['JEWELLERY', 'VERIFIED'] : ['JEWELLERY'],
    verified,
    openNow: hoursOpen.openNow,
    statusSubLabel: hoursOpen.statusSubLabel,
    openingTime: (b.opening_time as string | null) ?? null,
    closingTime: (b.closing_time as string | null) ?? null,
    phone,
    whatsapp,
    latitude: resolvedCoords?.lat ?? null,
    longitude: resolvedCoords?.lng ?? null,
  };
}

async function loadDisplay(userId?: string | null): Promise<RecentlyViewedBoutique[]> {
  try {
    if (!userId) {
      throw new Error('Missing user id for recently viewed; falling back to local storage');
    }

    const apiRows = await getRecentlyViewedApi(userId);
    const grouped = new Map<string, RecentlyViewedBoutique>();

    apiRows.forEach((row) => {
      const boutique = row.boutiques;
      const product = row.products;
      const boutiqueId = boutique?.id ?? row.boutique_id ?? 'unknown-boutique';
      const boutiqueName = boutique?.name ?? 'Boutique';
      const viewedAt = new Date(row.viewed_at).getTime();
      const meta = boutique
        ? mapApiBoutiqueToRecentCard(boutique as unknown as Record<string, unknown>, boutiqueId, boutiqueName)
        : {
            name: boutiqueName,
            heroImage: '',
            rating: 0,
            reviews: 0,
            location: 'Location unavailable',
            tags: ['JEWELLERY'] as string[],
            verified: false,
            openNow: false,
            statusSubLabel: '',
            openingTime: null as string | null,
            closingTime: null as string | null,
            phone: null as string | null,
            whatsapp: null as string | null,
            latitude: null as number | null,
            longitude: null as number | null,
          };

      const existing = grouped.get(boutiqueId);
      const nextProduct = product
        ? {
            id: product.id,
            name: product.name,
            price: Number(product.price ?? 0),
            image: product.image ?? getProductById(product.id)?.images[0]?.uri ?? '',
            category: getProductById(product.id)?.category,
          }
        : null;

      if (!existing) {
        grouped.set(boutiqueId, {
          id: boutiqueId,
          boutiqueId,
          name: meta.name,
          heroImage: meta.heroImage,
          rating: meta.rating,
          reviews: meta.reviews,
          location: meta.location,
          distanceKm: null,
          tags: meta.tags,
          verified: meta.verified,
          openNow: meta.openNow,
          statusSubLabel: meta.statusSubLabel,
          openingTime: meta.openingTime,
          closingTime: meta.closingTime,
          viewedCount: nextProduct ? 1 : 0,
          contextText: 'Recently viewed',
          lastViewedAt: viewedAt,
          products: nextProduct ? [nextProduct] : [],
          moreCount: 0,
          phone: meta.phone,
          whatsapp: meta.whatsapp,
          latitude: meta.latitude,
          longitude: meta.longitude,
        });
        return;
      }

      if (nextProduct && !existing.products.some((item) => item.id === nextProduct.id)) {
        existing.products.push(nextProduct);
      }
      existing.lastViewedAt = Math.max(existing.lastViewedAt, viewedAt);
      existing.viewedCount = existing.products.length;
      existing.moreCount = Math.max(0, existing.products.length - 3);
      existing.contextText = `You viewed ${existing.viewedCount} product${existing.viewedCount === 1 ? '' : 's'} here recently`;
      existing.name = meta.name;
      existing.heroImage = meta.heroImage;
      existing.rating = meta.rating;
      existing.reviews = meta.reviews;
      existing.location = meta.location;
      existing.tags = meta.tags;
      existing.verified = meta.verified;
      existing.openNow = meta.openNow;
      existing.statusSubLabel = meta.statusSubLabel;
      existing.openingTime = meta.openingTime;
      existing.closingTime = meta.closingTime;
      existing.phone = meta.phone;
      existing.whatsapp = meta.whatsapp;
      existing.latitude = meta.latitude;
      existing.longitude = meta.longitude;
    });

    return Array.from(grouped.values()).sort((a, b) => b.lastViewedAt - a.lastViewedAt);
  } catch (_error) {
    // Fall back to legacy AsyncStorage path if backend is unavailable.
  }

  const raw = await getRecentlyViewed();
  return mapStoredBoutiquesToRecentlyViewed(raw);
}

type State = {
  boutiques: RecentlyViewedBoutique[];
  hydrated: boolean;
  hydrate: (userId?: string | null) => Promise<void>;
  refresh: (userId?: string | null) => Promise<void>;
  trackProductView: (
    boutique: TrackBoutiqueInput,
    product: TrackProductInput,
    userId?: string | null,
  ) => Promise<void>;
  trackBoutiqueVisit: (boutique: TrackBoutiqueInput, userId?: string | null) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: (userId?: string | null) => Promise<void>;
};

export const useRecentlyViewedStore = create<State>((set, get) => ({
  boutiques: [],
  hydrated: false,
  hydrate: async (userId) => {
    const boutiques = await loadDisplay(userId);
    console.log('RECENTLY VIEWED:', boutiques);
    set({ boutiques, hydrated: true });
  },
  refresh: async (userId) => {
    set({ boutiques: await loadDisplay(userId) });
  },
  trackProductView: async (boutique, product, userId) => {
    await persistProductView(boutique, product);
    if (userId) {
      await addRecentlyViewedApi({
        user_id: userId,
        boutique_id: boutique.id,
        product_id: product.id,
      }).catch(() => {});
    }
    set({ boutiques: await loadDisplay(userId) });
  },
  trackBoutiqueVisit: async (boutique, userId) => {
    await persistBoutiqueVisit(boutique);
    if (userId) {
      await addRecentlyViewedApi({
        user_id: userId,
        boutique_id: boutique.id,
      }).catch(() => {});
    }
    set({ boutiques: await loadDisplay(userId) });
  },
  remove: async (id) => {
    await removeRecentBoutique(id);
    set({ boutiques: get().boutiques.filter((b) => b.boutiqueId !== id) });
  },
  clearAll: async (userId) => {
    if (userId) {
      await clearRecentlyViewedForUserApi(userId).catch(() => {});
    }
    await clearRecentlyViewed();
    set({ boutiques: [] });
  },
}));
