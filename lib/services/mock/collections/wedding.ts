/**
 * Wedding Collection — hero + editorial copy. Product data is fetched live
 * from the backend catalog by `CollectionScreen`; no static product arrays
 * live in this module any more.
 */

const q = (photoId: string, w = 800) =>
  `https://images.unsplash.com/${photoId}?w=${w}&q=85&auto=format&fit=crop`;

/** Hero — oval halo ring on silk */
export const WEDDING_HERO_URI = q('photo-1515562141207-7e88fb950be7', 1200);

export const weddingEditorial = {
  image: q('photo-1603561596112-0a132b757442', 1000),
  label: 'EDITORIAL CHOICE',
  title: 'The Majestic Marquise Collection',
  body:
    'A tribute to royal elegance. Our marquise cuts are hand-selected for their brilliance and symmetry, creating an elongated grace that is unparalleled.',
};

export const weddingFooter = {
  title: 'Experience the Radiance',
  body:
    'Every piece in our Wedding Collection is a testament to timeless craftsmanship and the purity of rare stones. We invite you to find the anchor of your forever story.',
};
