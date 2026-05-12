/**
 * Listing + profile data. Every `Boutique.image` is a valid Unsplash/showroom URL via `boutiqueListingCoverImage`.
 */
export type Boutique = {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  distanceKm: number;
  tag: string;
  tags: string[];
  status: string;
  description: string;
  /** Featured card social proof line */
  weeklyVisits?: number;
  highlightSuffix?: string;
};

/** Tab keys for boutique profile product grid */
export type BoutiqueProfileTab = "all" | "rings" | "wedding" | "men";

import {
  buildCollectionTabsFromProducts,
  type BoutiqueProductItemUi,
  type BoutiqueProfileViewModel,
} from "@/lib/boutiques/boutiqueUi";
import { categoryProducts } from "@/lib/services/mock/categoryProducts";
import {
  BOUTIQUE_BANNER_URIS,
  boutiqueListingCoverImage,
  productPrimaryUri,
} from "@/lib/services/mock/imageUrls";

export type BoutiqueProductItem = BoutiqueProductItemUi;
export type BoutiqueProfile = BoutiqueProfileViewModel;

function withProductImages(
  items: (Omit<BoutiqueProductItemUi, "imageUri" | "categoryLabel"> & {
    categoryLabel?: string;
  })[],
): BoutiqueProductItemUi[] {
  return items.map((item) => ({
    ...item,
    categoryLabel: item.categoryLabel ?? item.tag,
    imageUri: productPrimaryUri(
      item.id,
      categoryProducts.find((c) => c.id === item.id)?.category ?? "RINGS",
    ),
  }));
}

const shyamProducts = withProductImages([
  {
    id: "p1",
    name: "Eternal Solitaire",
    price: 125000,
    tag: "WEDDING",
    imageTint: "#d4c4a8",
    collection: "wedding",
  },
  {
    id: "p5",
    name: "Blue Sapphire Drop",
    price: 89500,
    tag: "SIGNATURE",
    imageTint: "#1a2744",
    collection: "other",
  },
  {
    id: "p13",
    name: "Veda Gold Bangles",
    price: 420000,
    tag: "TRADITIONAL",
    imageTint: "#c9a227",
    collection: "wedding",
  },
  {
    id: "p16",
    name: "Classic Heritage Watch",
    price: 158000,
    tag: "MEN'S WEAR",
    imageTint: "#2c2416",
    collection: "men",
  },
  {
    id: "p3",
    name: "Contemporary Stack Ring",
    price: 22000,
    tag: "SIGNATURE",
    imageTint: "#e8d5c8",
    collection: "rings",
  },
  {
    id: "p7",
    name: "Choker Heritage",
    price: 210000,
    tag: "WEDDING",
    imageTint: "#8b6914",
    collection: "wedding",
  },
]);

const shyamProfile: BoutiqueProfile = {
  id: "shyam-boutique",
  name: "Shyam Boutique",
  rating: 4.9,
  reviewCount: 186,
  location: "South Extension, Delhi",
  shortLocation: "NCR, Delhi",
  description:
    "Experience unparalleled craftsmanship and a heritage of luxury. Our Mayfair boutique offers a curated selection of the world's finest gemstones and bespoke designs crafted for your most precious moments. Every piece tells a story of elegance and timeless beauty.",
  trustedTag: "TRUSTED",
  banners: [
    { tint: "#3d3428", uri: BOUTIQUE_BANNER_URIS[0] },
    { tint: "#c4b28f", uri: BOUTIQUE_BANNER_URIS[1] },
    { tint: "#1e2936", uri: BOUTIQUE_BANNER_URIS[2] },
  ],
  openNow: true,
  hoursLabel: "Opens 10:30 - 6:00",
  logoTint: "#e8dcc8",
  logoCaption: "LUXORA",
  logoSubtitle: "BOUTIQUE",
  logoUrl: null,
  products: shyamProducts,
  collections: buildCollectionTabsFromProducts(shyamProducts, []),
  openingTime: null,
  closingTime: null,
  workingDays: [],
  statusSubLabel: "",
  coordinates: null,
  phone: "",
  whatsapp: "",
  mapsQuery: "South+Extension+Delhi+jewellery",
  contactAddress:
    "M-44, Greater Kailash II, South Extension Part II, New Delhi, Delhi 110049",
};

const heritageProducts = shyamProducts.slice(0, 4);

const heritageProfile: BoutiqueProfile = {
  id: "heritage-gems",
  name: "Heritage Gems & Jewels",
  rating: 4.8,
  reviewCount: 142,
  location: "Karol Bagh, Delhi",
  shortLocation: "Karol Bagh",
  description:
    "Experience curated bridal collections and signature designs where heritage craftsmanship meets modern luxury. Every piece tells a story of elegance and timeless beauty.",
  trustedTag: "PREMIER",
  banners: [
    { tint: "#5c4a3a", uri: BOUTIQUE_BANNER_URIS[1] },
    { tint: "#8b7355", uri: BOUTIQUE_BANNER_URIS[2] },
  ],
  openNow: true,
  hoursLabel: "Opens 11:00 - 7:00",
  logoTint: "#d4c4a8",
  logoCaption: "HERITAGE",
  logoUrl: null,
  products: heritageProducts,
  collections: buildCollectionTabsFromProducts(heritageProducts, []),
  openingTime: null,
  closingTime: null,
  workingDays: [],
  statusSubLabel: "",
  coordinates: null,
  phone: "",
  whatsapp: "",
  mapsQuery: "Karol+Bagh+Delhi+jewellery",
  contactAddress: "15A, Bank Street, Karol Bagh, New Delhi, Delhi 110005",
};

const auroraProducts = shyamProducts.filter((_, i) => i % 2 === 0).slice(0, 4);

const auroraProfile: BoutiqueProfile = {
  id: "aurora-contemporary",
  name: "Aurora Contemporary",
  rating: 4.9,
  reviewCount: 98,
  location: "Rajouri Garden, Delhi",
  shortLocation: "Rajouri Garden",
  description:
    "Known for sleek, contemporary silhouettes and refined detailing, Aurora is the destination for modern classics crafted for your most precious moments.",
  trustedTag: "CURATED",
  banners: [
    { tint: "#e8ecf2", uri: BOUTIQUE_BANNER_URIS[0] },
    { tint: "#b8c5d6", uri: BOUTIQUE_BANNER_URIS[2] },
  ],
  openNow: false,
  hoursLabel: "Opens 10:00 - 8:00",
  logoTint: "#dce4ec",
  logoCaption: "AURORA",
  logoUrl: null,
  products: auroraProducts,
  collections: buildCollectionTabsFromProducts(auroraProducts, []),
  openingTime: null,
  closingTime: null,
  workingDays: [],
  statusSubLabel: "",
  coordinates: null,
  phone: "",
  whatsapp: "",
  mapsQuery: "Rajouri+Garden+Delhi+jewellery",
  contactAddress:
    "Shop 12, Pacific Mall, Rajouri Garden, New Delhi, Delhi 110027",
};

const profiles: BoutiqueProfile[] = [
  shyamProfile,
  heritageProfile,
  auroraProfile,
];

export const boutiques: Boutique[] = [
  {
    id: "zoya-tata",
    name: "Zoya - A Tata Product",
    image: boutiqueListingCoverImage("zoya-tata"),
    location: "Bandra West, Mumbai",
    rating: 4.9,
    distanceKm: 2.4,
    tag: "VERIFIED PARTNER",
    tags: ["BRIDAL EXPERT", "DIAMONDS"],
    status: "Open now",
    description:
      "Signature jewellery experiences with contemporary design and trusted Tata quality.",
    weeklyVisits: 34,
    highlightSuffix: "this week for bespoke bridal consultations.",
  },
  {
    id: "hazoorilal-legacy",
    name: "Hazoorilal Legacy",
    image: boutiqueListingCoverImage("hazoorilal-legacy"),
    location: "Greater Kailash, Delhi",
    rating: 4.8,
    distanceKm: 1.2,
    tag: "PREMIER",
    tags: ["TEMPLE JEWELLERY", "POLKI"],
    status: "Open now",
    description:
      "Heritage polki and temple jewellery with bespoke craftsmanship for every celebration.",
    weeklyVisits: 28,
    highlightSuffix: "this week for bespoke bridal consultations.",
  },
  {
    id: "vogue-jewels",
    name: "Vogue Jewels",
    image: boutiqueListingCoverImage("vogue-jewels"),
    location: "Connaught Place, Delhi",
    rating: 4.7,
    distanceKm: 2.4,
    tag: "VERIFIED PARTNER",
    tags: ["DIAMONDS", "CONTEMPORARY", "BRIDAL"],
    status: "Open now",
    description:
      "Contemporary luxury with curated diamonds and bespoke styling for milestone moments.",
    weeklyVisits: 41,
    highlightSuffix: "this week for bespoke bridal consultations.",
  },
  {
    id: "heritage-gems",
    name: "Heritage Gems & Jewels",
    image: boutiqueListingCoverImage("heritage-gems"),
    location: "Karol Bagh, Delhi",
    rating: 4.8,
    distanceKm: 1.2,
    tag: "PREMIER PARTNER",
    tags: ["BRIDAL", "CUSTOM DESIGN", "DIAMONDS"],
    status: "Open now",
    description:
      "Experience curated bridal collections and signature designs where heritage craftsmanship meets modern luxury.",
    weeklyVisits: 22,
    highlightSuffix: "this week for bespoke bridal consultations.",
  },
  {
    id: "aurora-contemporary",
    name: "Aurora Contemporary",
    image: boutiqueListingCoverImage("aurora-contemporary"),
    location: "Rajouri Garden, Delhi",
    rating: 4.9,
    distanceKm: 2.4,
    tag: "CURATED BOUTIQUE",
    tags: ["MODERN", "GOLD POLKI"],
    status: "Closing soon",
    description:
      "Known for sleek, contemporary silhouettes and refined detailing, Aurora is the destination for modern classics.",
    weeklyVisits: 16,
    highlightSuffix: "this week for bespoke bridal consultations.",
  },
  {
    id: "shyam-boutique",
    name: "Shyam Boutique",
    image: boutiqueListingCoverImage("shyam-boutique"),
    location: "South Extension, Delhi",
    rating: 4.9,
    distanceKm: 1.2,
    tag: "TRUSTED",
    tags: ["BRIDAL EXPERT", "TEMPLE JEWELLERY"],
    status: "Open now",
    description:
      "A heritage boutique celebrated for temple jewellery and bespoke bridal pieces crafted for milestone moments.",
    weeklyVisits: 52,
    highlightSuffix: "this week for bespoke bridal consultations.",
  },
];

const BANNER_TINTS = ["#3d3428", "#c4b28f", "#1e2936", "#5c4a3a", "#e8ecf2"];

function tintForBoutiqueId(id: string, i: number): string {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return BANNER_TINTS[(n + i) % BANNER_TINTS.length];
}

function defaultProductsFromCatalog(): BoutiqueProductItemUi[] {
  const cols: string[] = [
    "wedding",
    "rings",
    "men",
    "other",
    "wedding",
    "rings",
  ];
  const tints = [
    "#d4c4a8",
    "#1a2744",
    "#c9a227",
    "#2c2416",
    "#e8d5c8",
    "#8b6914",
  ];
  return categoryProducts.slice(0, 6).map((p, i) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    tag: p.category,
    categoryLabel: p.category,
    imageTint: tints[i % tints.length],
    imageUri: productPrimaryUri(p.id, p.category),
    collection: cols[i % cols.length],
  }));
}

function buildProfileFromListing(b: Boutique): BoutiqueProfile {
  const short = b.location.split(",")[0]?.trim() ?? b.location;
  const openNow = /open/i.test(b.status);
  const trusted =
    (b.tag.split(/\s+/)[0] ?? "TRUSTED")
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 12) || "TRUSTED";
  const nameChars = b.name.replace(/[^a-zA-Z0-9]/g, "");
  const logoCaption = nameChars.slice(0, 6).toUpperCase() || "STORE";
  const products = defaultProductsFromCatalog();
  return {
    id: b.id,
    name: b.name,
    rating: b.rating,
    reviewCount: 0,
    location: b.location,
    shortLocation: short,
    description: `${b.description} Every piece tells a story of elegance and timeless beauty.`,
    trustedTag: trusted,
    banners: [
      { tint: tintForBoutiqueId(b.id, 0), uri: BOUTIQUE_BANNER_URIS[0] },
      { tint: tintForBoutiqueId(b.id, 1), uri: BOUTIQUE_BANNER_URIS[1] },
      { tint: tintForBoutiqueId(b.id, 2), uri: BOUTIQUE_BANNER_URIS[2] },
    ],
    openNow,
    hoursLabel: openNow
      ? "Opens 10:30 - 6:00"
      : "Closed · Opens 10:30 tomorrow",
    logoTint: tintForBoutiqueId(b.id, 0),
    logoCaption,
    logoSubtitle: "BOUTIQUE",
    logoUrl: null,
    products,
    collections: buildCollectionTabsFromProducts(products, []),
    openingTime: null,
    closingTime: null,
    workingDays: [],
    statusSubLabel: "",
    coordinates: null,
    phone: "",
    whatsapp: "",
    mapsQuery: `${b.location.replace(/,/g, "").split(/\s+/).filter(Boolean).join("+")}+jewellery`,
    contactAddress: `${b.location}, India`,
  };
}

/** Full profile for an id: curated profile first, else built from `boutiques` listing. */
export function getBoutiqueProfileForId(
  id: string | undefined,
): BoutiqueProfile | null {
  if (!id) return null;
  const curated = profiles.find((p) => p.id === id);
  if (curated) return curated;
  const listing = boutiques.find((b) => b.id === id);
  if (!listing) return null;
  return buildProfileFromListing(listing);
}

/** Resolve profile by exact boutique name (case-insensitive). */
export function getBoutiqueProfileForName(
  name: string | undefined,
): BoutiqueProfile | null {
  if (!name?.trim()) return null;
  const n = name.trim().toLowerCase();
  const curated = profiles.find((p) => p.name.toLowerCase() === n);
  if (curated) return curated;
  const listing = boutiques.find((b) => b.name.toLowerCase() === n);
  if (!listing) return null;
  return buildProfileFromListing(listing);
}

export function getBoutiqueProfileById(
  id: string | undefined,
): BoutiqueProfile | null {
  return getBoutiqueProfileForId(id);
}

export default boutiques;
