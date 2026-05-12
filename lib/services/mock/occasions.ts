/**
 * Occasion tiles use `OCCASION_CARD_URIS` / `TRENDING_WEDDING_URIS` in `imageUrls.ts` — all `image` fields are HTTPS.
 */
import { OCCASION_CARD_URIS, TRENDING_WEDDING_URIS } from '@/lib/services/mock/imageUrls';

export type OccasionItem = {
  id: string;
  title: string;
  image: string;
  subtitle?: string;
  /** `/(app)/collection/[slug]` */
  collectionSlug: string;
};

export const occasionCollections: OccasionItem[] = [
  {
    id: 'wedding',
    title: 'WEDDING',
    image: OCCASION_CARD_URIS.wedding,
    subtitle: 'Classic Collection',
    collectionSlug: 'wedding',
  },
  {
    id: 'anniversary',
    title: 'ANNIVERSARY',
    image: OCCASION_CARD_URIS.anniversary,
    collectionSlug: 'anniversary',
  },
  {
    id: 'engagement',
    title: 'ENGAGEMENT',
    image: OCCASION_CARD_URIS.engagement,
    collectionSlug: 'engagement',
  },
  {
    id: 'festive',
    title: 'FESTIVE',
    image: OCCASION_CARD_URIS.festive,
    collectionSlug: 'festive',
  },
  {
    id: 'daily-wear',
    title: 'DAILY WEAR',
    image: OCCASION_CARD_URIS['daily-wear'],
    collectionSlug: 'everyday',
  },
  {
    id: 'birthday',
    title: 'BIRTHDAY',
    image: OCCASION_CARD_URIS.birthday,
    collectionSlug: 'birthday',
  },
];

export const trendingInWedding = [
  {
    id: 'aethelgard',
    title: 'Aethelgard Royal Choker',
    price: '₹1,45,000',
    subtitle: '18KT Gold',
    image: TRENDING_WEDDING_URIS.aethelgard,
  },
  {
    id: 'celeste',
    title: 'Celeste Diamond Drops',
    price: '₹89,200',
    subtitle: '22KT Gold',
    image: TRENDING_WEDDING_URIS.celeste,
  },
];
