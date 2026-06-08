import { router } from 'expo-router';

import type { PendingAction } from '@/lib/types/pendingAction';
import { useGuestSessionStore } from '@/lib/stores/guestSessionStore';
import { useSavedBoutiquesStore } from '@/lib/stores/savedBoutiquesStore';
import { useWishlistStore } from '@/lib/stores/wishlistStore';
import { showWishlistToast } from '@/lib/stores/wishlistToastStore';
import { trackActionCompletedAfterLogin } from '@/services/analyticsTracking';

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

export async function runPostLoginSync(userId: string): Promise<void> {
  await Promise.all([
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
