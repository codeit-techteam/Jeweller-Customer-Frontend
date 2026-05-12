import { apiRequest } from "./httpClient";

export { ApiError } from "./apiError";
export { API_URL, getResolvedApiOrigin } from "./httpClient";

type RequestAuthOptions = {
  userId?: string;
};

function request<T>(
  path: string,
  options?: {
    method?: string;
    data?: unknown;
    params?: Record<string, string | number | boolean>;
  },
  auth?: RequestAuthOptions,
): Promise<T> {
  return apiRequest<T>(
    {
      url: path,
      method: options?.method ?? "GET",
      data: options?.data,
      params: options?.params,
    },
    auth?.userId ? { "x-user-id": auth.userId } : undefined,
  );
}

export function getCategories() {
  return request<Array<{ id: string; name: string; image: string | null }>>(
    "/api/categories",
  );
}

export function getProducts(categoryId?: string) {
  return request<
    Array<{
      id: string;
      name: string;
      price: number;
      image: string | null;
      primary_image?: string | null;
      thumbnail_image?: string | null;
      video_url?: string | null;
      video_thumbnail?: string | null;
      category_id: string | null;
      boutique_id: string | null;
      status?: "active" | "draft" | "archived";
      is_trending?: boolean;
      trending?: boolean;
      description?: string | null;
      rating?: number | null;
      product_images?: Array<{ id: string; image_url: string }>;
      images?: string[];
      videos?: string[];
      media?: Array<{ type: "image" | "video"; url: string }>;
      thumbnail?: string | null;
      featured_image?: string | null;
      gallery_images?: string[];
      category?: { id: string; name: string } | null;
      boutique?: {
        id: string;
        name: string;
        address?: string | null;
        location: string | null;
        rating: number | null;
        reviews_count?: number | null;
        verified?: boolean | null;
        is_verified?: boolean | null;
        distance?: number | null;
        image: string | null;
        logo?: string | null;
        phone?: string | null;
        whatsapp?: string | null;
        coordinates?: { lat: number; lng: number } | null;
        contact_details?: {
          phone?: string | null;
          whatsapp?: string | null;
          email?: string | null;
        };
      } | null;
    }>
  >(
    `/api/products`,
    categoryId
      ? { method: "GET", params: { category_id: categoryId } }
      : { method: "GET" },
  );
}

export function getTrendingProducts() {
  return request<
    Array<{
      id: string;
      name: string;
      price: number;
      image: string | null;
      primary_image?: string | null;
      thumbnail_image?: string | null;
      video_url?: string | null;
      video_thumbnail?: string | null;
      category_id: string | null;
      boutique_id: string | null;
      is_trending: boolean;
      trending?: boolean;
      description?: string | null;
      rating?: number | null;
      product_images?: Array<{ id: string; image_url: string }>;
      images?: string[];
      videos?: string[];
      media?: Array<{ type: "image" | "video"; url: string }>;
      thumbnail?: string | null;
      featured_image?: string | null;
      gallery_images?: string[];
      category?: { id: string; name: string } | null;
      boutique?: {
        id: string;
        name: string;
        address?: string | null;
        location: string | null;
        rating: number | null;
        reviews_count?: number | null;
        verified?: boolean | null;
        is_verified?: boolean | null;
        distance?: number | null;
        image: string | null;
        logo?: string | null;
        phone?: string | null;
        whatsapp?: string | null;
        coordinates?: { lat: number; lng: number } | null;
        contact_details?: {
          phone?: string | null;
          whatsapp?: string | null;
          email?: string | null;
        };
      } | null;
    }>
  >("/api/products/trending", { method: "GET" });
}

export function getProductById(id: string) {
  return request<{
    id: string;
    name: string;
    price: number;
    image: string | null;
    primary_image?: string | null;
    thumbnail_image?: string | null;
    video_url?: string | null;
    video_thumbnail?: string | null;
    category_id: string | null;
    boutique_id: string | null;
    primary_boutique_id?: string | null;
    status?: "active" | "draft" | "archived";
    is_trending?: boolean;
    trending?: boolean;
    description?: string | null;
    rating?: number | null;
    reviews_count?: number | null;
    discount_percentage?: number | null;
    available_sizes?: unknown;
    available_metals?: unknown;
    specifications?: Record<string, string | undefined> | null;
    price_breakup?: {
      gold?: number;
      gemstone?: number;
      makingCharge?: number;
      making?: number;
      gst?: number;
      total?: number | null;
    } | null;
    gender?: string | null;
    occasion?: string | null;
    style?: string | null;
    collection_name?: string | null;
    product_images?: Array<{
      id: string;
      image_url: string;
      is_primary?: boolean;
      sort_order?: number;
    }>;
    images?: string[];
    videos?: string[];
    media?: Array<{ type: "image" | "video"; url: string }>;
    thumbnail?: string | null;
    featured_image?: string | null;
    gallery_images?: string[];
    category?: { id: string; name: string } | null;
    boutique?: {
      id: string;
      name: string;
      address?: string | null;
      location: string | null;
      rating: number | null;
      reviews_count?: number | null;
      verified?: boolean | null;
      is_verified?: boolean | null;
      distance?: number | null;
      image: string | null;
      logo?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
      coordinates?: { lat: number; lng: number } | null;
      latitude?: number | null;
      longitude?: number | null;
      contact_details?: {
        phone?: string | null;
        whatsapp?: string | null;
        email?: string | null;
      };
      opening_time?: string | null;
      closing_time?: string | null;
      working_days?: string[] | null;
    } | null;
  }>(`/api/products/${id}`, { method: "GET" });
}

export function getBoutiques() {
  const stamp = Date.now();
  return request<
    Array<{
      id: string;
      name: string;
      location: string | null;
      rating: number | null;
      image: string | null;
      cover_image?: string | null;
      logo_url?: string | null;
      logo?: string | null;
      logo_image?: string | null;
      gallery_images?: string[];
      banner_images?: string[];
      opening_time?: string | null;
      closing_time?: string | null;
      working_days?: string[];
      opening_hours?: string | null;
      reviews_count?: number | null;
      featured?: boolean;
      verified?: boolean;
      is_verified?: boolean;
      status?: string;
      description?: string | null;
      latest_collection_name?: string | null;
      coordinates?: { lat: number; lng: number } | null;
      latitude?: number | null;
      longitude?: number | null;
    }>
  >("/api/boutiques", { method: "GET", params: { t: stamp } });
}

export function getBoutiqueById(id: string) {
  const stamp = Date.now();
  return request<{
    id: string;
    name: string;
    address?: string | null;
    location: string | null;
    rating: number | null;
    distance?: number | null;
    image: string | null;
    cover_image?: string | null;
    logo_image?: string | null;
    logo?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    phone_number?: string | null;
    whatsapp_number?: string | null;
    full_address?: string | null;
    logo_url?: string | null;
    banner_images?: string[];
    gallery_images?: string[];
    opening_time?: string | null;
    closing_time?: string | null;
    working_days?: string[];
    reviews_count?: number | null;
    verified?: boolean;
    is_verified?: boolean;
    description?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    collections?: Array<{ id: string; name: string; slug: string }>;
    linked_product_ids?: string[];
    coordinates?: { lat: number; lng: number } | null;
    products: Array<{
      id: string;
      name: string;
      price: number;
      image: string | null;
      category?: { id: string; name: string } | null;
      collection?: string | null;
      collection_name?: string | null;
      trending?: boolean;
      video_url?: string | null;
      video_thumbnail?: string | null;
      boutique_collection?: { id: string; name: string; slug: string } | null;
    }>;
  }>(`/api/boutiques/${id}`, { method: "GET", params: { t: stamp } });
}

export function getCollections() {
  return request<
    Array<{
      id: string;
      title: string;
      subtitle: string | null;
      image: string | null;
      slug: string | null;
    }>
  >("/api/collections", { method: "GET" });
}

export function getOccasions() {
  return request<
    Array<{
      id: string;
      title: string;
      subtitle: string | null;
      image: string | null;
      collection_slug: string | null;
    }>
  >("/api/occasions", { method: "GET" });
}

export function addRecentlyViewed(data: {
  user_id: string;
  product_id?: string;
  boutique_id?: string;
}) {
  return request("/api/recently-viewed", {
    method: "POST",
    data,
  });
}

export function getRecentlyViewed(userId: string) {
  return request<
    Array<{
      id: string;
      user_id: string;
      viewed_at: string;
      product_id: string | null;
      boutique_id: string | null;
      products: {
        id: string;
        name: string;
        price: number;
        image: string | null;
      } | null;
      boutiques: {
        id: string;
        name: string;
        location: string | null;
        rating: number | null;
        image: string | null;
        logo_url?: string | null;
        full_address?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        opening_time?: string | null;
        closing_time?: string | null;
        working_days?: unknown;
        opening_hours?: string | null;
        phone_number?: string | null;
        whatsapp_number?: string | null;
        contact_number?: string | null;
        whatsapp?: string | null;
        reviews_count?: number | null;
        is_verified?: boolean | null;
        verified?: boolean | null;
        gallery_images?: unknown;
        banner_images?: unknown;
      } | null;
    }>
  >(`/api/recently-viewed/${encodeURIComponent(userId)}`, { method: "GET" });
}

export function clearRecentlyViewedForUser(userId: string) {
  return request<boolean>(
    `/api/recently-viewed/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
    },
  );
}

export type AppointmentApiRow = {
  id: string;
  boutiqueId: string | null;
  boutiqueName: string;
  boutiqueSlug?: string | null;
  date: string;
  dateIso: string | null;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  badge?: "upcoming" | "past" | "completed" | "cancelled";
  address: string;
  image?: string;
  startsAt?: string | null;
  consultationType?: string;
  phone?: string;
};

export function getAppointmentsForUser(userId: string) {
  return request<AppointmentApiRow[]>(
    `/api/appointments?userId=${encodeURIComponent(userId)}`,
    { method: "GET" },
  );
}

export function getAppointmentDetail(appointmentId: string, userId: string) {
  return request<AppointmentApiRow>(
    `/api/appointments/detail/${encodeURIComponent(appointmentId)}?userId=${encodeURIComponent(userId)}`,
    { method: "GET" },
  );
}

export function updateAppointmentStatus(
  appointmentId: string,
  userId: string,
  status: "cancelled" | "completed" | "upcoming",
) {
  return request<AppointmentApiRow>(
    `/api/appointments/${encodeURIComponent(appointmentId)}`,
    {
      method: "PATCH",
      data: { status },
    },
    { userId },
  );
}

export function getSavedBoutiques(userId: string) {
  return request<
    Array<{
      id: string;
      name: string;
      image: string | null;
      rating: number;
      reviews: number;
      location: string;
      full_address?: string | null;
      distanceKm: number | null;
      latitude?: number | null;
      longitude?: number | null;
      phone?: string | null;
      whatsapp?: string | null;
      opening_time?: string | null;
      closing_time?: string | null;
      working_days?: string[] | null;
      tags: string[];
      verified: boolean;
      previewImages: string[];
      galleryLayout: "triple" | "split";
      splitUsesHeroImage: boolean;
      moreItemsCount: number;
      itineraryPieces: number;
      savedAt: string;
    }>
  >(`/api/saved-boutiques/${encodeURIComponent(userId)}`, { method: "GET" });
}

export function saveBoutique(data: { user_id: string; boutique_id: string }) {
  return request("/api/saved-boutiques", {
    method: "POST",
    data,
  });
}

export function unsaveBoutique(data: { user_id: string; boutique_id: string }) {
  return request("/api/saved-boutiques", {
    method: "DELETE",
    data,
  });
}

export type WishlistProductPayload = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  boutique: {
    id: string;
    name: string;
    rating?: number | null;
    verified?: boolean | null;
    logo?: string | null;
  } | null;
};

export type WishlistItemPayload = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: WishlistProductPayload | null;
};

export function getWishlist(userId: string) {
  return request<WishlistItemPayload[]>("/api/wishlist", undefined, { userId });
}

export function addWishlistProduct(productId: string, userId: string) {
  return request(
    `/api/wishlist/${encodeURIComponent(productId)}`,
    { method: "POST" },
    { userId },
  );
}

export function removeWishlistProduct(productId: string, userId: string) {
  return request(
    `/api/wishlist/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
    { userId },
  );
}

export function getWishlistCount(userId: string) {
  return request<{ count: number }>("/api/wishlist/count", undefined, {
    userId,
  });
}
