import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { appConfig } from "@/lib/appConfig";
import { getSupabase } from "@/lib/supabaseClient";
import {
    getUserById,
    loginUser,
    signupUser,
    updateUserProfile,
    uploadProfileImage as uploadProfileImageToStorage,
    verifyDevOtp,
} from "@/services/authService";

const SESSION_KEY = "user_session";
const DEV_AUTH_ENABLED = appConfig.devAuth;

export type AuthUser = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  profile_image: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (phone: string) => Promise<"ok" | "not-found">;
  signup: (
    fullName: string,
    email: string,
    phone: string,
    imageUri?: string,
  ) => Promise<"ok" | "exists">;
  verifyOtp: (
    phone: string,
    otp: string,
    extra?: { fullName?: string; email?: string },
  ) => Promise<"ok" | "invalid-otp">;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
  saveProfile: (updates: {
    full_name?: string;
    email?: string | null;
    phone?: string;
  }) => Promise<void>;
  uploadProfileImage: (imageUri: string) => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePhone(raw: string): string {
  const digits = digitsOnly(raw).slice(-10);
  return digits;
}

function mapRowToUser(row: any): AuthUser {
  return {
    id: row.id,
    full_name: row.full_name ?? "Guest",
    email: row.email ?? null,
    phone: row.phone,
    profile_image: row.profile_image ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      await hydrateInternal();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hydrateInternal = async (): Promise<AuthUser | null> => {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) {
        setUser(null);
        setLoading(false);
        return null;
      }
      const parsed = JSON.parse(raw) as AuthUser & { isLoggedIn?: boolean };
      if (!parsed || !parsed.id || !parsed.phone) {
        setUser(null);
        return null;
      } else {
        const hydratedUser = {
          id: parsed.id,
          full_name: parsed.full_name,
          email: parsed.email ?? null,
          phone: parsed.phone,
          profile_image: parsed.profile_image ?? null,
        };
        setUser(hydratedUser);
        return hydratedUser;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const persistSession = async (u: AuthUser | null) => {
    if (!u) {
      await AsyncStorage.removeItem(SESSION_KEY);
      setUser(null);
      return;
    }
    const payload = { ...u, isLoggedIn: true };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    setUser(u);
  };

  const login = async (phoneRaw: string): Promise<"ok" | "not-found"> => {
    const phoneDigits = normalizePhone(phoneRaw);
    const row = await loginUser(phoneDigits);
    if (!row) return "not-found";
    return "ok";
  };

  const signup = async (
    fullName: string,
    email: string,
    phoneRaw: string,
    imageUri?: string,
  ): Promise<"ok" | "exists"> => {
    const phoneDigits = normalizePhone(phoneRaw);
    try {
      const created = await signupUser(fullName, email, phoneDigits);
      if (imageUri) {
        await uploadProfileImageToStorage(created.id, imageUri);
      }
      return "ok";
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        e.message.includes("Phone number already registered")
      ) {
        return "exists";
      }
      throw e;
    }
  };

  const verifyOtp = async (
    phoneRaw: string,
    otp: string,
    extra?: { fullName?: string; email?: string },
  ): Promise<"ok" | "invalid-otp"> => {
    if (!DEV_AUTH_ENABLED) {
      throw new Error(
        "verifyOtp via AuthContext is only supported in dev auth mode.",
      );
    }

    if (!verifyDevOtp(otp)) {
      return "invalid-otp";
    }

    const phoneDigits = normalizePhone(phoneRaw);

    const row = await loginUser(phoneDigits);
    if (!row) {
      // If user signed up but insert failed earlier, create now (still dev mode).
      const created = await signupUser(
        extra?.fullName ?? "Guest",
        extra?.email ?? "",
        phoneDigits,
      );
      const u = mapRowToUser(created);
      await persistSession(u);
      return "ok";
    }

    const u = mapRowToUser(row);
    await persistSession(u);
    return "ok";
  };

  const logout = async () => {
    try {
      const client = getSupabase();
      if (client) {
        await client.auth.signOut();
      }
    } catch (e) {
      console.warn("[AuthContext] signOut failed (continuing local logout)", e);
    }
    const allKeys = await AsyncStorage.getAllKeys();
    const sessionKeys = allKeys.filter(
      (key) => key === SESSION_KEY || key.toLowerCase().includes("supabase"),
    );
    if (sessionKeys.length > 0) {
      await AsyncStorage.multiRemove(sessionKeys);
    }
    await persistSession(null);
  };

  const updateUser = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    const next = { ...user, ...updates };
    await persistSession(next);
  };

  const saveProfile = async (updates: {
    full_name?: string;
    email?: string | null;
    phone?: string;
  }) => {
    if (!user) return;
    const row = await updateUserProfile(user.id, updates);
    await persistSession(mapRowToUser(row));
  };

  const uploadProfileImage = async (imageUri: string): Promise<string> => {
    if (!user) {
      throw new Error("You must be logged in to upload a profile image.");
    }
    const imageUrl = await uploadProfileImageToStorage(user.id, imageUri);
    await updateUser({ profile_image: imageUrl });
    return imageUrl;
  };

  const hydrate = async () => {
    const hydratedUser = await hydrateInternal();
    if (!hydratedUser?.id) return;
    try {
      const latest = await getUserById(hydratedUser.id);
      if (latest) {
        await persistSession(mapRowToUser(latest));
      }
    } catch {
      // No-op: keep last known session payload if fetch fails.
    }
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      loading,
      isLoggedIn: !!user,
      login,
      signup,
      verifyOtp,
      logout,
      hydrate,
      updateUser,
      saveProfile,
      uploadProfileImage,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
