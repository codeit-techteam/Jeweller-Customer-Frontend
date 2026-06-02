import { router } from "expo-router";
import { create } from "zustand";
import Toast from "react-native-toast-message";

import { showWishlistToast } from "@/lib/stores/wishlistToastStore";
import { useAuthGuardStore } from "@/lib/stores/authGuardStore";
import { useGuestSessionStore } from "@/lib/stores/guestSessionStore";
import type { WishlistSnapshot } from "@/lib/services/mock/wishlist";
import {
  trackGuestWishlistAttempt,
  trackLoginModalOpened,
} from "@/services/analyticsTracking";
import {
  addWishlistProduct,
  ApiError,
  getWishlist,
  getWishlistCount,
  removeWishlistProduct,
} from "@/services/api";

type WishlistRow = WishlistSnapshot & {
  boutiqueName?: string;
  createdAt?: string;
};

type WishlistState = {
  userId: string | null;
  ids: string[];
  items: Record<string, WishlistRow>;
  count: number;
  loading: boolean;
  initialized: boolean;
  pendingById: Record<string, boolean>;
  initializeForUser: (
    userId: string | null,
    opts?: { force?: boolean; silent?: boolean },
  ) => Promise<void>;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
  toggle: (id: string, snapshot?: WishlistSnapshot, options?: { skipToast?: boolean }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  /** Remove from wishlist only (no toggle / guest login flow). Used after move-to-cart. */
  removeFromWishlistOnly: (id: string) => Promise<void>;
  isWishlisted: (id: string) => boolean;
};

function toApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Login required";
    if (error.code === "NETWORK") return "No internet connection";
    return error.message || "Something went wrong";
  }
  return "Something went wrong";
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  userId: null,
  ids: [],
  items: {},
  count: 0,
  loading: false,
  initialized: false,
  pendingById: {},

  initializeForUser: async (userId, opts) => {
    console.log("WISHLIST USER:", userId);
    if (!userId) {
      set({
        userId: null,
        ids: [],
        items: {},
        count: 0,
        loading: false,
        initialized: true,
        pendingById: {},
      });
      return;
    }

    const current = get();
    const force = opts?.force ?? false;
    const silent = opts?.silent ?? false;
    if (current.userId === userId && current.initialized && !force) return;

    if (silent) {
      set({ userId, loading: false });
    } else {
      set({
        userId,
        loading: true,
        initialized: false,
        ids: [],
        items: {},
        count: 0,
        pendingById: {},
      });
    }
    try {
      const [list, countPayload] = await Promise.all([
        getWishlist(userId),
        getWishlistCount(userId),
      ]);
      const ids: string[] = [];
      const items: Record<string, WishlistRow> = {};
      for (const row of list) {
        if (!row.product) continue;
        ids.push(row.product.id);
        const boutique = row.product.boutique ?? null;
        const ratingRaw = boutique?.rating;
        const ratingNumber = ratingRaw == null ? null : Number(ratingRaw);
        items[row.product.id] = {
          id: row.product.id,
          name: row.product.name,
          price: Number(row.product.price ?? 0),
          image: row.product.image ?? "",
          boutiqueName: boutique?.name ?? "",
          boutiqueRating:
            ratingNumber != null && Number.isFinite(ratingNumber) && ratingNumber > 0
              ? ratingNumber
              : null,
          boutiqueVerified: Boolean(boutique?.verified ?? false),
          createdAt: row.created_at,
        };
      }
      console.log("WISHLIST FETCH SUCCESS:", ids.length);
      console.log("WISHLIST COUNT:", countPayload.count);
      set({
        userId,
        ids,
        items,
        count: countPayload.count ?? ids.length,
        loading: false,
        initialized: true,
      });
    } catch (error) {
      set({ loading: false, initialized: true });
      Toast.show({ type: "error", text1: toApiErrorMessage(error) });
    }
  },

  refresh: async (opts) => {
    const userId = get().userId;
    if (!userId) return;
    const silent = opts?.silent ?? false;
    if (!silent) {
      set({ initialized: false });
    }
    await get().initializeForUser(userId, { force: true, silent });
  },

  toggle: async (id, snapshot, options) => {
    const state = get();
    const userId = state.userId;
    if (!userId) {
      const guestStore = useGuestSessionStore.getState();
      if (guestStore.isGuestWishlisted(id)) {
        await guestStore.removeGuestWishlist(id);
        return;
      }
      if (snapshot) {
        await guestStore.addGuestWishlist(snapshot);
      }
      useAuthGuardStore.getState().openLoginModal({
        type: "wishlist",
        productId: id,
        snapshot,
      });
      trackLoginModalOpened("wishlist");
      trackGuestWishlistAttempt(id);
      return;
    }
    if (state.pendingById[id]) return;

    const wasWishlisted = state.ids.includes(id);
    const previousIds = state.ids;
    const previousItems = state.items;
    const previousCount = state.count;

    const optimisticItem = snapshot
      ? {
          id: snapshot.id,
          name: snapshot.name,
          price: snapshot.price,
          image: snapshot.image,
          tintFallback: snapshot.tintFallback,
          boutiqueName: snapshot.boutiqueName,
          boutiqueRating: snapshot.boutiqueRating ?? null,
          boutiqueVerified: snapshot.boutiqueVerified ?? false,
        }
      : previousItems[id];

    set((s) => {
      const pendingById = { ...s.pendingById, [id]: true };
      if (wasWishlisted) {
        const { [id]: _removed, ...rest } = s.items;
        return {
          ids: s.ids.filter((x) => x !== id),
          items: rest,
          count: Math.max(0, s.count - 1),
          pendingById,
        };
      }
      return {
        ids: [...s.ids, id],
        items: optimisticItem ? { ...s.items, [id]: optimisticItem } : s.items,
        count: s.count + 1,
        pendingById,
      };
    });

    try {
      if (wasWishlisted) {
        await removeWishlistProduct(id, userId);
        if (!options?.skipToast) {
          showWishlistToast({ type: "removed" });
        }
      } else {
        await addWishlistProduct(id, userId);
        console.log("WISHLIST SAVE SUCCESS:", { userId, productId: id });
        if (!options?.skipToast) {
          showWishlistToast({
            type: "added",
            actionText: "VIEW",
            onAction: () => {
              router.push("/(app)/wishlist");
            },
          });
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && !wasWishlisted) {
        set((s) => ({
          pendingById: { ...s.pendingById, [id]: false },
        }));
        return;
      }
      set((s) => ({
        ids: previousIds,
        items: previousItems,
        count: previousCount,
        pendingById: { ...s.pendingById, [id]: false },
      }));
      Toast.show({ type: "error", text1: toApiErrorMessage(error) });
      return;
    }

    set((s) => ({
      pendingById: { ...s.pendingById, [id]: false },
    }));
  },

  remove: async (id) => {
    if (!get().ids.includes(id)) return;
    await get().toggle(id);
  },

  removeFromWishlistOnly: async (id) => {
    const state = get();
    const userId = state.userId;
    if (!userId || !state.ids.includes(id)) return;
    if (state.pendingById[id]) return;

    const previousIds = state.ids;
    const previousItems = state.items;
    const previousCount = state.count;

    set((s) => {
      const { [id]: _removed, ...rest } = s.items;
      return {
        ids: s.ids.filter((x) => x !== id),
        items: rest,
        count: Math.max(0, s.count - 1),
        pendingById: { ...s.pendingById, [id]: true },
      };
    });

    try {
      await removeWishlistProduct(id, userId);
    } catch (error) {
      set({
        ids: previousIds,
        items: previousItems,
        count: previousCount,
        pendingById: { ...state.pendingById, [id]: false },
      });
      throw error;
    }

    set((s) => ({
      pendingById: { ...s.pendingById, [id]: false },
    }));
  },

  isWishlisted: (id) => get().ids.includes(id),
}));

/** Server wishlist ids when logged in; guest cache ids when browsing as guest. */
export function useWishlistIds(): string[] {
  const serverIds = useWishlistStore((s) => s.ids);
  const userId = useWishlistStore((s) => s.userId);
  const guestIds = useGuestSessionStore((s) => s.wishlistIds);
  return userId ? serverIds : guestIds;
}

export function useIsWishlisted(id: string): boolean {
  const userId = useWishlistStore((s) => s.userId);
  const inServer = useWishlistStore((s) => s.ids.includes(id));
  const inGuest = useGuestSessionStore((s) => s.wishlistIds.includes(id));
  return userId ? inServer : inGuest;
}
