import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

/**
 * Legacy route: all boutique deep links now use the unified {@link boutique-profile} screen.
 */
export default function BoutiqueDetailsRedirect() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const raw = Array.isArray(id) ? id[0] : id;
  if (!raw) {
    return <Redirect href="/(app)/boutiques" />;
  }
  return <Redirect href={{ pathname: '/(app)/boutique-profile', params: { id: raw } }} />;
}
