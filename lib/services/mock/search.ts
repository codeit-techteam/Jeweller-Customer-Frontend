import {
  categoryImageUri,
  productPrimaryUri,
  RING_CATEGORY_ANCHOR,
} from '@/lib/services/mock/imageUrls';

export type SearchSpotlightProduct = {
  id: string;
  title: string;
  description: string;
  price: string;
  imageTint: string;
  /** Product-style Unsplash URI for card */
  imageUri: string;
  boutiqueName?: string | null;
  boutiqueRating?: number | null;
  boutiqueVerified?: boolean;
};

export type TrendingSearchChip = {
  id: string;
  label: string;
  variant: 'default' | 'vday';
};

export type CategoryIconItem = {
  id: string;
  label: string;
  categoryParam: string;
  imageUri: string;
};

export type OccasionCardItem = {
  id: string;
  title: string;
  imageUri: string;
  categoryParam: string;
};

export type RelationshipCardItem = {
  id: string;
  title: string;
  subtitle: string;
  variant: 'light' | 'dark';
  categoryParam: string;
};

export const searchPlaceholder = 'Find your next heirloom...';

export const recentSearches: string[] = ['Gold Bangles', 'Solitaire Rings'];

export const trendingSearches: TrendingSearchChip[] = [
  { id: 'tr1', label: 'V-Day', variant: 'vday' },
  { id: 'tr2', label: "Men's Rings", variant: 'default' },
  { id: 'tr3', label: 'Mangalsutra', variant: 'default' },
];

export const searchSpotlightProducts: SearchSpotlightProduct[] = [
  {
    id: 's1',
    title: 'Ethereal Diamond Band',
    description: 'Diamond band, heirloom finish',
    price: '₹ 2,450',
    imageTint: '#c4a574',
    imageUri: productPrimaryUri('spotlight-s1', 'RINGS'),
  },
  {
    id: 's2',
    title: 'Gilded Horizon Pendant',
    description: 'Gold teardrop pendant',
    price: '₹ 1,890',
    imageTint: '#1a1a1a',
    imageUri: productPrimaryUri('spotlight-s2', 'NECKLACES'),
  },
];

export const shopByCategoryIcons: CategoryIconItem[] = [
  {
    id: 'c1',
    label: 'RINGS',
    categoryParam: 'RINGS',
    imageUri: categoryImageUri('RINGS') ?? RING_CATEGORY_ANCHOR,
  },
  {
    id: 'c2',
    label: 'NECKLACES',
    categoryParam: 'NECKLACES',
    imageUri: categoryImageUri('NECKLACES') ?? RING_CATEGORY_ANCHOR,
  },
  {
    id: 'c3',
    label: 'EARRINGS',
    categoryParam: 'EARRINGS',
    imageUri: categoryImageUri('EARRINGS') ?? RING_CATEGORY_ANCHOR,
  },
];

/** Curated Unsplash refs — search “Shop by Occasion” horizontal cards */
const occasionSearchImage = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?w=900&q=85&auto=format&fit=crop`;

/** Fallback if `shopByOccasion` is ever cleared — keeps the section from rendering empty */
export const shopByOccasionFallback: OccasionCardItem[] = [
  {
    id: 'o1',
    title: 'Wedding',
    imageUri: occasionSearchImage('photo-1606800052052-a08af7148866'),
    categoryParam: 'Wedding',
  },
  {
    id: 'o2',
    title: 'Anniversary',
    imageUri: occasionSearchImage('photo-1617038260897-41a1f14a8ca0'),
    categoryParam: 'Anniversary',
  },
  {
    id: 'o3',
    title: 'Engagement',
    imageUri: occasionSearchImage('photo-1599643478518-a784e5dc4c8f'),
    categoryParam: 'Engagement',
  },
  {
    id: 'o4',
    title: 'Festive',
    imageUri: occasionSearchImage('photo-1627293509201-cd0c780043d3'),
    categoryParam: 'Festive',
  },
];

export const shopByOccasion: OccasionCardItem[] = [
  {
    id: 'o1',
    title: 'Wedding',
    imageUri: occasionSearchImage('photo-1606800052052-a08af7148866'),
    categoryParam: 'Wedding',
  },
  {
    id: 'o2',
    title: 'Anniversary',
    imageUri: occasionSearchImage('photo-1617038260897-41a1f14a8ca0'),
    categoryParam: 'Anniversary',
  },
  {
    id: 'o3',
    title: 'Engagement',
    imageUri: occasionSearchImage('photo-1599643478518-a784e5dc4c8f'),
    categoryParam: 'Engagement',
  },
  {
    id: 'o4',
    title: 'Festive',
    imageUri: occasionSearchImage('photo-1627293509201-cd0c780043d3'),
    categoryParam: 'Festive',
  },
];

export const shopByRelationship: RelationshipCardItem[] = [
  {
    id: 'r1',
    title: 'For Her',
    subtitle: 'CURATED ELEGANCE',
    variant: 'light',
    categoryParam: 'For Her',
  },
  {
    id: 'r2',
    title: 'For Him',
    subtitle: 'REFINED STRENGTH',
    variant: 'light',
    categoryParam: 'For Him',
  },
  {
    id: 'r3',
    title: 'For Kids',
    subtitle: 'WHIMSICAL JOY',
    variant: 'dark',
    categoryParam: 'For Kids',
  },
];
