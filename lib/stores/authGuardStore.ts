import { create } from 'zustand';

import type { PendingAction } from '@/lib/types/pendingAction';

type AuthGuardState = {
  visible: boolean;
  pendingAction: PendingAction | null;
  openLoginModal: (pendingAction?: PendingAction) => void;
  closeLoginModal: () => void;
  consumePendingAction: () => PendingAction | null;
  clearPendingAction: () => void;
};

export const useAuthGuardStore = create<AuthGuardState>((set, get) => ({
  visible: false,
  pendingAction: null,

  openLoginModal: (pendingAction) =>
    set((s) => ({
      visible: true,
      pendingAction: pendingAction ?? s.pendingAction,
    })),

  closeLoginModal: () => set({ visible: false }),

  consumePendingAction: () => {
    const action = get().pendingAction;
    set({ pendingAction: null, visible: false });
    return action;
  },

  clearPendingAction: () => set({ pendingAction: null }),
}));
