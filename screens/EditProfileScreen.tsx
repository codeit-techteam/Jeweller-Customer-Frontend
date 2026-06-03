import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { showPopup } from '@/lib/stores/popupStore';
import { fontSizes, spacing } from '@/src/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useGuestLogout } from '@/src/hooks/useGuestLogout';

const NAVY_PRIMARY = '#0B1C3D';
const INPUT_BG = '#F5F6F8';
const LABEL_GREY = '#8E8E93';
const MUTED = '#707070';
const DANGER = '#c53030';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const phoneDigits = (v: string) => v.replace(/\D/g, '');

type EditProfileScreenProps = {
  onBack: () => void;
};

export default function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const router = useRouter();
  const { user, saveProfile, uploadProfileImage } = useAuth();
  const performGuestLogout = useGuestLogout();
  const [name, setName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [address, setAddress] = useState('');
  const [avatarUri, setAvatarUri] = useState(user?.profile_image ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const phoneError = useMemo(() => {
    const d = phoneDigits(phone);
    if (phone.length === 0) return 'Enter mobile number';
    if (d.length < 10) return 'Enter a valid mobile number';
    return null;
  }, [phone]);

  const emailError = useMemo(() => {
    if (email.trim().length === 0) return 'Enter email';
    if (!emailOk(email)) return 'Enter a valid email';
    return null;
  }, [email]);

  const pickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showPopup({
        type: 'error',
        title: 'Permission needed',
        message: 'Allow photo library access to change your photo.',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setUploading(true);
      try {
        const imageUrl = await uploadProfileImage(result.assets[0].uri);
        setAvatarUri(imageUrl);
      } finally {
        setUploading(false);
      }
    }
  }, [uploadProfileImage]);

  const handleSave = useCallback(async () => {
    const pe = phoneError;
    const ee = emailError;
    if (!user) {
      showPopup({
        type: 'error',
        title: 'Login required',
        message: 'Please login to update your profile.',
      });
      return;
    }
    if (pe || ee) {
      showPopup({
        type: 'error',
        title: 'Check details',
        message: [pe, ee].filter(Boolean).join('\n'),
      });
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        full_name: name.trim(),
        phone: phoneDigits(phone),
        email: email.trim(),
      });
      if (user?.id && process.env.EXPO_PUBLIC_BACKEND_API_URL) {
        void fetch(`${process.env.EXPO_PUBLIC_BACKEND_API_URL}/api/notifications/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventKey: 'profile_updated', context: { userId: user.id } }),
        }).catch(() => {});
      }
      showPopup({
        type: 'success',
        title: 'Profile updated',
        message: 'Your changes have been saved.',
      });
    } catch (e: any) {
      showPopup({
        type: 'error',
        title: 'Update failed',
        message: typeof e?.message === 'string' ? e.message : 'Could not update profile right now.',
      });
    } finally {
      setSaving(false);
    }
  }, [phoneError, emailError, user, name, phone, email, saveProfile]);

  const onLogout = useCallback(() => {
    showPopup({
      type: 'confirm',
      title: 'Logout?',
      message: 'Are you sure you want to logout from your account?',
      confirmLabel: 'Logout',
      destructive: true,
      onConfirm: async () => {
        await performGuestLogout();
      },
    });
  }, [performGuestLogout]);

  const onDeleteAccount = useCallback(() => {
    showPopup({
      type: 'confirm',
      title: 'Delete account?',
      message: 'This cannot be undone. Are you sure?',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => console.log('delete account'),
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
          <MaterialIcons name="arrow-back-ios" size={22} color="#111" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable hitSlop={12} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Save">
          <Text style={styles.headerSave}>Save</Text>
        </Pressable>
      </View>
      <View style={styles.headerRule} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <Pressable
              style={styles.editFab}
              onPress={pickAvatar}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
            >
              <MaterialIcons name="photo-camera" size={18} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.displayName}>{name || 'Guest User'}</Text>
          <Text style={styles.memberEyebrow}>{user ? 'VERIFIED ACCOUNT' : 'GUEST ACCOUNT'}</Text>
        </View>

        <View style={styles.fields}>
          <FieldBlock label="FULL NAME" icon="person-outline">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              placeholderTextColor={MUTED}
              style={styles.input}
              autoCapitalize="words"
            />
          </FieldBlock>

          <FieldBlock label="MOBILE NUMBER" icon="phone-android">
            <TextInput
              value={phone}
              onChangeText={(t) => {
                const next = t.replace(/[^\d+\s]/g, '');
                setPhone(next);
              }}
              placeholder="+91 98765 43210"
              placeholderTextColor={MUTED}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </FieldBlock>
          {phoneError && phone.length > 0 ? <Text style={styles.fieldError}>{phoneError}</Text> : null}

          <FieldBlock label="EMAIL" icon="mail-outline">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@email.com"
              placeholderTextColor={MUTED}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </FieldBlock>
          {emailError && email.length > 0 ? <Text style={styles.fieldError}>{emailError}</Text> : null}

          <FieldBlock label="ADDRESS" icon="place" optional>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Street, city (optional)"
              placeholderTextColor={MUTED}
              style={styles.input}
              multiline
            />
          </FieldBlock>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          onPress={handleSave}
        >
          <Text style={styles.primaryBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>

        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={onDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </Pressable>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldBlock({
  label,
  icon,
  optional,
  children,
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.inputBox}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {optional ? <Text style={styles.optional}> (optional)</Text> : null}
        </Text>
      </View>
      <View style={styles.inputRow}>
        {children}
        <MaterialIcons name={icon} size={22} color="#b0b8c1" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: NAVY_PRIMARY,
  },
  headerSave: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: '#111',
    minWidth: 44,
    textAlign: 'right',
  },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e8e8e8',
    marginHorizontal: spacing.lg,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#e8eef0',
  },
  editFab: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  displayName: {
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  memberEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: LABEL_GREY,
    letterSpacing: 1.2,
  },
  fields: { marginBottom: spacing.lg },
  inputBox: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  labelRow: { marginBottom: 8 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: LABEL_GREY,
    letterSpacing: 0.8,
  },
  optional: { fontWeight: '600', color: '#b0b8c1' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    color: '#111',
    paddingVertical: 0,
    minHeight: 22,
  },
  fieldError: {
    fontSize: fontSizes.xs,
    color: DANGER,
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 2,
  },
  primaryBtn: {
    backgroundColor: NAVY_PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  primaryBtnPressed: { opacity: 0.92 },
  primaryBtnText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  logoutBtn: {
    marginTop: spacing.xl,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logoutText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: NAVY_PRIMARY,
  },
  deleteBtn: { marginTop: spacing.md, paddingVertical: 12, alignItems: 'center' },
  deleteText: { fontSize: fontSizes.sm, fontWeight: '700', color: DANGER },
});
