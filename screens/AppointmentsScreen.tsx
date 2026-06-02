import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { AppointmentSegmentedControl } from '@/lib/components/appointments/AppointmentSegmentedControl';
import { luxury } from '@/lib/components/appointments/appointmentTheme';
import { AppointmentCard } from '@/lib/components/common/AppointmentCard';
import type { Appointment } from '@/lib/services/mock/appointments';
import { showPopup } from '@/lib/stores/popupStore';
import { appointmentMatchesTab, type AppointmentTab } from '@/lib/utils/appointments';
import {
  ApiError,
  getAppointmentsForUser,
  updateAppointmentStatus,
  type AppointmentApiRow,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const TABS: { key: AppointmentTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY_COPY: Record<
  AppointmentTab,
  { title: string; subtitle: string; cta?: string; route?: '/(app)/boutiques' }
> = {
  upcoming: {
    title: 'No Upcoming Appointments',
    subtitle: 'Book a boutique visit for personalized jewellery consultations with master artisans.',
    cta: 'Explore Boutiques',
    route: '/(app)/boutiques',
  },
  past: {
    title: 'No Past Appointments',
    subtitle: 'Your completed visits and private viewings will appear here.',
    cta: 'Explore Boutiques',
    route: '/(app)/boutiques',
  },
  cancelled: {
    title: 'No Cancelled Appointments',
    subtitle: 'Appointments you cancel will be listed here for your records.',
    cta: 'Explore Boutiques',
    route: '/(app)/boutiques',
  },
};

function mapRowToAppointment(row: AppointmentApiRow): Appointment {
  return {
    id: row.id,
    boutiqueId: row.boutiqueId,
    boutiqueName: row.boutiqueName,
    boutiqueSlug: row.boutiqueSlug ?? undefined,
    date: row.date,
    time: row.time ?? '',
    status: row.status,
    badge: row.badge,
    address: row.address,
    image: row.image,
    startsAt: row.startsAt ?? null,
    consultationType: row.consultationType,
    phone: row.phone,
  };
}

function userFacingAppointmentError(err: unknown): string {
  if (err instanceof ApiError) {
    const m = err.message;
    const low = m.toLowerCase();
    if (
      low.includes('column ') ||
      low.includes('does not exist') ||
      low.includes('relation ') ||
      low.includes('syntax') ||
      low.includes('postgres') ||
      low.includes('supabase') ||
      low.includes('42p01') ||
      low.includes('42703')
    ) {
      return 'We could not load your appointments. Please try again.';
    }
    return m;
  }
  return 'Unable to load appointments.';
}

function telHref(phone: string | undefined): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.replace(/\D/g, '').length < 8) return null;
  return `tel:${digits}`;
}

function AppointmentSkeletonCard() {
  return (
    <View style={skStyles.card}>
      <ShimmerBlock height={168} borderRadius={0} />
      <View style={skStyles.pad}>
        <ShimmerBlock height={22} width="60%" borderRadius={8} />
        <ShimmerBlock height={14} width="90%" borderRadius={6} style={{ marginTop: 12 }} />
        <View style={skStyles.btnRow}>
          <ShimmerBlock height={44} borderRadius={14} style={{ flex: 1 }} />
          <ShimmerBlock height={44} borderRadius={14} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

function TabEmptyState({
  tab,
  onCta,
}: {
  tab: AppointmentTab;
  onCta: () => void;
}) {
  const copy = EMPTY_COPY[tab];
  return (
    <Animated.View entering={FadeIn.duration(320)} exiting={FadeOut.duration(200)} style={styles.emptyLuxury}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptyIconInner}>
          <MaterialIcons name="event" size={36} color={luxury.goldDark} />
        </View>
        <View style={styles.emptyRing} />
      </View>
      <Text style={styles.emptyLuxuryTitle}>{copy.title}</Text>
      <Text style={styles.emptyLuxurySub}>{copy.subtitle}</Text>
      {copy.cta ? (
        <Pressable
          style={({ pressed }) => [styles.exploreBtn, pressed && styles.btnPressed]}
          onPress={onCta}
        >
          <Text style={styles.exploreBtnText}>{copy.cta}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppointmentTab>('upcoming');
  const listKey = useRef(0);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!userId) {
      setAppointments([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const rows = await getAppointmentsForUser(userId);
      setAppointments(rows.map(mapRowToAppointment));
    } catch (err) {
      setError(userFacingAppointmentError(err));
      if (!silent) {
        setAppointments([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const { refreshControl } = usePullToRefresh(
    useCallback(() => load({ silent: true }), [load]),
    { enabled: Boolean(userId) },
  );

  const handleTabChange = useCallback((tab: AppointmentTab) => {
    setActiveTab(tab);
    listKey.current += 1;
  }, []);

  const filteredAppointments = useMemo(
    () => appointments.filter((a) => appointmentMatchesTab(a, activeTab)),
    [appointments, activeTab],
  );

  const tabCounts = useMemo(() => {
    const counts: Record<AppointmentTab, number> = { upcoming: 0, past: 0, cancelled: 0 };
    for (const a of appointments) {
      for (const tab of TABS) {
        if (appointmentMatchesTab(a, tab.key)) counts[tab.key] += 1;
      }
    }
    return counts;
  }, [appointments]);

  const openDetails = useCallback(
    (id: string) => {
      router.push({ pathname: '/(app)/appointment-details', params: { id } });
    },
    [router],
  );

  const openBoutique = useCallback(
    (a: Appointment) => {
      if (!a.boutiqueId) {
        showPopup({
          type: 'info',
          title: 'Boutique',
          message: 'Boutique details are not available for this visit.',
        });
        return;
      }
      router.push({ pathname: '/(app)/boutique-profile', params: { id: a.boutiqueId } });
    },
    [router],
  );

  const bookAtBoutique = useCallback(
    (a: Appointment) => {
      if (!a.boutiqueId) {
        showPopup({
          type: 'info',
          title: 'Book visit',
          message: 'This boutique is no longer available for booking.',
        });
        return;
      }
      router.push({
        pathname: '/(app)/book-appointment',
        params: { boutiqueId: a.boutiqueId },
      });
    },
    [router],
  );

  const onCancel = useCallback(
    (a: Appointment) => {
      if (!userId) return;
      showPopup({
        type: 'confirm',
        title: 'Cancel appointment?',
        message: `Cancel your visit to ${a.boutiqueName}?`,
        confirmLabel: 'Yes, cancel',
        cancelLabel: 'Keep it',
        destructive: true,
        onConfirm: async () => {
          try {
            await updateAppointmentStatus(a.id, userId, 'cancelled');
            await load();
          } catch (e) {
            const msg = e instanceof ApiError ? userFacingAppointmentError(e) : 'Could not cancel';
            showPopup({ type: 'info', title: 'Something went wrong', message: msg });
          }
        },
      });
    },
    [load, userId],
  );

  const onCall = useCallback((a: Appointment) => {
    const href = telHref(a.phone);
    if (!href) {
      showPopup({
        type: 'info',
        title: 'Call boutique',
        message: `Phone number for ${a.boutiqueName} is not on file yet. You can message them from the boutique profile.`,
      });
      return;
    }
    void Linking.openURL(href).catch(() => {
      showPopup({
        type: 'info',
        title: 'Call boutique',
        message: 'Unable to open the phone app from this device.',
      });
    });
  }, []);

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Text style={styles.heroTitle}>My Appointments</Text>
        <Text style={styles.heroSubtitle}>
          Manage your private viewings and personal consultations with our master jewelers.
        </Text>
        <AppointmentSegmentedControl
          tabs={TABS}
          activeTab={activeTab}
          counts={tabCounts}
          onChange={handleTabChange}
        />
      </View>
    ),
    [activeTab, handleTabChange, tabCounts],
  );

  const errorBlock = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcons name="wifi-tethering-error" size={32} color="#94a3b8" />
        </View>
        <Text style={styles.emptyTitle}>Could not refresh</Text>
        <Text style={styles.emptySub}>{error}</Text>
        {userId ? (
          <Pressable style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    ),
    [error, load, userId],
  );

  const loadingBlock = useMemo(
    () => (
      <View style={styles.skeletonWrap}>
        <AppointmentSkeletonCard />
        <AppointmentSkeletonCard />
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color={luxury.textPrimary} />
        </Pressable>
        <Text style={styles.navTitle}>My Appointments</Text>
        <View style={styles.backSlot} />
      </View>

      {loading && userId ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {ListHeader}
          {loadingBlock}
        </ScrollView>
      ) : (
        <FlatList
          key={`${activeTab}-${listKey.current}`}
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          extraData={[filteredAppointments, activeTab, loading]}
          refreshControl={refreshControl}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View>
              {error ? (
                errorBlock
              ) : !userId ? (
                <View style={styles.emptyWrap}>
                  <MaterialIcons name="lock-outline" size={40} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>Sign in to continue</Text>
                  <Text style={styles.emptySub}>
                    Your appointments sync to your account when you are signed in.
                  </Text>
                </View>
              ) : (
                <TabEmptyState
                  tab={activeTab}
                  onCta={() => router.push('/(app)/boutiques')}
                />
              )}
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <AppointmentCard
              item={item}
              index={index}
              onPress={() => openDetails(item.id)}
              onCancel={() => onCancel(item)}
              onCallBoutique={() => onCall(item)}
              onViewBoutique={() => openBoutique(item)}
              onReschedule={() => bookAtBoutique(item)}
              onBookAgain={() => bookAtBoutique(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const skStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 24, 20, 0.06)',
  },
  pad: { padding: spacing.lg },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: luxury.screenBg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: luxury.screenBg,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backSlot: { width: 40 },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: luxury.textPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    flexGrow: 1,
  },
  headerBlock: {
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
    alignSelf: 'stretch',
  },
  heroTitle: {
    fontSize: fontSizes['3xl'],
    fontWeight: '800',
    color: luxury.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: fontSizes.sm,
    color: luxury.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  skeletonWrap: { paddingBottom: spacing.md },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    minHeight: 200,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26, 24, 20, 0.06)',
    marginBottom: spacing.sm,
  },
  emptyLuxury: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.md,
  },
  emptyIllustration: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: luxury.goldFill,
    opacity: 0.5,
  },
  emptyIconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  emptyLuxuryTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: luxury.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyLuxurySub: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: luxury.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  exploreBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    backgroundColor: luxury.goldFill,
    borderRadius: radius.lg,
    shadowColor: luxury.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  exploreBtnText: {
    color: luxury.goldDark,
    fontWeight: '800',
    fontSize: fontSizes.sm,
    letterSpacing: 0.3,
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  emptyTitle: {
    marginTop: spacing.md,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#475569',
  },
  emptySub: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: luxury.textPrimary,
    borderRadius: radius.md,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSizes.sm },
});
