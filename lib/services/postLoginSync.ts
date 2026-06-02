import { router } from 'expo-router';

import type { PendingAction } from '@/lib/types/pendingAction';
import { useGuestSessionStore } from '@/lib/stores/guestSessionStore';
import { useSavedBoutiquesStore } from '@/lib/stores/savedBoutiquesStore';
import { useWishlistStore } from '@/lib/stores/wishlistStore';
import { showWishlistToast } from '@/lib/stores/wishlistToastStore';
import { showCartToast } from '@/lib/stores/cartToastStore';
import { useCartStore, type CartLine } from '@/lib/stores/cartStore';
import { trackActionCompletedAfterLogin } from '@/services/analyticsTracking';

/** Merge guest + user cart: same SKU increases qty, new SKUs append. */
export function mergeCartLines(guestItems: CartLine[], userItems: CartLine[]): CartLine[] {
  const merged = [...userItems];
  for (const guestLine of guestItems) {
    const idx = merged.findIndex(
      (x) =>
        x.productId === guestLine.productId &&
        x.size === guestLine.size &&
        x.metal === guestLine.metal,
    );
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], qty: merged[idx].qty + guestLine.qty };
    } else {
      merged.push(guestLine);
    }
  }
  return merged;
}

async function syncGuestWishlist(userId: string): Promise<void> {
  const guestStore = useGuestSessionStore.getState();
  const wishlistStore = useWishlistStore.getState();
  const guestIds = [...guestStore.wishlistIds];

  await wishlistStore.initializeForUser(userId);

  for (const productId of guestIds) {
    const snapshot = guestStore.wishlistItems[productId];
    if (!wishlistStore.isWishlisted(productId)) {
      await wishlistStore.toggle(productId, snapshot, { skipToast: true });
    }
  }

  await guestStore.clearGuestWishlist();
}

export async function mergeGuestCartOnLogin(): Promise<void> {
  const cartStore = useCartStore.getState();
  const guestItems = [...cartStore.items];
  // Server cart fetch can be wired here; until then merge with empty user cart.
  const userItems: CartLine[] = [];
  const merged = mergeCartLines(guestItems, userItems);
  cartStore.setItems(merged);
  await cartStore.persistCart();
}

export async function runPostLoginSync(userId: string): Promise<void> {
  await Promise.all([
    mergeGuestCartOnLogin(),
    syncGuestWishlist(userId),
    useSavedBoutiquesStore.getState().hydrateForUser(userId),
  ]);
}

export async function executePendingAction(
  action: PendingAction,
  userId: string,
): Promise<void> {
  const wishlistStore = useWishlistStore.getState();
  const savedStore = useSavedBoutiquesStore.getState();
  const cartStore = useCartStore.getState();

  switch (action.type) {
    case 'wishlist': {
      const already = wishlistStore.isWishlisted(action.productId);
      if (action.remove) {
        if (already) await wishlistStore.toggle(action.productId);
      } else if (!already) {
        await wishlistStore.toggle(action.productId, action.snapshot, { skipToast: true });
        showWishlistToast({
          type: "added",
          message: "Added to Wishlist ❤️",
        });
      }
      break;
    }
    case 'cart_add': {
      cartStore.addItem(action.line, { skipToast: true });
      showCartToast({ message: 'Added to Cart ✓' });
      break;
    }
    case 'wishlist_move_to_cart': {
      const { completePendingWishlistMoveToCart } = await import(
        '@/lib/services/wishlistMoveToCartAction'
      );
      await completePendingWishlistMoveToCart(action.productId, action.line);
      break;
    }
    case 'cart_checkout':
    case 'checkout': {
      router.push('/(app)/address-details');
      break;
    }
    case 'appointment':
    case 'book_visit': {
      router.push({
        pathname: action.type === 'book_visit' ? '/(app)/book-visit' : '/(app)/book-appointment',
        params: {
          boutiqueId: action.boutiqueId ?? '',
          ...(action.productId ? { productId: action.productId } : {}),
          ...action.params,
        },
      });
      break;
    }
    case 'boutique_save': {
      if (action.unsave) {
        await savedStore.unsaveForUser(userId, action.boutiqueId);
      } else {
        await savedStore.saveForUser(userId, action.boutiqueId);
      }
      break;
    }
    case 'review': {
      router.push({
        pathname: '/(app)/product-details',
        params: { id: action.productId },
      });
      break;
    }
    case 'route': {
      router.push({
        pathname: action.pathname as never,
        params: action.params,
      });
      break;
    }
    default:
      break;
  }

  trackActionCompletedAfterLogin(action.type);
}

export async function handleLoginSuccess(userId: string): Promise<void> {
  await runPostLoginSync(userId);

  const { useAuthGuardStore } = await import('@/lib/stores/authGuardStore');
  const pending = useAuthGuardStore.getState().consumePendingAction();
  if (pending) {
    await executePendingAction(pending, userId);
    return;
  }

  router.replace('/(app)/home');
}
