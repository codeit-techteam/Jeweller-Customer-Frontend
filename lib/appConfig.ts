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

function isLocalhostHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h.endsWith('.local');
}

function isLocalhostUrl(url: string): boolean {
  try {
    return isLocalhostHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Metro / Expo dev server host — same machine the phone must use for the API. */
function getMetroBundlerHostname(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  if (typeof hostUri === 'string' && hostUri.trim()) {
    const host = hostUri.split(':')[0]?.trim();
    if (host && !isLocalhostHost(host)) return host;
  }

  const expoGo = Constants.expoGoConfig as { debuggerHost?: string } | null | undefined;
  const debuggerHost = expoGo?.debuggerHost;
  if (typeof debuggerHost === 'string' && debuggerHost.trim()) {
    const host = debuggerHost.split(':')[0]?.trim();
    if (host && !isLocalhostHost(host)) return host;
  }

  const legacyDebuggerHost = (
    Constants as { manifest?: { debuggerHost?: string } }
  ).manifest?.debuggerHost;
  if (typeof legacyDebuggerHost === 'string' && legacyDebuggerHost.trim()) {
    const host = legacyDebuggerHost.split(':')[0]?.trim();
    if (host && !isLocalhostHost(host)) return host;
  }

  return undefined;
}

function resolveApiUrl(configuredRaw: string | undefined): string {
  const configured = normalizeExpoPublicApiUrl(configuredRaw);

  // Honor any explicit non-localhost URL (production VPS, LAN IP, etc.) on all platforms.
  if (configured && !isLocalhostUrl(configured)) {
    return configured;
  }

  // Dev fallback: derive API host from Metro when env points to localhost or is unset.
  if (__DEV__) {
    const metroHost = getMetroBundlerHostname();
    if (metroHost) {
      let port = '5106';
      if (configured) {
        try {
          const parsed = new URL(
            configured.startsWith('http') ? configured : `http://${configured}`,
          );
          if (parsed.port) port = parsed.port;
        } catch {
          /* keep default port */
        }
      }
      return normalizeExpoPublicApiUrl(`http://${metroHost}:${port}`);
    }
  }

  return configured;
}

export const appConfig = {
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL') ?? '',
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') ?? '',
  apiUrl: resolveApiUrl(readEnv('EXPO_PUBLIC_API_URL')),
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
  const metroHost = __DEV__ ? getMetroBundlerHostname() : undefined;
  console.log('[startup] config', {
    supabase: isSupabaseConfigured(),
    api: isApiConfigured() ? appConfig.apiUrl : '(missing)',
    apiFromMetro: __DEV__ && Boolean(metroHost),
    devAuth: appConfig.devAuth,
    issueCount: issues.length,
  });
  if (issues.length > 0) {
    console.warn('[startup] configuration issues:', issues.map((i) => i.message).join(' | '));
  }
}
