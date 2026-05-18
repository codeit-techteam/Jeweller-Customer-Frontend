/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

module.exports = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const devAuth = process.env.EXPO_PUBLIC_DEV_AUTH ?? 'false';

  return {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      expoPublicSupabaseUrl: supabaseUrl,
      expoPublicSupabaseAnonKey: supabaseAnonKey,
      expoPublicApiUrl: apiUrl,
      expoPublicDevAuth: devAuth,
    },
  };
};
