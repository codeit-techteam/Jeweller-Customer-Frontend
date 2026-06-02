import { useCallback, useMemo, useRef, useState } from "react";
import { RefreshControl, type RefreshControlProps } from "react-native";

/** Matches notifications screen accent. */
export const PULL_TO_REFRESH_TINT = "#1e40af";

export type PullToRefreshOptions = {
  tintColor?: string;
  /** Android progress spinner colors */
  colors?: string[];
  /** When false, `refreshControl` is undefined */
  enabled?: boolean;
};

/**
 * Pull-to-refresh helper for ScrollView / FlatList.
 * Deduplicates concurrent refresh calls and drives RefreshControl state.
 */
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  options?: PullToRefreshOptions,
) {
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setRefreshing(true);
    try {
      await onRefreshRef.current();
    } finally {
      inFlightRef.current = false;
      setRefreshing(false);
    }
  }, []);

  const refreshControl = useMemo(() => {
    if (options?.enabled === false) return undefined;
    const props: RefreshControlProps = {
      refreshing,
      onRefresh: () => void refresh(),
      tintColor: options?.tintColor ?? PULL_TO_REFRESH_TINT,
    };
    if (options?.colors?.length) {
      props.colors = options.colors;
    }
    return <RefreshControl {...props} />;
  }, [refreshing, refresh, options?.enabled, options?.tintColor, options?.colors]);

  return { refreshing, refresh, refreshControl };
}
