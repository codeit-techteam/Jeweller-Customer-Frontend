import { router } from "expo-router";
import { create } from "zustand";

import { showCartToast } from "@/lib/stores/cartToastStore";

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
  addItem: (line: Omit<CartLine, 'qty'> & { qty?: number }) => void;
  removeItem: (productId: string, size: string, metal: string) => void;
  setLineQty: (productId: string, size: string, metal: string, qty: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (line) => {
    const qty = line.qty ?? 1;
    const items = get().items;
    const i = items.findIndex((x) => x.productId === line.productId && x.size === line.size && x.metal === line.metal);
    if (i >= 0) {
      const next = [...items];
      next[i] = { ...next[i], qty: next[i].qty + qty };
      set({ items: next });
    } else {
      set({ items: [...items, { ...line, qty }] });
    }
    showCartToast({
      actionText: "VIEW",
      onAction: () => {
        router.push("/(app)/cart");
      },
    });
  },
  removeItem: (productId, size, metal) =>
    set({ items: get().items.filter((x) => !(x.productId === productId && x.size === size && x.metal === metal)) }),
  setLineQty: (productId, size, metal, qty) => {
    if (qty < 1) {
      set({ items: get().items.filter((x) => !(x.productId === productId && x.size === size && x.metal === metal)) });
      return;
    }
    set({
      items: get().items.map((x) =>
        x.productId === productId && x.size === size && x.metal === metal ? { ...x, qty } : x,
      ),
    });
  },
  clear: () => set({ items: [] }),
}));
