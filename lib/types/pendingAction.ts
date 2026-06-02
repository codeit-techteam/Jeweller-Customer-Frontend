import type { CartLine } from '@/lib/stores/cartStore';
import type { WishlistSnapshot } from '@/lib/services/mock/wishlist';

export type PendingAction =
  | { type: 'wishlist'; productId: string; snapshot?: WishlistSnapshot; remove?: boolean }
  | { type: 'cart_add'; line: Omit<CartLine, 'qty'> & { qty?: number } }
  | { type: 'wishlist_move_to_cart'; productId: string; line: Omit<CartLine, 'qty'> & { qty?: number } }
  | { type: 'cart_checkout' }
  | { type: 'appointment'; boutiqueId: string; productId?: string; params?: Record<string, string> }
  | { type: 'book_visit'; boutiqueId?: string; productId?: string; params?: Record<string, string> }
  | { type: 'boutique_save'; boutiqueId: string; unsave?: boolean }
  | { type: 'review'; productId: string; boutiqueId?: string }
  | { type: 'checkout' }
  | { type: 'route'; pathname: string; params?: Record<string, string> };
