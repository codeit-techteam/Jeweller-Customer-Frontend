import AsyncStorage from '@react-native-async-storage/async-storage';

export const RECENT_KEY = 'RECENTLY_VIEWED';

const MAX_BOUTIQUES = 10;
const MAX_PRODUCTS_PER_BOUTIQUE = 5;

/** Persisted product line */
export type StoredRecentProduct = {
  id: string;
  name: string;
  image: string;
  price: number;
  viewedAt: number;
};

/** Persisted boutique group */
export type StoredRecentBoutique = {
  id: string;
  name: string;
  image: string;
  location: string;
  lastVisited: number;
  products: StoredRecentProduct[];
};

export type RecentlyViewedPayload = {
  boutiques: StoredRecentBoutique[];
};

function parsePayload(raw: string | null): RecentlyViewedPayload {
  if (raw == null) return { boutiques: [] };
  try {
    const data = JSON.parse(raw) as RecentlyViewedPayload;
    if (!data || !Array.isArray(data.boutiques)) return { boutiques: [] };
    return data;
  } catch {
    return { boutiques: [] };
  }
}

export type TrackBoutiqueInput = {
  id: string;
  name: string;
  image: string;
  location: string;
};

export type TrackProductInput = {
  id: string;
  name: string;
  image: string;
  price: number;
};

export async function trackProductView(
  boutique: TrackBoutiqueInput,
  product: TrackProductInput,
): Promise<void> {
  const data = parsePayload(await AsyncStorage.getItem(RECENT_KEY));

  let boutiqueIndex = data.boutiques.findIndex((b) => b.id === boutique.id);

  if (boutiqueIndex === -1) {
    data.boutiques.unshift({
      ...boutique,
      lastVisited: Date.now(),
      products: [],
    });
    boutiqueIndex = 0;
  }

  const boutiqueData = data.boutiques[boutiqueIndex];
  boutiqueData.lastVisited = Date.now();
  boutiqueData.name = boutique.name;
  boutiqueData.image = boutique.image;
  boutiqueData.location = boutique.location;

  boutiqueData.products = boutiqueData.products.filter((p) => p.id !== product.id);
  boutiqueData.products.unshift({
    ...product,
    viewedAt: Date.now(),
  });
  boutiqueData.products = boutiqueData.products.slice(0, MAX_PRODUCTS_PER_BOUTIQUE);

  data.boutiques.splice(boutiqueIndex, 1);
  data.boutiques.unshift(boutiqueData);
  data.boutiques = data.boutiques.slice(0, MAX_BOUTIQUES);

  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(data));
}

export async function trackBoutiqueVisit(boutique: TrackBoutiqueInput): Promise<void> {
  const data = parsePayload(await AsyncStorage.getItem(RECENT_KEY));
  const idx = data.boutiques.findIndex((b) => b.id === boutique.id);
  const now = Date.now();

  if (idx === -1) {
    data.boutiques.unshift({
      ...boutique,
      lastVisited: now,
      products: [],
    });
  } else {
    const existing = data.boutiques[idx];
    existing.lastVisited = now;
    existing.name = boutique.name;
    existing.image = boutique.image;
    existing.location = boutique.location;
    data.boutiques.splice(idx, 1);
    data.boutiques.unshift(existing);
  }

  data.boutiques = data.boutiques.slice(0, MAX_BOUTIQUES);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(data));
}

export async function getRecentlyViewed(): Promise<StoredRecentBoutique[]> {
  const data = parsePayload(await AsyncStorage.getItem(RECENT_KEY));
  return data.boutiques;
}

export async function clearRecentlyViewed(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_KEY);
}

export async function removeRecentBoutique(boutiqueId: string): Promise<void> {
  const data = parsePayload(await AsyncStorage.getItem(RECENT_KEY));
  data.boutiques = data.boutiques.filter((b) => b.id !== boutiqueId);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(data));
}
