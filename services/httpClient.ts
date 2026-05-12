import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';

import { supabase } from '@/lib/supabaseClient';

import { ApiError } from './apiError';

/**
 * Normalize EXPO_PUBLIC_API_URL so both `http://host:5105` and `http://host:5105/api` work
 * (paths in this app are always `/api/...`).
 */
export function normalizeExpoPublicApiUrl(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  let s = raw.trim().replace(/\/+$/, '');
  if (s.toLowerCase().endsWith('/api')) {
    s = s.slice(0, -4).replace(/\/+$/, '');
  }
  return s;
}

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

let loggedBaseUrl = false;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableAxiosError(error: AxiosError): boolean {
  const code = error.code;
  if (code === 'ECONNABORTED' || code === 'ERR_NETWORK') return true;
  const status = error.response?.status;
  if (status === 502 || status === 503 || status === 504) return true;
  return false;
}

function axiosErrorToApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as { message?: string } | undefined;
    const msgFromServer = typeof body?.message === 'string' ? body.message : undefined;

    if (error.code === 'ECONNABORTED') {
      return new ApiError('Request timed out. Please retry.', 'NETWORK');
    }

    if (error.response != null && status != null) {
      return new ApiError(msgFromServer || error.message || 'Something went wrong', 'HTTP', status);
    }

    if (error.code === 'ERR_NETWORK' || !error.response) {
      const low = String(error.message || '').toLowerCase();
      if (low.includes('network')) {
        return new ApiError('Please check your internet connection and try again.', 'NETWORK');
      }
      return new ApiError('Unable to reach server. Check Wi‑Fi and that the API URL matches your Mac’s LAN IP.', 'NETWORK');
    }
  }
  const message = error instanceof Error ? error.message : 'Something went wrong';
  return new ApiError(message, 'NETWORK');
}

type ApiEnvelope<T> = { success?: boolean; message?: string; data: T };

export function getResolvedApiOrigin(): string {
  return normalizeExpoPublicApiUrl(process.env.EXPO_PUBLIC_API_URL);
}

export const API_URL = getResolvedApiOrigin();

const axiosInstance = axios.create({
  baseURL: API_URL || undefined,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: (status) => status >= 200 && status < 300,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    const origin = getResolvedApiOrigin();
    if (!origin) {
      throw new ApiError('Missing EXPO_PUBLIC_API_URL in frontend/.env', 'CONFIG');
    }
    config.baseURL = origin;

    if (__DEV__ && !loggedBaseUrl) {
      loggedBaseUrl = true;
      console.log('API URL:', origin);
    }

    if (__DEV__) {
      const path = `${config.baseURL ?? ''}${config.url ?? ''}`;
      console.log(`[api] ${String(config.method || 'get').toUpperCase()}`, path);
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // non-fatal: continue without auth header
    }

    return config;
  },
  (error) => Promise.reject(axiosErrorToApiError(error)),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

async function parseEnvelope<T>(response: AxiosResponse<ApiEnvelope<T> | unknown>): Promise<T> {
  const payload = response.data as ApiEnvelope<T>;
  if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
    throw new ApiError(typeof payload.message === 'string' ? payload.message : 'Something went wrong', 'HTTP', response.status);
  }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  throw new ApiError('Something went wrong while reading server response.', 'INVALID_RESPONSE', response.status);
}

export async function apiRequest<T>(config: AxiosRequestConfig, extraHeaders?: Record<string, string>): Promise<T> {
  const origin = getResolvedApiOrigin();
  if (!origin) {
    throw new ApiError('Missing EXPO_PUBLIC_API_URL in frontend/.env', 'CONFIG');
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axiosInstance.request<ApiEnvelope<T>>({
        ...config,
        headers: { ...config.headers, ...extraHeaders },
      });
      return await parseEnvelope<T>(response);
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) break;
      if (axios.isAxiosError(err) && isRetriableAxiosError(err)) {
        if (__DEV__) {
          console.warn(`[api] retry ${attempt + 1}/${MAX_RETRIES}`, err.code, err.message);
        }
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
        continue;
      }
      break;
    }
  }
  throw axiosErrorToApiError(lastError);
}
