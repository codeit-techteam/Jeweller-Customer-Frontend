import type { Router } from "expo-router";

type ExitOptions = {
  /** Fallback when there is nothing to pop (e.g. opened from permission flow). */
  fallbackHref?: "/(app)/boutiques" | "/(app)/home";
};

/** Avoids dev "GO_BACK was not handled" when the selector is the only stack frame. */
export function exitScreen(router: Router, opts?: ExitOptions) {
  const fallback = opts?.fallbackHref ?? "/(app)/boutiques";
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
