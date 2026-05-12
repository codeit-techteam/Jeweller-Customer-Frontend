import { boutiqueListingCoverImage, productPrimaryUri } from '@/lib/services/mock/imageUrls';

/** Saved boutique row aligned with GET /api/saved-boutiques (client may enrich `distanceKm`). */
export type SavedBoutique = {
  id: string;
  name: string;
  /** Hero / showroom image */
  image: string | null;
  rating: number;
  reviews: number;
  /** Short area label */
  location: string;
  full_address?: string | null;
  /** Filled on device via Haversine when user + boutique coordinates exist */
  distanceKm: number | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  tags: string[];
  /** Show verified pill */
  verified: boolean;
  /** Product / gallery preview thumbnails */
  previewImages: string[];
  /**
   * Layout variant for gallery row.
   * `triple` = three equal squares; `split` = large + small + “+N ITEMS”.
   */
  galleryLayout: 'triple' | 'split';
  /** Split large tile: true = boutique hero `image`; false = first preview image */
  splitUsesHeroImage: boolean;
  /** Extra items count when layout is split (for +N ITEMS tile) */
  moreItemsCount: number;
  /** Pieces saved in itinerary for this boutique (for summary card) */
  itineraryPieces: number;
  savedAt?: string;
  /** When known, used for live open/closed badge */
  openingTime?: string | null;
  closingTime?: string | null;
  workingDays?: string[];
  openNow?: boolean;
  statusSubLabel?: string;
};

const q = (id: string, w = 400) =>
  `https://images.unsplash.com/${id}?w=${w}&q=85&auto=format&fit=crop`;

export const savedBoutiquesCatalog: SavedBoutique[] = [
  {
    id: 'shyam-boutique',
    name: 'Shyam Boutique',
    image: boutiqueListingCoverImage('shyam-boutique'),
    rating: 4.9,
    reviews: 124,
    location: 'South Extension, Delhi',
    distanceKm: null,
    tags: ['TEMPLE', 'BRIDAL', 'SOLITAIRE'],
    verified: true,
    previewImages: [
      productPrimaryUri('p1', 'RINGS'),
      productPrimaryUri('p5', 'NECKLACES'),
      productPrimaryUri('p13', 'BANGLES'),
    ],
    galleryLayout: 'triple',
    splitUsesHeroImage: true,
    moreItemsCount: 0,
    itineraryPieces: 5,
  },
  {
    id: 'vogue-jewels',
    name: 'Vogue Jewels',
    image: q('photo-1601121141461-9d6647bca1ed', 900),
    rating: 4.7,
    reviews: 89,
    location: 'Connaught Place',
    distanceKm: null,
    tags: ['DIAMONDS', 'CONTEMPORARY'],
    verified: true,
    previewImages: [
      q('photo-1441986300917-64674bd600d8', 600),
      q('photo-1573408304045-c59d01b444f7', 500),
    ],
    galleryLayout: 'split',
    splitUsesHeroImage: true,
    moreItemsCount: 1,
    itineraryPieces: 4,
  },
  {
    id: 'heritage-gems',
    name: 'Heritage Gems & Jewels',
    image: boutiqueListingCoverImage('heritage-gems'),
    rating: 5.0,
    reviews: 52,
    location: 'Karol Bagh, Delhi',
    distanceKm: null,
    tags: ['BRIDAL', 'CUSTOM', 'DIAMONDS'],
    verified: true,
    previewImages: [productPrimaryUri('p7', 'NECKLACES'), productPrimaryUri('p4', 'RINGS')],
    galleryLayout: 'split',
    splitUsesHeroImage: false,
    moreItemsCount: 1,
    itineraryPieces: 3,
  },
];

export const SAVED_BOUTIQUE_SEED_IDS = savedBoutiquesCatalog.map((b) => b.id);

export function getSavedBoutiqueById(id: string): SavedBoutique | undefined {
  return savedBoutiquesCatalog.find((b) => b.id === id);
}
