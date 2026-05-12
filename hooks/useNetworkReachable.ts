import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** `null` means still measuring; assume online until proven otherwise in UI copy. */
export function useNetworkReachable(): boolean | null {
  const [reachable, setReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const apply = (state: NetInfoState) => {
      const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
      setReachable(online);
    };
    let cancelled = false;
    void NetInfo.fetch().then((state) => {
      if (!cancelled) apply(state);
    });
    const unsub = NetInfo.addEventListener(apply);
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return reachable;
}
