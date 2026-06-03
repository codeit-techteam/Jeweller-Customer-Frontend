import { useEffect } from "react";

import { useDiscoveryLocationStore } from "@/lib/stores/discoveryLocationStore";

/** Hydrates persisted discovery location once at app root. */
export function DiscoveryLocationBootstrap() {
  useEffect(() => {
    void useDiscoveryLocationStore.getState().hydrate();
  }, []);
  return null;
}
