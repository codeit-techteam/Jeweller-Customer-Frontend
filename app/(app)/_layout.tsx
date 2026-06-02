import { Stack } from 'expo-router';
import React, { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useNotificationsStore } from '@/lib/stores/notificationsStore';
import { useRecentlyViewedStore } from '@/lib/stores/recentlyViewedStore';
import { useWishlistStore } from '@/lib/stores/wishlistStore';
import { FullScreenLoader } from '@/components/loaders';

export default function AppRoutesLayout() {
  const hydrateRecentlyViewed = useRecentlyViewedStore((s) => s.hydrate);
  const initializeWishlist = useWishlistStore((s) => s.initializeForUser);
  const initializeNotifications = useNotificationsStore((s) => s.initializeForUser);
  const clearNotifications = useNotificationsStore((s) => s.clear);
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    void Promise.all([
      hydrateRecentlyViewed(user.id),
      initializeWishlist(user.id),
      initializeNotifications(user.id),
    ]);
  }, [hydrateRecentlyViewed, initializeWishlist, initializeNotifications, user?.id]);

  useEffect(() => {
    if (user?.id) return;
    void initializeWishlist(null);
    clearNotifications();
  }, [initializeWishlist, clearNotifications, user?.id]);

  if (loading) return <FullScreenLoader label="Restoring session..." />;

  return (
    <Stack screenOptions={{ animation: 'fade', contentStyle: { backgroundColor: '#ffffff' } }}>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen name="filters" options={{ headerShown: false }} />
      <Stack.Screen name="category-products" options={{ title: '' }} />
      <Stack.Screen name="occasion-products" options={{ headerShown: false }} />
      <Stack.Screen name="occasions" options={{ headerShown: false }} />
      <Stack.Screen name="boutiques" options={{ headerShown: false }} />
      <Stack.Screen name="trending" options={{ headerShown: false }} />
      <Stack.Screen name="wishlist" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ headerShown: false }} />
      <Stack.Screen name="address-details" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen name="order-success" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="boutique-details" options={{ headerShown: false }} />
      <Stack.Screen name="boutique-profile" options={{ headerShown: false }} />
      <Stack.Screen name="product-details" options={{ headerShown: false }} />
      <Stack.Screen name="book-visit" options={{ headerShown: false }} />
      <Stack.Screen name="contact-boutique" options={{ headerShown: false }} />
      <Stack.Screen name="book-appointment" options={{ headerShown: false }} />
      <Stack.Screen name="appointment-success" options={{ headerShown: false }} />
      <Stack.Screen name="appointment-booked" options={{ headerShown: false }} />
      <Stack.Screen name="my-appointments" options={{ headerShown: false }} />
      <Stack.Screen name="appointment-details" options={{ headerShown: false }} />
      <Stack.Screen name="saved-boutiques" options={{ headerShown: false }} />
      <Stack.Screen name="recently-viewed" options={{ headerShown: false }} />
      <Stack.Screen name="collection/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="gold-mine-plan" options={{ headerShown: false }} />
      <Stack.Screen name="gold-reserve-plan" options={{ headerShown: false }} />
      <Stack.Screen name="active-plans" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen name="address" options={{ headerShown: false }} />
      <Stack.Screen name="address-form" options={{ headerShown: false }} />
      <Stack.Screen name="appointments" options={{ headerShown: false }} />
    </Stack>
  );
}

