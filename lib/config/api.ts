import { appConfig, normalizeExpoPublicApiUrl } from '@/lib/appConfig';

/**
 * Production backend origin (no `/api` suffix).
 * Override at build/runtime via EXPO_PUBLIC_API_URL.
 */
export const DEFAULT_PRODUCTION_BASE_URL = 'http://168.144.83.229:5106';

/** Resolved API origin used by axios/fetch (env → appConfig → production default). */
export const BASE_URL =
  appConfig.apiUrl || normalizeExpoPublicApiUrl(DEFAULT_PRODUCTION_BASE_URL);

export { normalizeExpoPublicApiUrl };
