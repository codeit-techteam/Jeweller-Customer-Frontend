import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

/**
 * Entry route for occasion taps from Search — lists all products with the occasion name as the header.
 */
export default function OccasionProductsScreen() {
  const { occasion } = useLocalSearchParams<{ occasion?: string | string[] }>();
  const raw = Array.isArray(occasion) ? occasion[0] : occasion;
  const title = (raw?.toString() || 'Occasion').trim();

  return (
    <Redirect
      href={{
        pathname: '/(app)/category-products',
        params: { category: 'ALL', title },
      }}
    />
  );
}
