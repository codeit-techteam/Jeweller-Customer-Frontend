import { create } from "zustand";

export type WishlistToastType = "added" | "removed";

export type ShowWishlistToastPayload = {
  type: WishlistToastType;
  message?: string;
  /** Optional action label, e.g. "VIEW". Falls back to none. */
  actionText?: string;
  /** Tap handler for the action. The toast self-dismisses after this fires. */
  onAction?: (() => void) | null;
};

type State = {
  visible: boolean;
  /** Increments every time `show` is called — drives a fresh enter animation. */
  showId: number;
  type: WishlistToastType;
  message: string;
  actionText?: string;
  onAction: (() => void) | null;
  show: (payload: ShowWishlistToastPayload) => void;
  hide: () => void;
};

const DEFAULT_MESSAGES: Record<WishlistToastType, string> = {
  added: "Added to Wishlist",
  removed: "Removed from Wishlist",
};

export const useWishlistToastStore = create<State>((set, get) => ({
  visible: false,
  showId: 0,
  type: "added",
  message: DEFAULT_MESSAGES.added,
  actionText: undefined,
  onAction: null,

  show: (payload) =>
    set({
      visible: true,
      showId: get().showId + 1,
      type: payload.type,
      message: payload.message ?? DEFAULT_MESSAGES[payload.type],
      actionText: payload.actionText,
      onAction: payload.onAction ?? null,
    }),

  hide: () => set({ visible: false }),
}));

export const showWishlistToast = (payload: ShowWishlistToastPayload) =>
  useWishlistToastStore.getState().show(payload);

export const hideWishlistToast = () =>
  useWishlistToastStore.getState().hide();
