import { formatDistanceToNow } from 'date-fns';

import { getBoutiqueHoursStatus } from '@/lib/boutiques/boutiqueUi';
import allBoutiques, { getBoutiqueProfileForId } from '@/lib/services/mock/boutiques';
import { boutiqueListingCoverImage, productPrimaryUri, tintFor } from '@/lib/services/mock/imageUrls';
import { getProductById } from '@/lib/services/mock/products';
import type { SearchSpotlightProduct } from '@/lib/services/mock/search';
import type { StoredRecentBoutique } from '@/lib/services/recentlyViewedStorage';

/** Single product line item (history) */
export type RecentProductItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  rating?: number;
};

/** Boutique group: recently viewed products clustered by store */
export type RecentlyViewedBoutique = {
  id: string;
  boutiqueId: string;
  name: string;
  heroImage: string;
  rating: number;
  reviews: number;
  location: string;
  /** Real Haversine km when user location + boutique coords exist; else null. */
  distanceKm: number | null;
  tags: string[];
  verified: boolean;
  openNow: boolean;
  /** "Closes at …" / "Opens at …" when hours are known */
  statusSubLabel?: string;
  openingTime?: string | null;
  closingTime?: string | null;
  viewedCount: number;
  /** e.g. "You viewed 5 products here recently" */
  contextText: string;
  /** For sorting "Recently Viewed" tab */
  lastViewedAt: number;
  products: RecentProductItem[];
  /** Extra items beyond visible thumbnails (+N) */
  moreCount: number;
  phone?: string | null;
  whatsapp?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function toSpotlightProduct(p: RecentProductItem): SearchSpotlightProduct {
  return {
    id: p.id,
    title: p.name,
    description: p.category ?? '',
    price: `₹ ${p.price.toLocaleString('en-IN')}`,
    imageTint: tintFor(p.id, 0),
    imageUri: p.image,
  };
}

const now = Date.now();
const day = 86400000;

export const recentlyViewedMock: RecentlyViewedBoutique[] = [
  {
    id: 'rv-1',
    boutiqueId: 'zoya-tata',
    name: 'Zoya - A Tata Product',
    heroImage: boutiqueListingCoverImage('zoya-tata'),
    rating: 4.9,
    reviews: 240,
    location: 'Bandra West, Mumbai',
    distanceKm: null,
    tags: ['BRIDAL', 'CUSTOM DESIGN'],
    verified: true,
    openNow: true,
    statusSubLabel: 'Closes at 8:00 PM',
    openingTime: '10:00',
    closingTime: '20:00',
    viewedCount: 5,
    contextText: 'You viewed 5 products here recently',
    lastViewedAt: now - 2 * day,
    products: [
      {
        id: 'p1',
        name: 'Heritage Solitaire Ring',
        price: 125000,
        image: productPrimaryUri('p1', 'RINGS'),
        category: 'RINGS',
        rating: 4.8,
      },
      {
        id: 'p5',
        name: 'Blue Sapphire Drop',
        price: 89500,
        image: productPrimaryUri('p5', 'NECKLACES'),
        category: 'NECKLACES',
      },
      {
        id: 'p9',
        name: 'Chandelier Earrings',
        price: 156000,
        image: productPrimaryUri('p9', 'EARRINGS'),
        category: 'EARRINGS',
      },
    ],
    moreCount: 2,
  },
  {
    id: 'rv-2',
    boutiqueId: 'hazoorilal-legacy',
    name: 'Hazoorilal Legacy',
    heroImage: boutiqueListingCoverImage('hazoorilal-legacy'),
    rating: 4.8,
    reviews: 185,
    location: 'Greater Kailash, Delhi',
    distanceKm: null,
    tags: ['POLKI', 'TEMPLE JEWELRY'],
    verified: true,
    openNow: true,
    viewedCount: 3,
    contextText: 'You viewed 3 products here last week',
    lastViewedAt: now - 5 * day,
    products: [
      {
        id: 'p13',
        name: 'Kada Set',
        price: 98000,
        image: productPrimaryUri('p13', 'BANGLES'),
        category: 'BANGLES',
      },
      {
        id: 'p7',
        name: 'Choker Heritage',
        price: 210000,
        image: productPrimaryUri('p7', 'NECKLACES'),
        category: 'NECKLACES',
      },
      {
        id: 'p11',
        name: 'Temple Jhumkas',
        price: 67000,
        image: productPrimaryUri('p11', 'EARRINGS'),
        category: 'EARRINGS',
      },
    ],
    moreCount: 0,
  },
];

export function getRecentlyViewedSeed(): RecentlyViewedBoutique[] {
  return recentlyViewedMock.map((b) => ({ ...b }));
}

/** Merge AsyncStorage payload with catalog data for the existing Recently Viewed UI. */
export function mapStoredBoutiquesToRecentlyViewed(
  stored: StoredRecentBoutique[],
): RecentlyViewedBoutique[] {
  return stored.map((b) => {
    const profile = getBoutiqueProfileForId(b.id);
    const listing = allBoutiques.find((x) => x.id === b.id);
    const heroImage =
      b.image ||
      profile?.banners.find((ban) => ban.uri)?.uri ||
      boutiqueListingCoverImage(b.id);

    const products: RecentProductItem[] = b.products.map((p) => {
      const detail = getProductById(p.id);
      const cat = detail?.category ?? 'RINGS';
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image || detail?.images[0]?.uri || productPrimaryUri(p.id, cat),
        category: detail?.category,
        rating: detail?.rating,
      };
    });

    const viewedCount = products.length;
    const lastViewedAt = b.lastVisited;
    const timeAgo = formatDistanceToNow(new Date(lastViewedAt), { addSuffix: true });
    const contextText =
      viewedCount > 0
        ? `You viewed ${viewedCount} product${viewedCount === 1 ? '' : 's'} here · ${timeAgo}`
        : `Visited · ${timeAgo}`;

    const tags =
      listing?.tags?.slice(0, 3) ??
      (profile ? [profile.trustedTag, 'JEWELLERY'] : ['BOUTIQUE']);

    const hours = getBoutiqueHoursStatus(
      profile?.openingTime ?? null,
      profile?.closingTime ?? null,
      profile?.workingDays ?? [],
    );
    const hasHours = Boolean(profile?.openingTime && profile?.closingTime);
    const openNow = hasHours
      ? hours.openNow
      : (profile?.openNow ?? /open/i.test(listing?.status ?? ''));

    return {
      id: b.id,
      boutiqueId: b.id,
      name: b.name,
      heroImage,
      rating: profile?.rating ?? listing?.rating ?? 0,
      reviews: profile?.reviewCount ?? 0,
      location: b.location,
      distanceKm: null,
      tags,
      verified: (profile?.rating ?? listing?.rating ?? 0) >= 4.5,
      openNow,
      statusSubLabel: hasHours
        ? (profile?.statusSubLabel ?? hours.statusSubLabel)
        : (profile?.statusSubLabel ?? ''),
      openingTime: profile?.openingTime ?? null,
      closingTime: profile?.closingTime ?? null,
      viewedCount,
      contextText,
      lastViewedAt,
      products,
      moreCount: Math.max(0, products.length - 3),
      phone: profile?.phone?.trim() || null,
      whatsapp: profile?.whatsapp?.trim() || null,
      latitude: profile?.coordinates?.lat ?? null,
      longitude: profile?.coordinates?.lng ?? null,
    };
  });
}
