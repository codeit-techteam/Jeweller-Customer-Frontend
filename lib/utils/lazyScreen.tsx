import React, { Suspense, type ComponentType } from 'react';

import { FullScreenLoader } from '@/components/loaders';

type LazyScreenOptions = {
  /** Shown while the lazy chunk loads. Defaults to a full-screen loader. */
  fallback?: React.ReactNode;
};

/**
 * Wraps `React.lazy` with Suspense for deferred screen modules (Expo Router routes).
 * Metro splits dynamic imports into separate chunks loaded on first navigation.
 */
export function lazyScreen<P extends object = Record<string, unknown>>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  options?: LazyScreenOptions,
) {
  const LazyComponent = React.lazy(factory as () => Promise<{ default: ComponentType<P> }>);
  const fallback = options?.fallback ?? <FullScreenLoader />;

  function LazyScreen(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  LazyScreen.displayName = 'LazyScreen';
  return LazyScreen;
}

/** Lazy-load a named export from a module (e.g. `CollectionScreen`). */
export function lazyNamedScreen<P extends object>(
  loader: () => Promise<Record<string, ComponentType<P>>>,
  exportName: string,
  options?: LazyScreenOptions,
) {
  return lazyScreen<P>(
    () =>
      loader().then((mod) => ({
        default: mod[exportName] as ComponentType<P>,
      })),
    options,
  );
}
