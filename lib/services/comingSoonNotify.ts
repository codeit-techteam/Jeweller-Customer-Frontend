import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/context/AuthContext';
import type { ComingSoonPlanId } from '@/lib/config/comingSoonPlans';
import { getSupabase } from '@/lib/supabaseClient';

const LOCAL_KEY = '@coming_soon_notify_v1';
const REMOTE_TABLE = 'feature_launch_interests';

type LocalPayload = {
  interests: ComingSoonPlanId[];
  updatedAt: string;
};

async function readLocal(): Promise<Set<ComingSoonPlanId>> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as LocalPayload;
    return new Set(Array.isArray(parsed.interests) ? parsed.interests : []);
  } catch {
    return new Set();
  }
}

async function writeLocal(interests: Set<ComingSoonPlanId>): Promise<void> {
  const payload: LocalPayload = {
    interests: [...interests],
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
}

/** Best-effort remote insert when `feature_launch_interests` exists and RLS allows. */
async function tryRemoteInterest(
  planId: ComingSoonPlanId,
  userId: string | null,
  phone: string | null,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const row: Record<string, string> = {
    feature_key: planId,
    source: 'mobile_app',
  };
  if (userId) row.user_id = userId;
  if (phone) row.phone = phone;

  const { error } = await supabase.from(REMOTE_TABLE).insert(row);
  if (error) {
    if (__DEV__) {
      console.warn('[comingSoonNotify] remote insert skipped:', error.message);
    }
    return false;
  }
  return true;
}

export async function registerComingSoonInterest(
  planId: ComingSoonPlanId,
  options?: { userId?: string | null; phone?: string | null },
): Promise<'remote' | 'local'> {
  const interests = await readLocal();
  interests.add(planId);
  await writeLocal(interests);

  const savedRemote = await tryRemoteInterest(
    planId,
    options?.userId ?? null,
    options?.phone ?? null,
  );
  return savedRemote ? 'remote' : 'local';
}

export function useComingSoonNotify() {
  const { user } = useAuth();

  return (planId: ComingSoonPlanId) =>
    registerComingSoonInterest(planId, {
      userId: user?.id ?? null,
      phone: user?.phone ?? null,
    });
}
