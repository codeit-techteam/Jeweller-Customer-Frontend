import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CallbackModal } from '@/lib/components/common/CallbackModal';
import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { categoryImageUri } from '@/lib/services/mock/imageUrls';
import {
  fetchCategoriesUi,
  fetchMenuCategoriesUi,
  type CategoryUi,
  type MenuCategoryUi,
} from '@/lib/services/catalogApi';
import { fontSizes, radius, spacing } from '@/src/constants/theme';
import { useAuth } from '@/context/AuthContext';

const OPEN_MS = 280;
const CLOSE_MS = 250;
const DRAWER_WIDTH_RATIO = 0.82;

const timingOpen = { duration: OPEN_MS, easing: Easing.out(Easing.cubic) };
const timingClose = { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) };

const springClose = { damping: 26, stiffness: 280, mass: 0.85 };
const springSnapOpen = { damping: 22, stiffness: 320, mass: 0.9 };

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const SHOP_FALLBACK: Array<{
  id: string;
  title: string;
  slug: string;
  collectionSlug: string;
  icon: string | null;
  image: string | null;
  badge: string | null;
}> = [
  { id: 'fb-women', title: 'Women', slug: 'women', collectionSlug: 'women', icon: 'woman', image: null, badge: null },
  { id: 'fb-men', title: 'Men', slug: 'men', collectionSlug: 'men', icon: 'man', image: null, badge: null },
  { id: 'fb-kids', title: 'Kids & infants', slug: 'kids', collectionSlug: 'kids', icon: 'child-care', image: null, badge: null },
  { id: 'fb-offers', title: 'Offers', slug: 'offers', collectionSlug: 'offers', icon: 'local-offer', image: null, badge: 'NEW' },
  { id: 'fb-gifts', title: 'Gifts', slug: 'gifts', collectionSlug: 'gifts', icon: 'card-giftcard', image: null, badge: null },
];

const VALID_ICON_NAMES: ReadonlyArray<IconName> = [
  'woman',
  'man',
  'child-care',
  'local-offer',
  'card-giftcard',
  'storefront',
  'diamond',
  'savings',
  'event',
  'favorite',
  'star',
  'shopping-bag',
  'category',
  'auto-awesome',
  'celebration',
  'cake',
];

function resolveIcon(name: string | null | undefined): IconName {
  if (!name) return 'storefront';
  const lower = name.trim().toLowerCase();
  const match = VALID_ICON_NAMES.find((entry) => entry === lower);
  return match ?? 'storefront';
}

const GOLD_PLAN_ITEMS: { label: string; sub: string; icon: IconName; href: Href; variant: 'mine' | 'reserve' }[] = [
  { label: 'Gold Mine', sub: '10+1 Monthly Plan', icon: 'diamond', href: '/(app)/gold-mine-plan', variant: 'mine' },
  { label: 'Gold Reserve', sub: '10+1 Monthly Plan', icon: 'savings', href: '/(app)/gold-reserve-plan', variant: 'reserve' },
];

const UTILITY_ITEMS: { label: string; icon: IconName; href: Href }[] = [
  { label: 'Recently Viewed', icon: 'history', href: '/(app)/recently-viewed' },
  { label: 'Find Boutique', icon: 'storefront', href: '/(app)/boutiques' },
  { label: 'Saved Boutiques', icon: 'bookmark-border', href: '/(app)/saved-boutiques' },
  { label: 'My Appointments', icon: 'event', href: '/(app)/my-appointments' },
];

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

function userInitials(name: string | null | undefined): string {
  const value = (name || 'Guest').trim();
  const parts = value.split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => part.charAt(0).toUpperCase()).join('');
  return initials || 'GU';
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { width: winW } = useWindowDimensions();
  const [callbackModalOpen, setCallbackModalOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [shopItems, setShopItems] = useState<MenuCategoryUi[]>([]);
  const [shopLoaded, setShopLoaded] = useState(false);
  const [menuCategories, setMenuCategories] = useState<CategoryUi[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [menuRows, categoryRows] = await Promise.all([
          fetchMenuCategoriesUi(),
          fetchCategoriesUi(),
        ]);
        if (cancelled) return;
        setShopItems(menuRows);
        setMenuCategories(categoryRows);
      } catch (error) {
        if (!cancelled) console.warn('[menu] failed to load CMS data', error);
      } finally {
        if (!cancelled) setShopLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderedShopItems = useMemo(
    () =>
      shopItems.length > 0
        ? shopItems.map((row) => ({
            id: row.id,
            title: row.title,
            slug: row.slug,
            collectionSlug: row.collectionSlug,
            icon: row.icon,
            image: row.image,
            badge: row.badge,
          }))
        : SHOP_FALLBACK,
    [shopItems],
  );

  const drawerW = useSharedValue(Math.max(280, winW * DRAWER_WIDTH_RATIO));
  const translateX = useSharedValue(-Math.max(280, winW * DRAWER_WIDTH_RATIO));
  const startX = useSharedValue(0);
  const openedOnce = useRef(false);

  useLayoutEffect(() => {
    const w = Math.max(260, winW * DRAWER_WIDTH_RATIO);
    drawerW.value = w;
    if (!openedOnce.current && winW > 0) {
      openedOnce.current = true;
      translateX.value = -w;
      translateX.value = withTiming(0, timingOpen);
    }
  }, [winW, drawerW, translateX]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  }, [router]);

  const close = useCallback(() => {
    const w = drawerW.value;
    translateX.value = withTiming(-w, timingClose, (finished) => {
      if (finished) runOnJS(goBack)();
    });
  }, [drawerW, translateX, goBack]);

  const navigateAfterClose = useCallback(
    (href: Href) => {
      const w = drawerW.value;
      const runNav = () => {
        if (router.canGoBack()) {
          router.back();
          router.push(href);
        } else {
          router.replace(href);
        }
      };
      translateX.value = withTiming(-w, timingClose, (finished) => {
        if (finished) runOnJS(runNav)();
      });
    },
    [drawerW, translateX, router],
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const w = drawerW.value;
      const next = startX.value + e.translationX;
      translateX.value = Math.max(-w, Math.min(0, next));
    })
    .onEnd((e) => {
      const w = drawerW.value;
      const threshold = -w * 0.22;
      if (translateX.value < threshold || e.velocityX < -620) {
        translateX.value = withSpring(-w, springClose, (finished) => {
          if (finished) runOnJS(goBack)();
        });
      } else {
        translateX.value = withSpring(0, springSnapOpen);
      }
    });

  const drawerStyle = useAnimatedStyle(() => {
    const w = drawerW.value;
    const scale = interpolate(translateX.value, [-w, 0], [0.98, 1], Extrapolation.CLAMP);
    return {
      transform: [{ translateX: translateX.value }, { scale }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const w = drawerW.value;
    return {
      opacity: interpolate(translateX.value, [-w, 0], [0, 1], Extrapolation.CLAMP),
    };
  });

  const drawerWidth = Math.min(winW * DRAWER_WIDTH_RATIO, winW * 0.92);

  const onConfirmLogout = useCallback(async () => {
    setLogoutModalVisible(false);
    await logout();
    navigateAfterClose('/(auth)/login');
  }, [logout, navigateAfterClose]);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdropWrap, backdropStyle]} pointerEvents="box-none">
          <BlurView
            intensity={Platform.OS === 'ios' ? 32 : 24}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={styles.backdropDim} onPress={close} accessibilityRole="button" accessibilityLabel="Close menu" />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[styles.drawer, { width: drawerWidth }, drawerStyle]}
            accessibilityViewIsModal
          >
            <SafeAreaView style={styles.drawerSafe} edges={['top']}>
              <View style={styles.drawerBody}>
                <LinearGradient
                  colors={['#0b1f48', '#152a5c', '#1a3568']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.headerGradient, { marginHorizontal: spacing.md, marginTop: Math.max(8, insets.top > 20 ? 4 : 8) }]}
                >
                  <View style={styles.headerRow}>
                    <View style={styles.avatar}>
                      {user?.profile_image ? (
                        <RemoteImage uri={user.profile_image} style={styles.avatarImage} />
                      ) : (
                        <Text style={styles.avatarInitials}>{userInitials(user?.full_name)}</Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => {
                        if (user) {
                          return;
                        }
                        navigateAfterClose('/(auth)/login');
                      }}
                      style={styles.headerTextCol}
                    >
                      <Text style={styles.userName}>
                        {user ? `Welcome, ${user.full_name}` : 'Welcome, Guest'}
                      </Text>
                      <Text style={styles.userSub}>
                        {user ? formatPhone(user.phone) : 'Sign in / Register'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={close}
                      hitSlop={12}
                      style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Close menu"
                    >
                      <MaterialIcons name="close" size={22} color="rgba(255,255,255,0.85)" />
                    </Pressable>
                  </View>
                  {user ? (
                    <Pressable
                      onPress={() => setLogoutModalVisible(true)}
                      style={({ pressed }) => [pressed && styles.headerCtaPressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Logout"
                    >
                      <View style={styles.headerCta}>
                        <Text style={styles.headerCtaText}>Logout</Text>
                        <MaterialIcons
                          name="logout"
                          size={18}
                          color="#0b1f48"
                          style={styles.headerCtaIcon}
                        />
                      </View>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => navigateAfterClose('/(auth)/login')}
                      style={({ pressed }) => [pressed && styles.headerCtaPressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Continue to account"
                    >
                      <View style={styles.headerCta}>
                        <Text style={styles.headerCtaText}>Continue to account</Text>
                        <MaterialIcons
                          name="chevron-right"
                          size={18}
                          color="#0b1f48"
                          style={styles.headerCtaIcon}
                        />
                      </View>
                    </Pressable>
                  )}
                </LinearGradient>

                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={[styles.content, { paddingBottom: Math.max(32, insets.bottom + 20) }]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  bounces
                >
                  <Text style={styles.sectionLabel}>Shop for</Text>
                  {!shopLoaded && renderedShopItems.length === 0 ? (
                    <Text style={styles.menuPlaceholder}>Loading…</Text>
                  ) : null}
                  <View style={styles.menuList}>
                    {renderedShopItems.map((item) => {
                      const iconName = resolveIcon(item.icon);
                      const isOffers = item.slug === 'offers';
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            navigateAfterClose({
                              pathname: '/(app)/collection/[slug]',
                              params: { slug: item.collectionSlug || item.slug },
                            } as Href)
                          }
                          style={({ pressed }) => [
                            styles.menuItemOuter,
                            isOffers && styles.menuItemOffers,
                            pressed && styles.menuItemPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${item.title} collection`}
                          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                        >
                          <View style={styles.menuItemRow}>
                            <View style={styles.menuIconSlot}>
                              {item.image ? (
                                <RemoteImage
                                  uri={item.image}
                                  fallbackTint="#f1f5f9"
                                  style={styles.menuItemImage}
                                />
                              ) : (
                                <MaterialIcons name={iconName} size={22} color="#1f2937" />
                              )}
                            </View>
                            <Text style={styles.menuLabel} numberOfLines={1}>
                              {item.title}
                            </Text>
                            {item.badge ? (
                              <View style={styles.newPill}>
                                <Text style={styles.newPillText}>
                                  {item.badge.toUpperCase()}
                                </Text>
                              </View>
                            ) : null}
                            <View style={styles.menuChevronSlot}>
                              <MaterialIcons
                                name="chevron-right"
                                size={22}
                                color="#cbd5e1"
                              />
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {menuCategories.length > 0 ? (
                    <>
                      <Text style={styles.sectionLabel}>Categories</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryContainer}
                        style={styles.categoryScroll}
                      >
                        {menuCategories.map((item) => (
                          <Pressable
                            key={item.id}
                            style={({ pressed }) => [
                              styles.categoryItem,
                              pressed && styles.categoryItemPressed,
                            ]}
                            onPress={() =>
                              navigateAfterClose({
                                pathname: '/(app)/category-products',
                                params: { category: item.name },
                              } as Href)
                            }
                          >
                            <View style={styles.categoryImage}>
                              <RemoteImage
                                uri={item.image ?? categoryImageUri(item.name)}
                                fallbackTint="#f5f0e6"
                                style={StyleSheet.absoluteFillObject}
                              />
                            </View>
                            <Text style={styles.categoryText} numberOfLines={1}>
                              {item.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </>
                  ) : null}

                  <Text style={styles.sectionLabel}>Gold plans</Text>
                  <View style={styles.menuList}>
                    {GOLD_PLAN_ITEMS.map((item) => (
                      <Pressable
                        key={item.label}
                        onPress={() => navigateAfterClose(item.href)}
                        style={({ pressed }) => [
                          styles.menuItemOuter,
                          item.variant === 'mine' && styles.goldMineFeatured,
                          pressed &&
                            (item.variant === 'mine'
                              ? styles.goldMineFeaturedPressed
                              : styles.menuItemPressed),
                        ]}
                        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                      >
                        <View style={styles.menuItemRow}>
                          <View style={styles.menuIconSlot}>
                            <MaterialIcons
                              name={item.icon}
                              size={22}
                              color={item.variant === 'mine' ? '#0b1f48' : '#1f2937'}
                            />
                          </View>
                          <View style={styles.goldRowText}>
                            <Text
                              style={[styles.goldRowTitle, item.variant === 'mine' && styles.goldMineTitleAccent]}
                              numberOfLines={1}
                            >
                              {item.label}
                            </Text>
                            <Text style={styles.goldRowSub} numberOfLines={1}>
                              {item.sub}
                            </Text>
                          </View>
                          <View style={styles.menuChevronSlot}>
                            <MaterialIcons name="chevron-right" size={22} color="#9ca3af" />
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>More</Text>
                  <View style={styles.menuList}>
                    {UTILITY_ITEMS.map((item) => (
                      <Pressable
                        key={item.label}
                        onPress={() => navigateAfterClose(item.href)}
                        style={({ pressed }) => [styles.menuItemOuter, pressed && styles.menuItemPressed]}
                        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                      >
                        <View style={styles.menuItemRow}>
                          <View style={styles.menuIconSlot}>
                            <MaterialIcons name={item.icon} size={22} color="#1f2937" />
                          </View>
                          <Text style={styles.menuLabel} numberOfLines={1}>
                            {item.label}
                          </Text>
                          <View style={styles.menuChevronSlot}>
                            <MaterialIcons name="chevron-right" size={22} color="#cbd5e1" />
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.footerLink}>Privacy Policy</Text>
                  <Text style={[styles.footerLink, styles.footerLinkSpaced]}>Terms & Conditions</Text>

                  <View style={styles.bottomButtons}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.chatBtn}
                      onPress={() => navigateAfterClose('/(app)/chat' as Href)}
                    >
                      <MaterialIcons name="chat-bubble-outline" size={18} color="#fff" style={styles.btnIcon} />
                      <Text style={styles.chatText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.callbackBtn}
                      onPress={() => setCallbackModalOpen(true)}
                    >
                      <MaterialIcons name="phone-callback" size={18} color="#fff" style={styles.btnIcon} />
                      <Text style={styles.callbackText}>Request callback</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.versionFooter}>App version {APP_VERSION}</Text>
                </ScrollView>
              </View>
            </SafeAreaView>
          </Animated.View>
        </GestureDetector>

        <CallbackModal visible={callbackModalOpen} onClose={() => setCallbackModalOpen(false)} />
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
              <Text style={styles.logoutBody}>
                Are you sure you want to logout from your account?
              </Text>
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
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  root: { flex: 1, backgroundColor: 'transparent' },
  backdropWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    overflow: 'hidden',
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 12,
  },
  drawerSafe: { flex: 1, backgroundColor: '#fff' },
  drawerBody: { flex: 1, width: '100%', minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  headerGradient: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: { fontSize: 20, color: 'rgba(255,255,255,0.92)', fontWeight: '700' },
  headerTextCol: { flex: 1 },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userSub: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  /** Inner View carries background so the pill paints reliably (Pressable-only bg can fail on some Android builds). */
  headerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(11,31,72,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCtaPressed: {
    opacity: 0.92,
  },
  headerCtaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b1f48',
  },
  headerCtaIcon: {
    marginLeft: 6,
    transform: [{ translateY: 1 }],
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    flexGrow: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#9ca3af',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  menuList: {
    gap: 4,
    marginBottom: spacing.lg,
  },
  /** Pressable shell — row layout lives in menuItemRow so icon + label stay on one line everywhere. */
  menuItemOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    columnGap: 12,
  },
  menuIconSlot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuItemImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuPlaceholder: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#94a3b8',
  },
  menuLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  menuItemPressed: {
    backgroundColor: '#f3f4f6',
  },
  menuItemOffers: {
    backgroundColor: '#faf8f0',
    borderWidth: 1,
    borderColor: '#efe8d8',
  },
  newPill: {
    backgroundColor: '#857b3d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  newPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  menuChevronSlot: {
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  /** Light “featured” row so title + subtitle stay readable (dark-on-navy failed when Pressable bg didn’t paint). */
  goldMineFeatured: {
    backgroundColor: '#fdf8ee',
    borderWidth: 1,
    borderColor: '#e5d9c4',
  },
  goldMineFeaturedPressed: {
    backgroundColor: '#f5efe3',
  },
  goldRowText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  goldRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  goldMineTitleAccent: {
    color: '#0b1f48',
  },
  goldRowSub: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
    fontWeight: '500',
  },
  categoryScroll: {
    marginHorizontal: -20,
    marginBottom: spacing.lg,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: spacing.xs,
    columnGap: 20,
    gap: 20,
  },
  categoryItem: {
    width: 80,
    alignItems: 'center',
  },
  categoryItemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  categoryText: {
    marginTop: 6,
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  footerLink: { fontSize: fontSizes.xs, color: '#9ba3b0' },
  footerLinkSpaced: { marginTop: spacing.sm },
  bottomButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2FA4A9',
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
  },
  callbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1F44',
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
  },
  btnIcon: { marginRight: 6 },
  chatText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  callbackText: { fontSize: 11, color: '#fff', fontWeight: '700', textAlign: 'center' },
  versionFooter: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
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
  logoutTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  logoutBody: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 21,
    marginBottom: 18,
  },
  logoutActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
