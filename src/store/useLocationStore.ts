import { create } from 'zustand';

export type LocationOption = {
  id: string;
  label: string;
  subtitle?: string;
};

type LocationState = {
  selectedLocation: LocationOption | null;
  setLocation: (location: LocationOption) => void;
  clearLocation: () => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  selectedLocation: null,
  setLocation: (location) => set({ selectedLocation: location }),
  clearLocation: () => set({ selectedLocation: null }),
}));

