import { create } from 'zustand';

import {
  getBoutiqueHoursStatus,
  normalizeWorkingDays,
} from '@/lib/boutiques/boutiqueUi';
import type { SavedBoutique } from '@/lib/services/mock/savedBoutiques';
import {
  getSavedBoutiques,
  saveBoutique as apiSaveBoutique,
  unsaveBoutique as apiUnsaveBoutique,
} from '@/services/api';

type SavedBoutiqueApiRow = Awaited<ReturnType<typeof getSavedBoutiques>>[number];

function mapSavedBoutiqueFromApi(row: SavedBoutiqueApiRow): SavedBoutique {
  const openingTime = row.opening_time ?? null;
  const closingTime = row.closing_time ?? null;
  const workingDays = normalizeWorkingDays(row.working_days);
  const hours = getBoutiqueHoursStatus(openingTime, closingTime, workingDays);
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    rating: row.rating,
    reviews: row.reviews,
    location: row.location,
    full_address: row.full_address,
    distanceKm: row.distanceKm,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    whatsapp: row.whatsapp,
    tags: row.tags,
    verified: row.verified,
    previewImages: row.previewImages,
    galleryLayout: row.galleryLayout,
    splitUsesHeroImage: row.splitUsesHeroImage,
    moreItemsCount: row.moreItemsCount,
    itineraryPieces: row.itineraryPieces,
    savedAt: row.savedAt,
    openingTime,
    closingTime,
    workingDays,
    openNow: hours.openNow,
    statusSubLabel: hours.statusSubLabel,
  };
}

type SavedBoutiquesState = {
  /** Saved boutique ids for the current authenticated user (order preserved, latest first). */
  ids: string[];
  /** Full saved boutique payloads as returned from backend, keyed by boutique id. */
  itemsById: Record<string, SavedBoutique>;
  /** Loading flag for initial hydration and subsequent mutations. */
  loading: boolean;
  /** User id for which the store has been hydrated. */
  hydratedUserId: string | null;
  /** Hydrate saved boutiques for a given user from backend. */
  hydrateForUser: (userId: string) => Promise<void>;
  /** Optimistically save a boutique for a user and sync with backend. */
  saveForUser: (userId: string, boutiqueId: string) => Promise<void>;
  /** Optimistically unsave a boutique for a user and sync with backend. */
  unsaveForUser: (userId: string, boutiqueId: string) => Promise<void>;
  /** Clear state (e.g. on logout). */
  clear: () => void;
};

export const useSavedBoutiquesStore = create<SavedBoutiquesState>((set, get) => ({
  ids: [],
  itemsById: {},
  loading: false,
  hydratedUserId: null,

  hydrateForUser: async (userId: string) => {
    if (!userId) return;
    console.log('CURRENT USER:', userId);
    console.log('FETCHING SAVED BOUTIQUES');
    set({ loading: true });
    try {
      const data = await getSavedBoutiques(userId);
      console.log('RAW SAVED DATA:', data);
      const itemsById: Record<string, SavedBoutique> = {};
      const ids: string[] = [];
      for (const item of data) {
        if (!item?.id) continue;
        ids.push(item.id);
        // The backend payload is already shaped for the card; cast for now.
        itemsById[item.id] = mapSavedBoutiqueFromApi(item);
      }
      set({ ids, itemsById, hydratedUserId: userId });
    } catch (error) {
      console.log('FETCH ERROR:', error);
      console.error('[useSavedBoutiquesStore] Failed to hydrate saved boutiques', error);
      set({ ids: [], itemsById: {}, hydratedUserId: userId });
    } finally {
      set({ loading: false });
    }
  },

  saveForUser: async (userId: string, boutiqueId: string) => {
    if (!userId || !boutiqueId) return;
    const prevIds = get().ids;
    const alreadySaved = prevIds.includes(boutiqueId);
    if (alreadySaved) return;

    // Optimistic update
    set({ ids: [boutiqueId, ...prevIds] });
    try {
      console.log('SAVE ACTION:', boutiqueId);
      await apiSaveBoutique({ user_id: userId, boutique_id: boutiqueId });
      // Re-hydrate list to capture latest boutique metadata.
      await get().hydrateForUser(userId);
    } catch (error) {
      console.error('[useSavedBoutiquesStore] Failed to save boutique', error);
      // Revert optimistic update on failure
      set({ ids: prevIds });
    }
  },

  unsaveForUser: async (userId: string, boutiqueId: string) => {
    if (!userId || !boutiqueId) return;
    const prevIds = get().ids;
    if (!prevIds.includes(boutiqueId)) return;

    // Optimistic update
    set({ ids: prevIds.filter((id) => id !== boutiqueId) });
    try {
      console.log('SAVE ACTION:', boutiqueId);
      await apiUnsaveBoutique({ user_id: userId, boutique_id: boutiqueId });
      await get().hydrateForUser(userId);
    } catch (error) {
      console.error('[useSavedBoutiquesStore] Failed to unsave boutique', error);
      // Revert optimistic update on failure
      set({ ids: prevIds });
    }
  },

  clear: () => {
    set({ ids: [], itemsById: {}, hydratedUserId: null, loading: false });
  },
}));

