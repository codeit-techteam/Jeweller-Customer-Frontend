import AsyncStorage from "@react-native-async-storage/async-storage";

import { PLACEHOLDER_IMAGE_URI } from "@/lib/services/mock/imageUrls";
import { searchCustomerProducts } from "@/services/api";

const RECENT_VOICE_SEARCHES_KEY = "recentVoiceSearches";

export type VoiceSearchProduct = {
  id: string;
  name: string;
  price: number;
  imageUri: string;
  boutiqueName: string | null;
  boutiqueRating: number | null;
  boutiqueVerified: boolean;
  category: string;
};

function safeString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function resolveImage(row: Awaited<ReturnType<typeof searchCustomerProducts>>["products"][number]): string {
  const candidates: Array<unknown> = [
    row.thumbnail_image,
    row.primary_image,
    row.featured_image,
    row.image,
    row.gallery_images?.[0],
    row.images?.[0],
    row.product_images?.[0]?.image_url,
  ];
  for (const candidate of candidates) {
    const value = safeString(candidate);
    if (value) return value;
  }
  return PLACEHOLDER_IMAGE_URI;
}

function mapApiProduct(
  row: Awaited<ReturnType<typeof searchCustomerProducts>>["products"][number],
): VoiceSearchProduct {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    imageUri: resolveImage(row),
    boutiqueName: row.boutique?.name ?? null,
    boutiqueRating:
      row.boutique?.rating != null ? Number(row.boutique.rating) : null,
    boutiqueVerified: Boolean(
      row.boutique?.is_verified ?? row.boutique?.verified ?? false,
    ),
    category: row.category?.name ?? "",
  };
}

export async function saveRecentVoiceSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  const existing = await AsyncStorage.getItem(RECENT_VOICE_SEARCHES_KEY);
  const searches: string[] = existing ? JSON.parse(existing) : [];
  const updated = [trimmed, ...searches.filter((s) => s !== trimmed)].slice(0, 5);
  await AsyncStorage.setItem(RECENT_VOICE_SEARCHES_KEY, JSON.stringify(updated));
}

export async function loadRecentVoiceSearches(): Promise<string[]> {
  const existing = await AsyncStorage.getItem(RECENT_VOICE_SEARCHES_KEY);
  if (!existing) return [];
  try {
    const parsed = JSON.parse(existing);
    return Array.isArray(parsed)
      ? parsed.map((entry) => String(entry).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export async function searchProductsByVoice(
  query: string,
  limit = 12,
): Promise<VoiceSearchProduct[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const response = await searchCustomerProducts(trimmed, limit);
  return (response.products ?? []).map(mapApiProduct);
}
