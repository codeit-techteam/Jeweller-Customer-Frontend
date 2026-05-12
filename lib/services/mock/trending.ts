import { trendingImageUri } from '@/lib/services/mock/imageUrls';

export type TrendingBadge = 'BESTSELLER' | 'MOST LOVED' | 'TRENDING';

export type TrendingProduct = {
  id: string;
  title: string;
  description: string;
  price: string;
  badge?: TrendingBadge;
  /** Placeholder tint for image area (screenshots use photography) */
  imageTint: string;
  /** Unsplash hero image for list cards */
  imageUri: string;
  /** Optional category / filter tag */
  category: string;
};

export const TRENDING_TOTAL_CATALOG = 142;

export const trendingProducts: TrendingProduct[] = [
  {
    id: 't1',
    title: 'Ethereal Halo Diamond Ring',
    description: '18K White Gold, 1.5 Carat',
    price: '₹1,45,000',
    badge: 'BESTSELLER',
    imageTint: '#d4e4f0',
    imageUri: trendingImageUri('t1'),
    category: 'RINGS',
  },
  {
    id: 't2',
    title: 'Verdant Emerald Drop Necklace',
    description: 'Yellow Gold, Zambian Emerald',
    price: '₹82,500',
    imageTint: '#e8e4dc',
    imageUri: trendingImageUri('t2'),
    category: 'NECKLACES',
  },
  {
    id: 't3',
    title: 'Celestial Diamond Chandeliers',
    description: 'VVS Clarity, Platinum Base',
    price: '₹4,20,000',
    badge: 'MOST LOVED',
    imageTint: '#e8ecf2',
    imageUri: trendingImageUri('t3'),
    category: 'EARRINGS',
  },
  {
    id: 't4',
    title: 'Heritage Gold Link Bracelet',
    description: '22K Solid Rose Gold',
    price: '₹68,900',
    imageTint: '#e5d5c5',
    imageUri: trendingImageUri('t4'),
    category: 'BRACELETS',
  },
  {
    id: 't5',
    title: 'Midnight Sapphire Clusters',
    description: 'Deep Blue Sapphire, White Gold',
    price: '₹1,12,000',
    imageTint: '#dce4ec',
    imageUri: trendingImageUri('t5'),
    category: 'EARRINGS',
  },
  {
    id: 't6',
    title: 'Origami Geometric Ring',
    description: 'Sculptural Gold Band',
    price: '₹54,300',
    badge: 'TRENDING',
    imageTint: '#2a2419',
    imageUri: trendingImageUri('t6'),
    category: 'RINGS',
  },
  {
    id: 't7',
    title: 'Oyster Pearl Lariat',
    description: 'Freshwater Pearl, Silk Thread',
    price: '₹24,500',
    imageTint: '#f0ece8',
    imageUri: trendingImageUri('t7'),
    category: 'NECKLACES',
  },
  {
    id: 't8',
    title: 'Ethereal Halo Diamond Ring',
    description: '18K White Gold, 1.5 Carat',
    price: '₹1,45,000',
    badge: 'BESTSELLER',
    imageTint: '#d4e4f0',
    imageUri: trendingImageUri('t8'),
    category: 'RINGS',
  },
];
