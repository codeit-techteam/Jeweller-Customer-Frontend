import {
  WEDDING_HERO_URI,
  weddingEditorial,
  weddingFooter,
} from '@/lib/services/mock/collections/wedding';
import { COLLECTION_HERO_URIS } from '@/lib/services/mock/imageUrls';
import {
  isMenuCollectionSlug,
  menuCollectionConfig,
} from '@/lib/services/mock/collections/menuCollections';

export type EditorialBlock = {
  image: string;
  label: string;
  title: string;
  body: string;
};

export type FooterBlock = {
  title: string;
  body: string;
};

/**
 * Static presentation copy for a marketing collection.
 * Product data is NOT carried here — it is pulled live from the centralized
 * product catalog by `CollectionScreen` using the slug.
 */
export type CollectionScreenConfig = {
  navTitle: string;
  heroUri: string;
  heroLabel: string;
  heroTitle: string;
  heroSubtitle: string;
  editorial: EditorialBlock;
  footer: FooterBlock;
};

const weddingConfig: CollectionScreenConfig = {
  navTitle: 'Wedding Collection',
  heroUri: WEDDING_HERO_URI,
  heroLabel: 'THE ETERNAL UNION',
  heroTitle: 'Curated For Forever.',
  heroSubtitle:
    'Discover a masterpiece of editorial craftsmanship, where every diamond tells a story of devotion.',
  editorial: weddingEditorial,
  footer: weddingFooter,
};

const anniversaryEditorial: EditorialBlock = {
  image: COLLECTION_HERO_URIS.anniversary,
  label: 'EDITORIAL CHOICE',
  title: 'The Golden Milestone Edit',
  body:
    'Celebrate years of togetherness with pieces designed to honour enduring love — from classic bands to radiant diamond stories.',
};

const anniversaryFooter: FooterBlock = {
  title: 'Celebrate Every Chapter',
  body:
    'Our Anniversary Collection brings together heirloom-worthy craftsmanship and contemporary silhouettes, perfect for marking life’s most precious milestones.',
};

const anniversaryConfig: CollectionScreenConfig = {
  navTitle: 'Anniversary Collection',
  heroUri: COLLECTION_HERO_URIS.anniversary,
  heroLabel: 'TIMELESS TOGETHER',
  heroTitle: 'Honouring Your Journey.',
  heroSubtitle:
    'From first anniversaries to golden jubilees — discover jewels that echo the warmth of shared memories.',
  editorial: anniversaryEditorial,
  footer: anniversaryFooter,
};

/** Slugs with full editorial layouts */
const FULL: Record<string, CollectionScreenConfig> = {
  wedding: weddingConfig,
  anniversary: anniversaryConfig,
};

function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Generic collection: reuse wedding product grid + festive / custom hero when available */
function genericConfig(slug: string): CollectionScreenConfig {
  const heroUri =
    slug === 'festive' || slug === 'heritage-bridal'
      ? COLLECTION_HERO_URIS.festive
      : COLLECTION_HERO_URIS.wedding;
  const navTitle = `${titleCaseSlug(slug)} Collection`;
  const editorial: EditorialBlock = {
    image: heroUri,
    label: 'CURATED EDIT',
    title: 'Discover the Range',
    body:
      'Handpicked pieces from our master jewellers — blending heritage techniques with a modern eye for everyday luxury.',
  };
  const footer: FooterBlock = {
    title: 'Crafted for You',
    body:
      'Every design in this edit reflects the LUXE & CO promise: certified stones, transparent pricing, and artistry you can feel.',
  };
  return {
    navTitle,
    heroUri,
    heroLabel: 'THE LUXE EDIT',
    heroTitle: 'Jewellery That Speaks to You.',
    heroSubtitle:
      'Explore this capsule of signature silhouettes — perfect for building a collection that grows with your story.',
    editorial,
    footer,
  };
}

export function getCollectionScreenConfig(slug: string): CollectionScreenConfig {
  const key = slug.trim().toLowerCase();
  if (FULL[key]) return FULL[key];
  if (isMenuCollectionSlug(key)) return menuCollectionConfig(key);
  return genericConfig(key);
}

/** “Explore collection” → `category-products` (category filter + header title per marketing slug). */
export function getEditorialExploreTarget(
  slug: string,
  navTitle: string,
): { category: string; title: string } {
  const s = slug.trim().toLowerCase();
  const map: Record<string, { category: string; title?: string }> = {
    wedding: { category: 'RINGS', title: 'Wedding Collection' },
    anniversary: { category: 'RINGS', title: 'Anniversary Collection' },
    engagement: { category: 'RINGS', title: 'Engagement Collection' },
    festive: { category: 'NECKLACES', title: 'Festive Collection' },
    'heritage-bridal': { category: 'NECKLACES', title: 'Heritage Bridal Collection' },
    'daily-wear': { category: 'ALL', title: 'Daily Wear Collection' },
    birthday: { category: 'ALL', title: 'Birthday Collection' },
    women: { category: 'ALL', title: 'Women Collection' },
    men: { category: "MEN'S RINGS", title: 'Men Collection' },
    kids: { category: 'ALL', title: 'Kids & Infants Collection' },
    offers: { category: 'ALL', title: 'Best Offers' },
    gifts: { category: 'ALL', title: 'Gift Collection' },
  };
  const hit = map[s];
  if (hit) {
    return { category: hit.category, title: hit.title ?? navTitle };
  }
  return { category: 'ALL', title: navTitle };
}
