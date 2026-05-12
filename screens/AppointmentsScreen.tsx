import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';
import { AppointmentCard } from '@/lib/components/common/AppointmentCard';
import type { Appointment } from '@/lib/services/mock/appointments';
import { showPopup } from '@/lib/stores/popupStore';
import {
  ApiError,
  getAppointmentsForUser,
  updateAppointmentStatus,
  type AppointmentApiRow,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const OLIVE = '#6b5c22';
const BG = '#f5f5f7';

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
      <ShimmerBlock height={140} borderRadius={0} />
      <View style={skStyles.pad}>
        <ShimmerBlock height={18} width="55%" borderRadius={6} />
        <ShimmerBlock height={14} width="78%" borderRadius={6} style={{ marginTop: 10 }} />
        <ShimmerBlock height={12} width="100%" borderRadius={6} style={{ marginTop: 8 }} />
        <ShimmerBlock height={40} borderRadius={10} style={{ marginTop: 14 }} />
        <ShimmerBlock height={36} borderRadius={10} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listOpacity = useRef(new Animated.Value(1)).current;

  const load = useCallback(async () => {
    if (!userId) {
      setAppointments([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await getAppointmentsForUser(userId);
      setAppointments(rows.map(mapRowToAppointment));
    } catch (err) {
      setError(userFacingAppointmentError(err));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (loading) {
      listOpacity.setValue(1);
      return;
    }
    if (appointments.length > 0) {
      listOpacity.setValue(0);
      Animated.timing(listOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }).start();
    } else {
      listOpacity.setValue(1);
    }
  }, [loading, appointments.length, listOpacity]);

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
      </View>
    ),
    [],
  );

  const ListFooter = useMemo(
    () => (
      <View style={styles.footerSections}>
        <View style={styles.concierge}>
          <Text style={styles.conciergeTitle}>Need expert advice before your visit?</Text>
          <Text style={styles.conciergeBody}>
            Connect with our lead concierge to discuss styles, custom settings, or budget expectations ahead of
            your appointment.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.conciergeBtn, pressed && styles.btnPressed]}
            onPress={() => {
              showPopup({
                type: 'info',
                title: 'Concierge',
                message: 'Messaging would open here.',
              });
            }}
          >
            <Text style={styles.conciergeBtnText}>Message Concierge</Text>
          </Pressable>
        </View>

        <View style={styles.prefsWrap}>
          <Text style={styles.prefsLabel}>YOUR PREFERENCES</Text>
          <View style={styles.prefsInner}>
            {['Conflict-Free Only', 'Platinum Preference', 'Bespoke Design Interest'].map((label) => (
              <View key={label} style={styles.prefRow}>
                <Text style={styles.prefText}>{label}</Text>
                <View style={styles.prefCheck}>
                  <MaterialIcons name="check" size={14} color="#fff" />
                </View>
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => {
              showPopup({
                type: 'info',
                title: 'Design profile',
                message: 'Update flow would open here.',
              });
            }}
          >
            <Text style={styles.updateProfile}>UPDATE DESIGN PROFILE</Text>
          </Pressable>
        </View>
        <View style={styles.listBottomPad} />
      </View>
    ),
    [],
  );

  const emptyLuxury = useMemo(
    () => (
      <View style={styles.emptyLuxury}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcons name="event-available" size={36} color="#a68b2d" />
        </View>
        <Text style={styles.emptyLuxuryTitle}>No appointments yet</Text>
        <Text style={styles.emptyLuxurySub}>
          Book a private jewellery consultation with verified boutiques near you. Your visits will appear here with
          reminders and concierge support.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.exploreBtn, pressed && styles.btnPressed]}
          onPress={() => router.push('/(app)/boutiques')}
        >
          <Text style={styles.exploreBtnText}>Explore Boutiques</Text>
        </Pressable>
      </View>
    ),
    [router],
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
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text style={styles.navTitle}>My Appointments</Text>
        <View style={styles.backSlot} />
      </View>

      {loading && userId ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {ListHeader}
          {loadingBlock}
        </ScrollView>
      ) : (
        <Animated.View style={[styles.flexOne, { opacity: listOpacity }]}>
          <FlatList
            data={appointments}
            keyExtractor={(item) => item.id}
            extraData={[appointments, loading]}
            ListHeaderComponent={ListHeader}
            ListFooterComponent={appointments.length > 0 ? ListFooter : null}
            ListEmptyComponent={
              <View>
                {error ? errorBlock : !userId ? (
                  <View style={styles.emptyWrap}>
                    <MaterialIcons name="lock-outline" size={40} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>Sign in to continue</Text>
                    <Text style={styles.emptySub}>Your appointments sync to your account when you are signed in.</Text>
                  </View>
                ) : (
                  emptyLuxury
                )}
                {!error && userId ? ListFooter : null}
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <AppointmentCard
                item={item}
                onPress={() => openDetails(item.id)}
                onCancel={() => onCancel(item)}
                onCallBoutique={() => onCall(item)}
                onViewBoutique={() => openBoutique(item)}
              />
            )}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const skStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pad: { padding: spacing.md },
});

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  safe: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: BG,
  },
  backBtn: { width: 40, paddingVertical: 4 },
  backSlot: { width: 40 },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#0f172a',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  headerBlock: {
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: fontSizes['3xl'],
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fontSizes.sm,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: spacing.lg,
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
    borderColor: 'rgba(15, 23, 42, 0.06)',
    marginBottom: spacing.sm,
  },
  emptyLuxury: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyLuxuryTitle: {
    marginTop: spacing.md,
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  emptyLuxurySub: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  exploreBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    backgroundColor: '#0f172a',
    borderRadius: radius.lg,
  },
  exploreBtnText: { color: '#fff', fontWeight: '800', fontSize: fontSizes.sm, letterSpacing: 0.4 },
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
    backgroundColor: '#0f172a',
    borderRadius: radius.md,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSizes.sm },
  footerSections: { marginTop: spacing.sm },
  concierge: {
    backgroundColor: '#0f0f0f',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  conciergeTitle: {
    color: '#fff',
    fontSize: fontSizes.lg,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  conciergeBody: {
    color: '#9ca3af',
    fontSize: fontSizes.sm,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  conciergeBtn: {
    backgroundColor: OLIVE,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  conciergeBtnText: { color: '#fff', fontWeight: '700', fontSize: fontSizes.md },
  btnPressed: { opacity: 0.9 },
  prefsWrap: {
    backgroundColor: '#e4e4e8',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  prefsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#64748b',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  prefsInner: { gap: spacing.sm },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  prefText: { fontSize: fontSizes.sm, fontWeight: '600', color: '#1e293b' },
  prefCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#a68b2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateProfile: {
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: OLIVE,
  },
  listBottomPad: { height: spacing.lg },
});
