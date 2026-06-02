import Toast from 'react-native-toast-message';

import type { WishlistItemRow } from '@/lib/services/mock/wishlist';
import {
  validateWishlistProductForCart,
  wishlistRowToCartLine,
} from '@/lib/services/wishlistMoveToCart';
import { useAuthGuardStore } from '@/lib/stores/authGuardStore';
import { showCartToast } from '@/lib/stores/cartToastStore';
import { useCartStore } from '@/lib/stores/cartStore';
import { useWishlistStore } from '@/lib/stores/wishlistStore';
import {
  trackGuestCartAttempt,
  trackLoginModalOpened,
} from '@/services/analyticsTracking';

const BOTTOM_TOAST_OFFSET = 100;

export type MoveToCartResult =
  | { ok: true }
  | { ok: false; needsLogin: true }
  | { ok: false; needsLogin?: false; message: string };

function showBottomError(message: string): void {
  Toast.show({
    type: 'error',
    text1: message,
    position: 'bottom',
    bottomOffset: BOTTOM_TOAST_OFFSET,
    visibilityTime: 3200,
  });
}

function showMoveSuccess(message = 'Moved to Cart ✓'): void {
  showCartToast({ message });
}

/**
 * Move a wishlist item to cart: validate → add to cart → remove from wishlist → success toast.
 * Guests are prompted with the login bottom sheet; pending action runs after login.
 */
export async function moveWishlistItemToCart(row: WishlistItemRow): Promise<MoveToCartResult> {
  if (!row?.id) {
    return { ok: false, message: 'This product has been removed by the boutique.' };
  }

  const wishlistStore = useWishlistStore.getState();
  const userId = wishlistStore.userId;

  const validation = await validateWishlistProductForCart(row);
  if (!validation.available) {
    return { ok: false, message: validation.message };
  }

  const line = wishlistRowToCartLine(row, validation.size, validation.metal);

  if (!userId) {
    useAuthGuardStore.getState().openLoginModal({
      type: 'wishlist_move_to_cart',
      productId: row.id,
      line,
    });
    trackLoginModalOpened('wishlist_move_to_cart');
    trackGuestCartAttempt(row.id);
    return { ok: false, needsLogin: true };
  }

  try {
    useCartStore.getState().addItem(line, { skipToast: true });
    await wishlistStore.removeFromWishlistOnly(row.id);
    showMoveSuccess('Moved to Cart ✓');
    return { ok: true };
  } catch {
    return { ok: false, message: 'Unable to connect. Please try again.' };
  }
}

export async function completePendingWishlistMoveToCart(
  productId: string,
  line: Omit<import('@/lib/stores/cartStore').CartLine, 'qty'> & { qty?: number },
): Promise<void> {
  const wishlistStore = useWishlistStore.getState();
  useCartStore.getState().addItem(line, { skipToast: true });
  if (wishlistStore.ids.includes(productId)) {
    await wishlistStore.removeFromWishlistOnly(productId);
  }
  showMoveSuccess('Added to Cart ✓');
}

export { showBottomError };
