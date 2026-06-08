import Toast from 'react-native-toast-message';

import type { WishlistItemRow } from '@/lib/services/mock/wishlist';

const BOTTOM_TOAST_OFFSET = 100;

/** Cart feature disabled — kept for type compatibility only. */
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

/** @deprecated Cart removed from app */
export async function moveWishlistItemToCart(_row: WishlistItemRow): Promise<MoveToCartResult> {
  return { ok: false, message: 'Cart is not available.' };
}

/** @deprecated Cart removed from app */
export async function completePendingWishlistMoveToCart(
  _productId: string,
  _line: unknown,
): Promise<void> {
  // no-op
}

export { showBottomError };
