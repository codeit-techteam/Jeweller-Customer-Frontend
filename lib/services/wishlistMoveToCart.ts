import type { WishlistItemRow } from '@/lib/services/mock/wishlist';
import type { CartLine } from '@/lib/stores/cartStore';
import { ApiError, getProductById as fetchProductById } from '@/services/api';

export type ProductAvailability =
  | { available: true; size: string; metal: string }
  | { available: false; message: string };

function firstString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === 'string' && v.trim());
    if (typeof first === 'string') return first.trim();
  }
  return fallback;
}

export function wishlistRowToCartLine(
  row: WishlistItemRow,
  size: string,
  metal: string,
): Omit<CartLine, 'qty'> & { qty: number } {
  return {
    productId: row.id,
    name: row.name,
    price: row.price,
    size,
    metal,
    qty: 1,
    subtitle: `${metal} / ${size}`,
    imageUri: row.image?.startsWith('http') ? row.image : undefined,
  };
}

/**
 * Validates a wishlist product against the API before moving to cart.
 * Falls back to wishlist row data when the network is unavailable but the item
 * is present in the user's wishlist (never treat missing mock cache as unavailable).
 */
export async function validateWishlistProductForCart(
  row: WishlistItemRow,
): Promise<ProductAvailability> {
  if (!row?.id?.trim()) {
    return { available: false, message: 'This product has been removed by the boutique.' };
  }

  try {
    const product = await fetchProductById(row.id);

    if (!product?.id) {
      return { available: false, message: 'This product has been removed by the boutique.' };
    }

    const status = product.status?.toLowerCase();
    if (status === 'archived' || status === 'draft') {
      return { available: false, message: 'This product has been removed by the boutique.' };
    }

    const inStock = (product as { in_stock?: boolean; inStock?: boolean }).in_stock
      ?? (product as { inStock?: boolean }).inStock;
    if (inStock === false) {
      return { available: false, message: 'This product is currently out of stock.' };
    }

    const size = firstString(product.available_sizes, 'Standard');
    const metal = firstString(product.available_metals, 'Gold');

    return { available: true, size, metal };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404) {
        return { available: false, message: 'This product has been removed by the boutique.' };
      }
      if (error.code === 'NETWORK') {
        return { available: false, message: 'Unable to connect. Please try again.' };
      }
    }

    // Wishlist row exists — allow move using row data when API is temporarily unreachable.
    if (row.name && row.price >= 0) {
      return { available: true, size: 'Standard', metal: 'Gold' };
    }

    return { available: false, message: 'Unable to connect. Please try again.' };
  }
}
