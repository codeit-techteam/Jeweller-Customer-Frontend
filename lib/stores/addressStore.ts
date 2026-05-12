import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AddressLabel = 'Home' | 'Office' | 'Other';

export type Address = {
  id: string;
  label: AddressLabel;
  name: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  createdAt: number;
  updatedAt: number;
};

export type AddressInput = Omit<Address, 'id' | 'createdAt' | 'updatedAt'>;

const SEED: Address[] = [
  {
    id: 'seed-home',
    label: 'Home',
    name: 'Sushant Singh',
    phone: '+91 9143668845',
    line1: 'House 12, Golden Avenue',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '100204',
    country: 'India',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'seed-office',
    label: 'Office',
    name: 'Sushant Singh',
    phone: '+91 9143668845',
    line1: 'Tower B, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    country: 'India',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
  },
];

type AddressState = {
  addresses: Address[];
  defaultId: string | null;

  addAddress: (input: AddressInput, opts?: { makeDefault?: boolean }) => string;
  updateAddress: (id: string, patch: Partial<AddressInput>) => void;
  deleteAddress: (id: string) => void;
  setDefault: (id: string) => void;
  getAddressById: (id: string) => Address | undefined;
};

const makeId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const formatAddressLines = (a: Address): string =>
  `${a.line1}\n${[a.city, a.pincode].filter(Boolean).join(', ')}${
    a.country ? ` · ${a.country}` : ''
  }`;

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: SEED,
      defaultId: 'seed-home',

      addAddress: (input, opts) => {
        const now = Date.now();
        const id = makeId();
        const next: Address = { ...input, id, createdAt: now, updatedAt: now };
        const prev = get();
        const shouldMakeDefault =
          opts?.makeDefault || prev.addresses.length === 0 || !prev.defaultId;
        set({
          addresses: [next, ...prev.addresses],
          defaultId: shouldMakeDefault ? id : prev.defaultId,
        });
        return id;
      },

      updateAddress: (id, patch) =>
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
          ),
        })),

      deleteAddress: (id) =>
        set((state) => {
          const addresses = state.addresses.filter((a) => a.id !== id);
          let defaultId = state.defaultId;
          if (defaultId === id) {
            defaultId = addresses[0]?.id ?? null;
          }
          return { addresses, defaultId };
        }),

      setDefault: (id) =>
        set((state) => {
          if (!state.addresses.some((a) => a.id === id)) return state;
          return { defaultId: id };
        }),

      getAddressById: (id) => get().addresses.find((a) => a.id === id),
    }),
    {
      name: 'address-book',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        addresses: state.addresses,
        defaultId: state.defaultId,
      }),
    },
  ),
);

export { formatAddressLines };
