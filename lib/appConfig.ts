import Constants from 'expo-constants';

type ExtraConfig = {
  expoPublicSupabaseUrl?: string;
  expoPublicSupabaseAnonKey?: string;
  expoPublicApiUrl?: string;
  expoPublicDevAuth?: string;
};

function readExtra(key: keyof ExtraConfig): string | undefined {
  const extra = Constants.expoConfig?.extra as ExtraConfig | undefined;
  const value = extra?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readEnv(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (typeof fromProcess === 'string' && fromProcess.trim()) {
    return fromProcess.trim();
  }
  const extraMap: Record<string, keyof ExtraConfig> = {
    EXPO_PUBLIC_SUPABASE_URL: 'expoPublicSupabaseUrl',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'expoPublicSupabaseAnonKey',
    EXPO_PUBLIC_API_URL: 'expoPublicApiUrl',
    EXPO_PUBLIC_DEV_AUTH: 'expoPublicDevAuth',
  };
  const extraKey = extraMap[name];
  if (extraKey) return readExtra(extraKey);
  return undefined;
}

export function normalizeExpoPublicApiUrl(raw: string | undefined): string {
  if (!raw?.trim()) return '';
  let s = raw.trim().replace(/\/+$/, '');
  if (s.toLowerCase().endsWith('/api')) {
    s = s.slice(0, -4).replace(/\/+$/, '');
  }
  return s;
}

function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local');
  } catch {
    return false;
  }
}

export const appConfig = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL') ?? '',
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') ?? '',
  apiUrl: normalizeExpoPublicApiUrl(readEnv('EXPO_PUBLIC_API_URL')),
  devAuth: String(readEnv('EXPO_PUBLIC_DEV_AUTH') ?? 'false').toLowerCase() === 'true',
};

export function isSupabaseConfigured(): boolean {
  return Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
}

export function isApiConfigured(): boolean {
  return Boolean(appConfig.apiUrl);
}

export type AppConfigIssue = {
  id: 'supabase' | 'api' | 'api_localhost';
  message: string;
};

export function getAppConfigIssues(): AppConfigIssue[] {
  const issues: AppConfigIssue[] = [];
  if (!isSupabaseConfigured()) {
    issues.push({
      id: 'supabase',
      message:
        'Missing Supabase configuration (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY). Set them in EAS environment variables for preview builds.',
    });
  }
  if (!isApiConfigured()) {
    issues.push({
      id: 'api',
      message:
        'Missing API URL (EXPO_PUBLIC_API_URL). Preview APKs cannot reach a Mac LAN IP unless you are on the same Wi‑Fi; configure a reachable API URL in EAS.',
    });
  } else if (isLocalhostUrl(appConfig.apiUrl)) {
    issues.push({
      id: 'api_localhost',
      message:
        'EXPO_PUBLIC_API_URL points to localhost, which is not reachable from a physical device. Use your machine LAN IP or a deployed API URL.',
    });
  }
  return issues;
}

export function logStartupConfig(): void {
  const issues = getAppConfigIssues();
  console.log('[startup] config', {
    supabase: isSupabaseConfigured(),
    api: isApiConfigured() ? appConfig.apiUrl : '(missing)',
    devAuth: appConfig.devAuth,
    issueCount: issues.length,
  });
  if (issues.length > 0) {
    console.warn('[startup] configuration issues:', issues.map((i) => i.message).join(' | '));
  }
}
