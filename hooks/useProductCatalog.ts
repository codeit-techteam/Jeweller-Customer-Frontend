import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  fetchProductCatalog,
  fetchProductsForCollection,
  filterCatalog,
  invalidateProductCatalog,
  type CatalogProduct,
} from "@/lib/services/productCatalog";

/* ------------------------------------------------------------------ */
/* useProductCatalog — full active catalog, refetched on screen focus */
/* ------------------------------------------------------------------ */

type CatalogState = {
  products: CatalogProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Live snapshot of the active product catalog.
 *
 * - Caches between screens via the shared in-memory cache.
 * - Refreshes silently on screen focus so admin edits propagate quickly.
 */
export function useProductCatalog(): CatalogState {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (opts?: { silent?: boolean; force?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchProductCatalog({ force: opts?.force });
      if (!mountedRef.current) return;
      setProducts(data);
      setError(null);
      hasLoadedRef.current = true;
    } catch (err) {
      if (!mountedRef.current) return;
      setError(
        err instanceof Error ? err.message : "Unable to load products right now.",
      );
    } finally {
      if (mountedRef.current && !opts?.silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load({ silent: hasLoadedRef.current });
    }, [load]),
  );

  const refetch = useCallback(async () => {
    invalidateProductCatalog();
    await load({ force: true });
  }, [load]);

  return { products, loading, error, refetch };
}

/* ------------------------------------------------------------------ */
/* useCollectionProducts — products curated for a marketing slug      */
/* ------------------------------------------------------------------ */

type CollectionState = {
  products: CatalogProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useCollectionProducts(slug: string): CollectionState {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const loadedSlugRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean; force?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const data = await fetchProductsForCollection(slug, {
          force: opts?.force,
        });
        if (!mountedRef.current) return;
        setProducts(data);
        setError(null);
        loadedSlugRef.current = slug;
      } catch (err) {
        if (!mountedRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this collection right now.",
        );
      } finally {
        if (mountedRef.current && !opts?.silent) setLoading(false);
      }
    },
    [slug],
  );

  useFocusEffect(
    useCallback(() => {
      const silent = loadedSlugRef.current === slug;
      void load({ silent });
    }, [load, slug]),
  );

  const refetch = useCallback(async () => {
    invalidateProductCatalog();
    await load({ force: true });
  }, [load]);

  return { products, loading, error, refetch };
}

/* ------------------------------------------------------------------ */
/* useProductSearch — debounced live search over the catalog          */
/* ------------------------------------------------------------------ */

type SearchState = {
  results: CatalogProduct[];
  loading: boolean;
  error: string | null;
};

const SEARCH_DEBOUNCE_MS = 300;

const FILTER_CACHE_TTL_MS = 45_000;
const FILTER_CACHE_MAX = 48;

type FilterCacheEntry = {
  at: number;
  rows: CatalogProduct[];
  productRef: CatalogProduct[];
};

const filterCatalogCache = new Map<string, FilterCacheEntry>();

function filterCatalogCached(
  products: CatalogProduct[],
  trimmed: string,
): CatalogProduct[] {
  const key = trimmed.toLowerCase();
  const now = Date.now();
  const hit = filterCatalogCache.get(key);
  if (
    hit &&
    hit.productRef === products &&
    now - hit.at < FILTER_CACHE_TTL_MS
  ) {
    return hit.rows;
  }
  const rows = filterCatalog(products, trimmed);
  filterCatalogCache.set(key, { at: now, rows, productRef: products });
  while (filterCatalogCache.size > FILTER_CACHE_MAX) {
    const oldest = filterCatalogCache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    filterCatalogCache.delete(oldest);
  }
  return rows;
}

export type ProductSearchState = SearchState & {
  debouncedQuery: string;
  /** True while the debounced query has not caught up to the latest input. */
  isDebouncing: boolean;
  products: CatalogProduct[];
};

export function useProductSearch(query: string): ProductSearchState {
  const { products, loading: catalogLoading, error } = useProductCatalog();
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const results = useMemo(() => {
    const trimmed = debounced.trim();
    if (!trimmed) return [];
    return filterCatalogCached(products, trimmed);
  }, [debounced, products]);

  const trimmedQuery = query.trim();
  const trimmedDebounced = debounced.trim();
  const isDebouncing =
    trimmedQuery.length > 0 && trimmedQuery !== trimmedDebounced;

  return {
    results,
    loading: catalogLoading && products.length === 0,
    error,
    debouncedQuery: debounced,
    isDebouncing,
    products,
  };
}
