import { create } from 'zustand';

export type PopupType = 'success' | 'error' | 'confirm' | 'info';

export type ShowPopupPayload = {
  type?: PopupType;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /**
   * Auto close. Pass `true` for the default (2000ms on success), or a custom
   * duration in ms. Ignored for `confirm` popups.
   */
  autoDismiss?: boolean | number;
  onConfirm?: (() => void | Promise<void>) | null;
  onCancel?: (() => void) | null;
};

type PopupState = Required<
  Omit<ShowPopupPayload, 'autoDismiss' | 'onConfirm' | 'onCancel'>
> & {
  visible: boolean;
  autoDismiss?: boolean | number;
  onConfirm: (() => void | Promise<void>) | null;
  onCancel: (() => void) | null;
  showPopup: (payload: ShowPopupPayload) => void;
  hidePopup: () => void;
};

const DEFAULTS = {
  type: 'info' as PopupType,
  title: '',
  message: '',
  confirmLabel: '',
  cancelLabel: '',
  destructive: false,
  autoDismiss: undefined as boolean | number | undefined,
  onConfirm: null as PopupState['onConfirm'],
  onCancel: null as PopupState['onCancel'],
};

export const usePopupStore = create<PopupState>((set) => ({
  visible: false,
  ...DEFAULTS,
  showPopup: (payload) =>
    set({
      ...DEFAULTS,
      ...payload,
      visible: true,
    }),
  hidePopup: () => set({ visible: false }),
}));

/** Convenience helper so call sites stay tiny. */
export const showPopup = (payload: ShowPopupPayload) =>
  usePopupStore.getState().showPopup(payload);

export const hidePopup = () => usePopupStore.getState().hidePopup();
