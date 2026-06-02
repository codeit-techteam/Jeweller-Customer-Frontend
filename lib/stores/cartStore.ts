import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { create } from 'zustand';

import { showCartToast } from '@/lib/stores/cartToastStore';

const GUEST_CART_KEY = 'guest_cart_v1';

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  size: string;
  metal: string;
  qty: number;
  /** e.g. "Midnight Black / 44mm" */
  subtitle?: string;
  /** Optional product image URL for cart row */
  imageUri?: string;
};

type CartState = {
  items: CartLine[];
  hydrated: boolean;
  hydrateCart: () => Promise<void>;
  persistCart: () => Promise<void>;
  setItems: (items: CartLine[]) => void;
  addItem: (line: Omit<CartLine, 'qty'> & { qty?: number }, options?: { skipToast?: boolean }) => void;
  removeItem: (productId: string, size: string, metal: string) => void;
  setLineQty: (productId: string, size: string, metal: string, qty: number) => void;
  clear: () => void;
};

async function saveCartItems(items: CartLine[]): Promise<void> {
  await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrateCart: async () => {
    try {
      const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) {
          set({ items: parsed, hydrated: true });
          return;
        }
      }
      set({ hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  persistCart: async () => {
    await saveCartItems(get().items);
  },

  setItems: (items) => {
    set({ items });
    void saveCartItems(items);
  },

  addItem: (line, options) => {
    const qty = line.qty ?? 1;
    const items = get().items;
    const i = items.findIndex(
      (x) => x.productId === line.productId && x.size === line.size && x.metal === line.metal,
    );
    let next: CartLine[];
    if (i >= 0) {
      next = [...items];
      next[i] = { ...next[i], qty: next[i].qty + qty };
    } else {
      next = [...items, { ...line, qty }];
    }
    set({ items: next });
    void saveCartItems(next);
    if (!options?.skipToast) {
      showCartToast({
        actionText: 'VIEW',
        onAction: () => {
          router.push('/(app)/cart');
        },
      });
    }
  },

  removeItem: (productId, size, metal) => {
    const next = get().items.filter(
      (x) => !(x.productId === productId && x.size === size && x.metal === metal),
    );
    set({ items: next });
    void saveCartItems(next);
  },

  setLineQty: (productId, size, metal, qty) => {
    let next: CartLine[];
    if (qty < 1) {
      next = get().items.filter(
        (x) => !(x.productId === productId && x.size === size && x.metal === metal),
      );
    } else {
      next = get().items.map((x) =>
        x.productId === productId && x.size === size && x.metal === metal ? { ...x, qty } : x,
      );
    }
    set({ items: next });
    void saveCartItems(next);
  },

  clear: () => {
    set({ items: [] });
    void AsyncStorage.removeItem(GUEST_CART_KEY);
  },
}));
