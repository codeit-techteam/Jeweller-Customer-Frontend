import { useEffect } from "react";

import { useUserLocationStore } from "@/lib/stores/userLocationStore";

/**
 * Starts foreground location once at app root so GPS is ready before deep screens mount.
 */
export function UserLocationBootstrap() {
  useEffect(() => {
    void useUserLocationStore.getState().init();
  }, []);
  return null;
}
