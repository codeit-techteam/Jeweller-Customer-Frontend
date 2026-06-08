import type { WishlistSnapshot } from '@/lib/services/mock/wishlist';

export type PendingAction =
  | { type: 'wishlist'; productId: string; snapshot?: WishlistSnapshot; remove?: boolean }
  | { type: 'appointment'; boutiqueId: string; productId?: string; params?: Record<string, string> }
  | { type: 'book_visit'; boutiqueId?: string; productId?: string; params?: Record<string, string> }
  | { type: 'boutique_save'; boutiqueId: string; unsave?: boolean }
  | { type: 'review'; productId: string; boutiqueId?: string }
  | { type: 'checkout' }
  | { type: 'route'; pathname: string; params?: Record<string, string> };
