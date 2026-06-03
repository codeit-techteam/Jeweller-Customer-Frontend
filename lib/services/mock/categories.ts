import {
  CATEGORY_HOME_IMAGE,
  COLLECTION_HERO_URIS,
  RING_CATEGORY_ANCHOR,
  categoryImageUri,
} from '@/lib/services/mock/imageUrls';

/** Explicit `image` map for each category label (same as `CATEGORY_HOME_IMAGE` in `imageUrls`). */
export { CATEGORY_HOME_IMAGE as categoryImages };

export const categories = [
  'RINGS',
  'NECKLACES',
  'EARRINGS',
  'BANGLES',
  'PENDANTS',
  'BRACELETS',
  'NOSE PINS',
  'COINS',
  'SOLITAIRES',
  'MANGALSUTRAS',
  'GOLD COINS',
  "MEN'S RINGS",
] as const;

export type TrendingCollectionItem = {
  title: string;
  subtitle: string;
  /** Hero image for card */
  image: string;
  /** Route key for `/(app)/collection/[slug]` */
  slug: string;
};

export const trendingCollections: TrendingCollectionItem[] = [
  {
    title: 'Wedding Collection',
    subtitle: 'Curated For Forever',
    image: COLLECTION_HERO_URIS.wedding,
    slug: 'wedding',
  },
  {
    title: 'The Heritage Bridal Series',
    subtitle: 'Curated by top designers',
    image: COLLECTION_HERO_URIS.festive,
    slug: 'heritage-bridal',
  },
  {
    title: 'Everyday Eleg...',
    subtitle: '14k Gold...',
    image: categoryImageUri('RINGS') ?? RING_CATEGORY_ANCHOR,
    slug: 'everyday',
  },
];
