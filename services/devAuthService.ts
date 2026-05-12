import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabaseClient';

const DEV_AUTH_ENABLED = String(process.env.EXPO_PUBLIC_DEV_AUTH).toLowerCase() === 'true';

export const DEV_TEST_PHONE_E164 = '+918240890242';
export const DEV_TEST_PHONE_DIGITS = '8240890242';
export const DEV_TEST_OTP = '123456';
export const DEV_TEST_UUID = '00000000-0000-0000-0000-000000000001';

export type DevUser = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  isTestUser: true;
};

export type DevSession = {
  user: DevUser;
  createdAt: string;
};

const STORAGE_KEY = 'DEV_AUTH_SESSION_V1';

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

function toE164Indian(raw: string): string {
  const digits = digitsOnly(raw).slice(-10);
  if (digits.length !== 10) throw new Error('Invalid phone number');
  return `+91${digits}`;
}

function assertDevMode() {
  if (!DEV_AUTH_ENABLED) {
    throw new Error('Dev auth is disabled');
  }
}

export async function sendTestOTP(phoneRaw: string): Promise<{ success: true }> {
  assertDevMode();
  const e164 = toE164Indian(phoneRaw);
  if (e164 !== DEV_TEST_PHONE_E164) {
    throw new Error('This phone number is not allowed in dev auth mode.');
  }
  // No SMS provider required — simulate success
  return { success: true };
}

export async function verifyTestOTP(phoneRaw: string, otp: string): Promise<DevSession> {
  assertDevMode();
  const e164 = toE164Indian(phoneRaw);
  if (e164 !== DEV_TEST_PHONE_E164) {
    throw new Error('This phone number is not allowed in dev auth mode.');
  }
  if (otp !== DEV_TEST_OTP) {
    throw new Error('Invalid OTP');
  }

  const session: DevSession = {
    user: {
      id: 'test-user-001',
      full_name: 'Sumit Kumar',
      phone: DEV_TEST_PHONE_E164,
      email: 'piyush123@gmail.com',
      isTestUser: true,
    },
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));

  // Best-effort: write a profile row for testing flows that read from DB.
  // This may fail under RLS (unauthenticated) — dev auth still proceeds.
  await upsertTestProfile().catch(() => {});

  return session;
}

export async function getTestSession(): Promise<DevSession | null> {
  assertDevMode();
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DevSession;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  if (!DEV_AUTH_ENABLED) return;
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function upsertTestProfile() {
  const payload = {
    id: DEV_TEST_UUID,
    full_name: 'Sumit Kumar',
    phone: DEV_TEST_PHONE_E164,
    email: 'piyush123@gmail.com',
    avatar_url: null,
  };

  const { error } = await supabase.from('users_profile').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

