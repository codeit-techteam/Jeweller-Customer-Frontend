/**
 * Menu-driven collections (Women / Men / Kids / Offers / Gifts).
 *
 * Only carries presentation copy — hero, editorial, and footer text per slug.
 * Actual product listings come from the live backend catalog via
 * `productCatalog.ts`, keyed by the slug. This guarantees every
 * "Shop for" entry reflects the latest admin updates and never falls back
 * to mock products.
 */

import type {
  CollectionScreenConfig,
  EditorialBlock,
  FooterBlock,
} from '@/lib/services/mock/collections/collectionScreenConfig';

const q = (photoId: string, w = 900) =>
  `https://images.unsplash.com/${photoId}?w=${w}&q=85&auto=format&fit=crop`;

/* ------------------------------------------------------------------ */
/* hero / editorial / footer copy per slug                            */
/* ------------------------------------------------------------------ */

type MenuCollectionCopy = Pick<
  CollectionScreenConfig,
  'navTitle' | 'heroUri' | 'heroLabel' | 'heroTitle' | 'heroSubtitle'
> & {
  editorial: EditorialBlock;
  footer: FooterBlock;
};

const WOMEN_COPY: MenuCollectionCopy = {
  navTitle: 'Women Collection',
  heroUri: q('photo-1596944924616-7b38e7cfac36', 1400),
  heroLabel: 'FOR HER',
  heroTitle: 'Designed to Radiate.',
  heroSubtitle:
    'From everyday essentials to bridal statements — jewels that move with her story.',
  editorial: {
    image: q('photo-1611591437281-460bfbe1220a', 1000),
    label: 'EDITORIAL EDIT',
    title: 'The Modern Muse',
    body:
      'Sculpted silhouettes and heritage craft, reimagined for the women who shape their own legacy.',
  },
  footer: {
    title: 'Her Everyday Luxury',
    body:
      'Hand-finished pieces backed by LUXE & CO assurance — certified stones, transparent pricing, and artistry that lasts generations.',
  },
};

const MEN_COPY: MenuCollectionCopy = {
  navTitle: 'Men Collection',
  heroUri: q('photo-1617038260897-41a1f14a8ca0', 1400),
  heroLabel: 'FOR HIM',
  heroTitle: 'Understated Power.',
  heroSubtitle:
    'Signet rings, sovereign chains and heritage kadas — built with weight, wearing with presence.',
  editorial: {
    image: q('photo-1605100804763-247f67b3557e', 1000),
    label: 'THE GENTLEMAN EDIT',
    title: 'Weight That Speaks',
    body:
      'Hand-forged metal and quiet detailing — jewellery that holds its own without raising its voice.',
  },
  footer: {
    title: 'Built for the Long Run',
    body:
      'Solid craftsmanship, tested hallmarks, and silhouettes that age into heirlooms — designed to be worn, every day.',
  },
};

const KIDS_COPY: MenuCollectionCopy = {
  navTitle: 'Kids & Infants Collection',
  heroUri: q('photo-1620336655055-b57986f6e9e2', 1400),
  heroLabel: 'FOR THE LITTLE ONES',
  heroTitle: 'Tiny Heirlooms.',
  heroSubtitle:
    'Soft finishes, safe clasps, and gentle gold — keepsakes that grow with them.',
  editorial: {
    image: q('photo-1611658471626-53b62d81650a', 1000),
    label: 'FIRST TREASURES',
    title: 'Little Hearts, Lasting Gold',
    body:
      'Rounded edges, smooth polish, and skin-kind alloys — every piece is tested for the smallest wearers.',
  },
  footer: {
    title: 'Their First Keepsake',
    body:
      'Birthday charms, annaprashan sets, and blessings to wear — gift gold that starts a story.',
  },
};

const OFFERS_COPY: MenuCollectionCopy = {
  navTitle: 'Best Offers',
  heroUri: q('photo-1588444650733-d2c8a2eac3c5', 1400),
  heroLabel: 'LIMITED TIME',
  heroTitle: 'Signature Pieces, Softer Prices.',
  heroSubtitle:
    'Curated offers across diamond studios, gold chains, and everyday essentials — only while stocks last.',
  editorial: {
    image: q('photo-1603561596112-0a132b757442', 1000),
    label: 'STUDIO EDIT',
    title: 'The Insider’s Edit',
    body:
      'Hand-picked bestsellers at studio-access pricing — the same craftsmanship, fewer compromises.',
  },
  footer: {
    title: 'Shop Before They’re Gone',
    body:
      'Every piece on offer carries the full LUXE & CO guarantee — BIS hallmarks, lifetime exchange, and certified diamonds.',
  },
};

const GIFTS_COPY: MenuCollectionCopy = {
  navTitle: 'Gift Collection',
  heroUri: q('photo-1602751584552-8ba73aad10e1', 1400),
  heroLabel: 'GIFTING EDIT',
  heroTitle: 'Ready to Give.',
  heroSubtitle:
    'Boxed beautifully, carried thoughtfully — pieces that do the talking when you can’t find the words.',
  editorial: {
    image: q('photo-1515562141207-7e88fb950be7', 1000),
    label: 'WRAPPED WITH CARE',
    title: 'The Gifting Studio',
    body:
      'Personalised engravings, signature boxes, and same-day dispatch — from our hands to theirs.',
  },
  footer: {
    title: 'A Gift That Stays',
    body:
      'Every LUXE & CO gift arrives in a signature case with a certificate — because the moment deserves to be remembered.',
  },
};

/* ------------------------------------------------------------------ */
/* exported registry                                                  */
/* ------------------------------------------------------------------ */

export type MenuCollectionSlug = 'women' | 'men' | 'kids' | 'offers' | 'gifts';

const MENU_COLLECTIONS: Record<MenuCollectionSlug, MenuCollectionCopy> = {
  women: WOMEN_COPY,
  men: MEN_COPY,
  kids: KIDS_COPY,
  offers: OFFERS_COPY,
  gifts: GIFTS_COPY,
};

export function isMenuCollectionSlug(slug: string): slug is MenuCollectionSlug {
  return slug in MENU_COLLECTIONS;
}

/**
 * Build a `CollectionScreenConfig` for a menu-driven slug — copy only.
 * Product data is fetched live by `CollectionScreen` using the slug.
 */
export function menuCollectionConfig(
  slug: MenuCollectionSlug,
): CollectionScreenConfig {
  const entry = MENU_COLLECTIONS[slug];
  const { editorial, footer, ...copy } = entry;
  return {
    ...copy,
    editorial,
    footer,
  };
}
