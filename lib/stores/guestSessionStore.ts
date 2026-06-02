import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { WishlistSnapshot } from '@/lib/services/mock/wishlist';

const GUEST_WISHLIST_KEY = 'guest_wishlist_v1';
const GUEST_BANNER_DISMISSED_KEY = 'guest_banner_dismissed_v1';

type GuestWishlistItem = WishlistSnapshot & { addedAt: string };

type GuestSessionState = {
  wishlistIds: string[];
  wishlistItems: Record<string, GuestWishlistItem>;
  bannerDismissed: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addGuestWishlist: (snapshot: WishlistSnapshot) => Promise<void>;
  removeGuestWishlist: (productId: string) => Promise<void>;
  isGuestWishlisted: (productId: string) => boolean;
  clearGuestWishlist: () => Promise<void>;
  dismissBanner: () => Promise<void>;
  resetBannerDismissed: () => Promise<void>;
};

async function persistGuestWishlist(
  ids: string[],
  items: Record<string, GuestWishlistItem>,
): Promise<void> {
  await AsyncStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify({ ids, items }));
}

export const useGuestSessionStore = create<GuestSessionState>((set, get) => ({
  wishlistIds: [],
  wishlistItems: {},
  bannerDismissed: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const [wishlistRaw, bannerRaw] = await Promise.all([
        AsyncStorage.getItem(GUEST_WISHLIST_KEY),
        AsyncStorage.getItem(GUEST_BANNER_DISMISSED_KEY),
      ]);
      if (wishlistRaw) {
        const parsed = JSON.parse(wishlistRaw) as {
          ids?: string[];
          items?: Record<string, GuestWishlistItem>;
        };
        set({
          wishlistIds: parsed.ids ?? [],
          wishlistItems: parsed.items ?? {},
        });
      }
      set({ bannerDismissed: bannerRaw === 'true', hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addGuestWishlist: async (snapshot) => {
    const id = snapshot.id;
    if (get().wishlistIds.includes(id)) return;
    const item: GuestWishlistItem = { ...snapshot, addedAt: new Date().toISOString() };
    const ids = [id, ...get().wishlistIds];
    const items = { ...get().wishlistItems, [id]: item };
    set({ wishlistIds: ids, wishlistItems: items });
    await persistGuestWishlist(ids, items);
  },

  removeGuestWishlist: async (productId) => {
    const ids = get().wishlistIds.filter((x) => x !== productId);
    const { [productId]: _removed, ...items } = get().wishlistItems;
    set({ wishlistIds: ids, wishlistItems: items });
    await persistGuestWishlist(ids, items);
  },

  isGuestWishlisted: (productId) => get().wishlistIds.includes(productId),

  clearGuestWishlist: async () => {
    set({ wishlistIds: [], wishlistItems: {} });
    await AsyncStorage.removeItem(GUEST_WISHLIST_KEY);
  },

  dismissBanner: async () => {
    set({ bannerDismissed: true });
    await AsyncStorage.setItem(GUEST_BANNER_DISMISSED_KEY, 'true');
  },

  resetBannerDismissed: async () => {
    set({ bannerDismissed: false });
    await AsyncStorage.removeItem(GUEST_BANNER_DISMISSED_KEY);
  },
}));
