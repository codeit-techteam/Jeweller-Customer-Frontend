import type { Router } from 'expo-router';

/**
 * Navigate to a marketing collection screen (`app/(app)/collection/[slug].tsx`).
 */
export function pushCollection(router: Router, slug: string): void {
  const s = slug.trim().toLowerCase();
  router.push({
    pathname: '/(app)/collection/[slug]',
    params: { slug: s, type: s },
  });
}
