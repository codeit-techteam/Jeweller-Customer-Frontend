import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

import { normalizeCategoryParam } from '@/lib/services/mock/categoryProducts';

/**
 * Legacy route: filters now live on the category listing as modals + bottom sheets.
 */
export default function FiltersScreen() {
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const categoryKey = normalizeCategoryParam(categoryParam);

  return <Redirect href={{ pathname: '/(app)/category-products', params: { category: categoryKey } }} />;
}
