import { create } from "zustand";

export type ShowCartToastPayload = {
  message?: string;
  /** Optional action label, e.g. "VIEW". */
  actionText?: string;
  onAction?: (() => void) | null;
};

type State = {
  visible: boolean;
  showId: number;
  message: string;
  actionText?: string;
  onAction: (() => void) | null;
  show: (payload: ShowCartToastPayload) => void;
  hide: () => void;
};

const DEFAULT_MESSAGE = "Added to Cart";

export const useCartToastStore = create<State>((set, get) => ({
  visible: false,
  showId: 0,
  message: DEFAULT_MESSAGE,
  actionText: undefined,
  onAction: null,

  show: (payload) =>
    set({
      visible: true,
      showId: get().showId + 1,
      message: payload.message ?? DEFAULT_MESSAGE,
      actionText: payload.actionText,
      onAction: payload.onAction ?? null,
    }),

  hide: () => set({ visible: false }),
}));

export const showCartToast = (payload?: ShowCartToastPayload) =>
  useCartToastStore.getState().show(payload ?? {});

export const hideCartToast = () => useCartToastStore.getState().hide();
