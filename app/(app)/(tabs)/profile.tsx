import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileHeader } from '@/lib/components/common/ProfileHeader';
import { ProfileMenuItem } from '@/lib/components/common/ProfileMenuItem';
import { BottomTabBar } from '@/src/components/navigation/BottomTabBar';
import { fontSizes, spacing } from '@/src/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAuthGuard } from '@/src/hooks/useAuthGuard';
import { useGuestLogout } from '@/src/hooks/useGuestLogout';
import { ProfileSkeletonLoader } from '@/components/loaders';
import { useNotificationsStore } from '@/lib/stores/notificationsStore';

const NAVY = '#1a2b3c';
const MUTED = '#707070';
const BADGE_BG = '#f1f3f5';
const TEAL_BG = '#5a9aa0';
const GOLD = '#c29a33';

type LockedCardProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
};

function LockedProfileCard({ icon, title, subtitle, onPress }: LockedCardProps) {
  return (
    <Pressable style={styles.lockedCard} onPress={onPress}>
      <View style={styles.lockedIconWrap}>
        <MaterialIcons name={icon} size={22} color={NAVY} />
      </View>
      <View style={styles.lockedTextWrap}>
        <Text style={styles.lockedTitle}>{title}</Text>
        <Text style={styles.lockedSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="lock" size={18} color={GOLD} />
    </Pressable>
  );
}

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, loading, uploadProfileImage, isGuest, isAuthenticated, hydrate } = useAuth();
  const performGuestLogout = useGuestLogout();
  const unreadNotificationsCount = useNotificationsStore((s) => s.unreadCount);
  const refreshNotifications = useNotificationsStore((s) => s.refresh);
  const requireAuth = useAuthGuard();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const userDisplay = useMemo(
    () => ({
      name: user?.full_name || 'Guest User',
      phone: user?.phone ? `+91 ${user.phone}` : 'No phone number',
      email: user?.email || 'No email',
      image: user?.profile_image ?? null,
      initials:
        (user?.full_name || 'Guest User')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join('') || 'GU',
    }),
    [user],
  );

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  }, [router]);

  const onLogoutPress = useCallback(() => {
    setLogoutModalVisible(true);
  }, []);

  const onSettings = useCallback(() => {
    requireAuth(() => router.push('/(app)/edit-profile'), {
      pendingAction: { type: 'route', pathname: '/(app)/edit-profile' },
    });
  }, [requireAuth, router]);

  const onLoginPress = useCallback(() => {
    router.push('/(auth)/login');
  }, [router]);

  const onCreateAccountPress = useCallback(() => {
    router.push('/(auth)/create-account');
  }, [router]);

  const onEditPhoto = useCallback(async () => {
    if (!user || uploadingImage) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission required', 'Please allow gallery access to upload your profile image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setUploadingImage(true);
    try {
      await uploadProfileImage(result.assets[0].uri);
      Alert.alert('Success', 'Profile image updated.');
    } catch {
      Alert.alert('Upload failed', 'Unable to upload image right now. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }, [user, uploadingImage, uploadProfileImage]);

  const onConfirmLogout = useCallback(async () => {
    setLogoutModalVisible(false);
    await performGuestLogout();
  }, [performGuestLogout]);

  const guardRoute = useCallback(
    (pathname: string) => {
      requireAuth(() => router.push(pathname as never), {
        pendingAction: { type: 'route', pathname },
      });
    },
    [requireAuth, router],
  );

  const { refreshControl } = usePullToRefresh(
    useCallback(async () => {
      await Promise.all([
        hydrate(),
        isAuthenticated ? refreshNotifications() : Promise.resolve(),
      ]);
    }, [hydrate, isAuthenticated, refreshNotifications]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <ProfileHeader
          onBack={onBack}
          onSettings={isAuthenticated ? onSettings : undefined}
        />

        {loading ? (
          <ProfileSkeletonLoader />
        ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
        <View style={styles.avatarBlock}>
          <View style={styles.avatarOuter}>
            {userDisplay.image ? (
              <Image source={{ uri: userDisplay.image }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{userDisplay.initials}</Text>
              </View>
            )}
            {isAuthenticated ? (
              <Pressable style={styles.editFab} onPress={onEditPhoto} hitSlop={8}>
                <MaterialIcons name={uploadingImage ? 'hourglass-top' : 'edit'} size={16} color="#fff" />
              </Pressable>
            ) : null}
          </View>
          {isAuthenticated ? (
            <>
              <Text style={styles.name}>{userDisplay.name}</Text>
              <Text style={styles.phone}>{userDisplay.phone}</Text>
              <Text style={styles.phone}>{userDisplay.email}</Text>
              <View style={styles.memberBadge}>
                <MaterialIcons name="check-circle" size={14} color={MUTED} />
                <Text style={styles.memberText}>VERIFIED ACCOUNT</Text>
              </View>
            </>
          ) : (
            <View style={styles.guestWelcomeBlock}>
              <Text style={styles.guestWelcomeTitle}>Welcome to GehnaHub</Text>
              <Text style={styles.guestWelcomeBody}>
                Sign in to book appointments, save boutiques, and receive exclusive offers.
              </Text>
              <Pressable
                style={[styles.guestActionBtnBase, styles.loginBtn]}
                onPress={onLoginPress}
              >
                <MaterialIcons name="login" size={18} color="#fff" />
                <Text style={styles.loginBtnText}>Login</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.guestActionBtnBase,
                  styles.createAccountBtn,
                  pressed && styles.createAccountBtnPressed,
                ]}
                onPress={onCreateAccountPress}
              >
                <Text style={styles.createAccountBtnText}>Create Account</Text>
              </Pressable>
            </View>
          )}
        </View>

        {isGuest ? (
          <View style={styles.menuBlock}>
            <LockedProfileCard
              icon="favorite-border"
              title="Wishlist"
              subtitle="Login to save products"
              onPress={() => guardRoute('/(app)/wishlist')}
            />
            <LockedProfileCard
              icon="event"
              title="Appointments"
              subtitle="Login to book visits"
              onPress={() => guardRoute('/(app)/appointments')}
            />
            <LockedProfileCard
              icon="storefront"
              title="Saved Boutiques"
              subtitle="Login to save boutiques"
              onPress={() => guardRoute('/(app)/saved-boutiques')}
            />
          </View>
        ) : (
          <>
            <View style={styles.menuBlock}>
              <ProfileMenuItem
                icon="storefront"
                title="Saved Boutiques"
                onPress={() => router.push('/(app)/saved-boutiques')}
              />
              <ProfileMenuItem
                icon="favorite-border"
                title="Wishlist"
                onPress={() => router.push('/(app)/wishlist')}
              />
              <ProfileMenuItem
                icon="event"
                title="My Appointments"
                onPress={() => router.push('/(app)/appointments')}
              />
              <ProfileMenuItem
                icon="notifications-none"
                title="Notifications"
                badgeCount={unreadNotificationsCount}
                onPress={() => router.push('/(app)/notifications')}
              />
              <ProfileMenuItem
                icon="tune"
                title="Notification Settings"
                onPress={() => router.push('/(app)/notification-settings')}
              />
            </View>

            <Text style={styles.sectionEyebrow}>ACCOUNT ACTIONS</Text>
            <View style={styles.accountBlock}>
              <ProfileMenuItem
                icon="location-on"
                title="Saved Addresses"
                onPress={() => router.push('/(app)/address')}
              />
              <ProfileMenuItem
                icon="shield"
                title="Account Privacy"
                onPress={() => router.push('/(app)/edit-profile')}
              />
              <ProfileMenuItem
                icon="logout"
                title="Logout"
                showChevron={false}
                variant="danger"
                onPress={onLogoutPress}
              />
            </View>
          </>
        )}

        <Text style={styles.version}>GehnaHub v2.4.1</Text>
        <View style={styles.footerLinks}>
          <Pressable onPress={() => console.log('privacy')}>
            <Text style={styles.footerLink}>PRIVACY</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => console.log('terms')}>
            <Text style={styles.footerLink}>TERMS</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => console.log('support')}>
            <Text style={styles.footerLink}>SUPPORT</Text>
          </Pressable>
        </View>

        </ScrollView>
        )}
      </View>

      <BottomTabBar />
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.logoutOverlay}>
          <BlurView intensity={26} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.logoutCard}>
            <Text style={styles.logoutTitle}>Logout Confirmation</Text>
            <Text style={styles.logoutBody}>Are you sure you want to logout from your account?</Text>
            <View style={styles.logoutActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.logoutBtn} onPress={onConfirmLogout}>
                <Text style={styles.logoutBtnText}>Logout</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  body: { flex: 1 },
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  avatarBlock: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  avatarOuter: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: TEAL_BG,
    marginBottom: spacing.lg,
    overflow: 'visible',
  },
  avatarImg: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: TEAL_BG,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEAL_BG,
  },
  avatarInitials: { fontSize: 32, color: '#fff', fontWeight: '700' },
  editFab: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 4,
  },
  phone: { fontSize: fontSizes.sm, color: MUTED, marginBottom: spacing.md },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: BADGE_BG,
  },
  guestBadge: {
    backgroundColor: 'rgba(194,154,51,0.12)',
    marginTop: spacing.sm,
  },
  memberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4a5568',
    letterSpacing: 0.6,
  },
  guestBadgeText: { color: GOLD },
  guestWelcomeBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  guestWelcomeTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  guestWelcomeBody: {
    fontSize: fontSizes.sm,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  guestActionBtnBase: {
    width: '100%',
    maxWidth: 280,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: 999,
  },
  loginBtn: {
    backgroundColor: NAVY,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '700',
    lineHeight: 20,
    includeFontPadding: false,
  },
  createAccountBtn: {
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: '#fff',
  },
  createAccountBtnPressed: {
    opacity: 0.9,
    backgroundColor: 'rgba(10,31,68,0.04)',
  },
  createAccountBtnText: {
    color: NAVY,
    fontSize: fontSizes.md,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  menuBlock: { marginBottom: spacing.lg },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F6F7F9',
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaed',
  },
  lockedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  lockedTextWrap: { flex: 1 },
  lockedTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: NAVY,
  },
  lockedSubtitle: {
    fontSize: fontSizes.xs,
    color: MUTED,
    marginTop: 2,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  accountBlock: { marginBottom: spacing.xl },
  version: {
    textAlign: 'center',
    fontSize: 10,
    color: '#b0b8c1',
    marginBottom: spacing.md,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  footerLink: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b95a1',
    letterSpacing: 0.8,
  },
  footerDot: { fontSize: 10, color: '#c5ccd4' },
  logoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,15,30,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoutCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  logoutTitle: { fontSize: 19, fontWeight: '800', color: '#111827', marginBottom: 10 },
  logoutBody: { fontSize: 14, color: '#4b5563', lineHeight: 21, marginBottom: 18 },
  logoutActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  logoutBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
