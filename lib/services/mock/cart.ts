import { productPrimaryUri } from "@/lib/services/mock/imageUrls";
import { getProductById } from "@/lib/services/mock/products";
import { getWishlistMockRow } from "@/lib/services/mock/wishlist";
import type { CartLine } from "@/lib/stores/cartStore";

/** Fixture shape for mock / documentation */
export type MockCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export type CartLineDisplay = {
  name: string;
  subtitle: string;
  price: number;
  qty: number;
  imageUri?: string;
  tint?: string;
  productId: string;
  size: string;
  metal: string;
};

export type MockDeliveryAddress = {
  name: string;
  lines: string;
};

export const mockDeliveryAddress: MockDeliveryAddress = {
  name: "Sayan Das",
  lines: "Bansberia, Mithapukur More, West Bengal",
};

/** GST rate applied to subtotal (simplified) */
export const CHECKOUT_GST_RATE = 0.1;

export function resolveCartLineDisplay(line: CartLine): CartLineDisplay {
  const p = getProductById(line.productId);
  const wish = getWishlistMockRow(line.productId);
  const subtitle =
    line.subtitle ??
    (line.metal && line.size
      ? `${line.metal} / ${line.size}`
      : line.metal || line.size || "—");
  const fromProduct =
    p?.images[0]?.uri ?? (p ? productPrimaryUri(p.id, p.category) : undefined);
  const merged =
    (line.imageUri?.startsWith("http") ? line.imageUri : undefined) ??
    (wish?.image?.startsWith("http") ? wish.image : undefined) ??
    (fromProduct?.startsWith("http") ? fromProduct : undefined);
  const tint = p?.images[0]?.tint ?? "#e8eaed";

  return {
    productId: line.productId,
    name: line.name,
    subtitle,
    price: line.price,
    qty: line.qty,
    size: line.size,
    metal: line.metal,
    imageUri: merged,
    tint,
  };
}
