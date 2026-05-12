import { supabase } from "../lib/supabaseClient";

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_image: string | null;
  created_at: string;
};

const DEV_AUTH_ENABLED =
  String(process.env.EXPO_PUBLIC_DEV_AUTH).toLowerCase() === "true";

function formatIndianPhoneToE164(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    throw new Error("Invalid Indian mobile number");
  }
  return `+91${digits}`;
}

function cleanPhone(raw: string): string {
  return raw.replace(/\s/g, "").replace(/\D/g, "").slice(-10);
}

// ============================
// DEV AUTH (NO SUPABASE AUTH)
// ============================

export async function signupUser(
  fullName: string,
  email: string,
  phoneRaw: string,
): Promise<UserProfile> {
  if (!DEV_AUTH_ENABLED) {
    throw new Error("signupUser is only available in dev auth mode.");
  }

  const phone = cleanPhone(phoneRaw);
  console.log("[DEV_AUTH] Creating user...", { fullName, email, phone });

  const { data: existing, error: existsError } = await supabase
    .from("users_profile")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (existsError) {
    console.log("SIGNUP ERROR:", existsError);
    throw existsError;
  }

  if (existing) {
    throw new Error("Phone number already registered");
  }

  const { data, error } = await supabase
    .from("users_profile")
    .insert([
      {
        full_name: fullName,
        email: email,
        phone: phone,
        profile_image: null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.log("SIGNUP ERROR:", error);
    throw error;
  }

  console.log("[DEV_AUTH] Signup success:", data);
  return data as UserProfile;
}

export async function loginUser(phoneRaw: string): Promise<UserProfile | null> {
  if (!DEV_AUTH_ENABLED) {
    throw new Error("loginUser is only available in dev auth mode.");
  }

  const phone = cleanPhone(phoneRaw);
  console.log("[DEV_AUTH] Login user:", { phone });

  const { data, error } = await supabase
    .from("users_profile")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (error) {
    console.log("LOGIN ERROR:", error);
    throw error;
  }

  return (data as UserProfile | null) ?? null;
}

export function verifyDevOtp(otpRaw: string): boolean {
  return otpRaw.replace(/\D/g, "") === "123456";
}

export async function uploadProfileImage(
  userId: string,
  imageUri: string,
): Promise<string> {
  const filePath = `profiles/${userId}.jpg`;
  const imageResponse = await fetch(imageUri);
  const fileBuffer = await imageResponse.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("user-profiles")
    .upload(filePath, fileBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("user-profiles")
    .getPublicUrl(filePath);
  const imageUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("users_profile")
    .update({
      profile_image: imageUrl,
    })
    .eq("id", userId);

  if (updateError) throw updateError;

  return imageUrl;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    full_name?: string;
    email?: string | null;
    phone?: string;
    profile_image?: string | null;
  },
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("users_profile")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

// ============================
// REAL SUPABASE PHONE AUTH
// ============================

export async function sendOTP(rawPhone: string) {
  const phone = formatIndianPhoneToE164(rawPhone);

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      channel: "sms",
    },
  });

  if (error) {
    throw error;
  }
}

type VerifyOtpOptions = {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
};

export async function verifyOTP(
  rawPhone: string,
  otp: string,
  options: VerifyOtpOptions = {},
) {
  const phone = formatIndianPhoneToE164(rawPhone);

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: "sms",
  });

  if (error) {
    throw error;
  }

  const user = data.user;
  if (!user) {
    throw new Error("Authentication failed – no user returned");
  }

  return {
    user,
    session: data.session,
  };
}
