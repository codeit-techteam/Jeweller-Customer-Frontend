import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { addDays, format, isToday, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBoutiqueHoursStatus, normalizeWorkingDays } from '@/lib/boutiques/boutiqueUi';
import { BoutiqueStatusBadge } from '@/lib/components/common/BoutiqueStatusBadge';
import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { getBoutiqueProfileForId } from '@/lib/services/mock/boutiques';
import { createAppointment, getBoutiqueById } from '@/services/api';
import { boutiqueListingCoverImage } from '@/lib/services/mock/imageUrls';
import { fontSizes, radius, spacing } from '@/src/constants/theme';
import { BoutiqueSkeletonLoader, ButtonLoader } from '@/components/loaders';
import { EmptyState } from '@/lib/components/common/EmptyState';

const NAVY = '#0f172a';
const GOLD = '#b8860b';
const MUTED = '#64748b';
const UUID_V4_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Converts a display time like "02:30 PM" → "14:30" (HH:MM 24-hr). */
function toHHMM(displayTime: string): string {
  const parts = displayTime.trim().split(' ');
  const [hStr, mStr] = (parts[0] ?? '').split(':');
  let h = parseInt(hStr ?? '0', 10);
  const m = parseInt(mStr ?? '0', 10);
  const meridiem = parts[1]?.toUpperCase();
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const TIME_SLOTS = ['10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];

function paramStr(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function BookAppointmentScreen() {
  const router = useRouter();
  const boutiqueId = paramStr(useLocalSearchParams<{ boutiqueId?: string | string[] }>().boutiqueId);
  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    contactAddress: string;
    banners: { uri?: string }[];
    openNow: boolean;
    statusSubLabel: string;
    openingTime: string | null;
    closingTime: string | null;
    workingDays: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    console.log('Received boutiqueId:', boutiqueId);
    if (!boutiqueId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!UUID_V4_LIKE.test(boutiqueId)) {
      const mock = getBoutiqueProfileForId(boutiqueId);
      if (mock) {
        const hours = getBoutiqueHoursStatus(
          mock.openingTime,
          mock.closingTime,
          mock.workingDays ?? [],
        );
        setProfile({
          id: mock.id,
          name: mock.name,
          rating: mock.rating,
          reviewCount: mock.reviewCount,
          contactAddress: mock.contactAddress,
          banners: [{ uri: mock.banners[0]?.uri ?? boutiqueListingCoverImage(mock.id) }],
          openingTime: mock.openingTime ?? null,
          closingTime: mock.closingTime ?? null,
          workingDays: mock.workingDays ?? [],
          openNow: hours.openNow,
          statusSubLabel: hours.statusSubLabel,
        });
        setLoading(false);
        return;
      }
    }

    const fetchBoutique = async () => {
      try {
        const row = await getBoutiqueById(boutiqueId);
        if (!mounted) return;
        if (!row) {
          console.log('Boutique not found');
          setProfile(null);
          return;
        }
        const wd = normalizeWorkingDays(row.working_days);
        const hours = getBoutiqueHoursStatus(row.opening_time ?? null, row.closing_time ?? null, wd);
        setProfile({
          id: row.id,
          name: row.name,
          rating: row.rating ?? 0,
          reviewCount: Math.max(0, Math.floor(Number(row.reviews_count ?? 0))),
          contactAddress: `${row.location ?? 'Delhi'}, India`,
          banners: [{ uri: row.cover_image ?? row.image ?? boutiqueListingCoverImage(row.id) }],
          openingTime: row.opening_time ?? null,
          closingTime: row.closing_time ?? null,
          workingDays: wd,
          openNow: hours.openNow,
          statusSubLabel: hours.statusSubLabel,
        });
      } catch (error) {
        console.log('Boutique not found');
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchBoutique();
    return () => {
      mounted = false;
    };
  }, [boutiqueId]);

  const phoneRef = useRef<TextInput>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<'instore' | 'call'>('instore');
  const [notes, setNotes] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(), i);
      return { date: d, key: format(d, 'yyyy-MM-dd') };
    });
  }, []);

  const monthYear = useMemo(() => {
    const d = dateOptions[0]?.date ?? new Date();
    return format(d, 'MMMM yyyy');
  }, [dateOptions]);

  const canConfirm =
    Boolean(selectedDateKey) &&
    Boolean(selectedTime) &&
    name.trim().length > 0 &&
    phone.replace(/\s/g, '').length >= 8;

  const onConfirm = useCallback(async () => {
    if (!canConfirm || !selectedDateKey || !selectedTime || !profile) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await createAppointment({
        userId: null,
        boutiqueId: profile.id,
        date: selectedDateKey,
        time: toHHMM(selectedTime),
        type: appointmentType === 'instore' ? 'in-store' : 'call',
        notes: notes.trim() || null,
        customerName: name.trim() || null,
        customerPhone: phone.trim() || null,
        serviceRequested: null,
      });
      const d = parseISO(selectedDateKey);
      const dateFormatted = format(d, 'do MMM');
      router.push({
        pathname: '/(app)/appointment-booked',
        params: {
          boutiqueId: profile.id,
          boutiqueName: profile.name,
          date: dateFormatted,
          time: selectedTime,
          address: profile.contactAddress,
          appointmentId: result.id,
        },
      });
    } catch {
      Alert.alert('Booking Failed', 'Could not confirm your appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [canConfirm, selectedDateKey, selectedTime, profile, appointmentType, notes, name, phone, router, submitting]);

  const editPhone = useCallback(() => {
    phoneRef.current?.focus();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
          </Pressable>
        </View>
        <View style={styles.empty}>
          <BoutiqueSkeletonLoader count={1} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topRow}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
          </Pressable>
        </View>
        <View style={styles.empty}>
          <EmptyState
            icon="storefront"
            title="No boutique found"
            subtitle="The selected boutique is unavailable. Please try another one."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.headerIcon}>
          <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Book an Appointment</Text>
          <Text style={styles.headerGold}>LUXURY DIAMONDS BOUTIQUE</Text>
        </View>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.boutiqueCard}>
          <RemoteImage uri={profile.banners[0]?.uri} style={styles.boutiqueThumb} />
          <View style={styles.boutiqueMeta}>
            <View style={styles.boutiqueTitleRow}>
              <Text style={styles.boutiqueName} numberOfLines={2}>
                {profile.name}
              </Text>
              {profile.openingTime && profile.closingTime ? (
                <BoutiqueStatusBadge
                  isOpen={profile.openNow}
                  subLabel={profile.statusSubLabel}
                  opensAt={profile.openingTime}
                  closesAt={profile.closingTime}
                  variant="compact"
                />
              ) : null}
            </View>
            <Text style={styles.boutiqueRating}>
              ★ {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)
            </Text>
            <View style={styles.locRow}>
              <MaterialIcons name="location-on" size={14} color={MUTED} />
              <Text style={styles.boutiqueLoc}>{profile.contactAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>SELECT DATE</Text>
          <Text style={styles.monthGold}>{monthYear}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {dateOptions.map(({ date, key }) => {
            const selected = selectedDateKey === key;
            const top = isToday(date) ? 'TODAY' : format(date, 'EEE').toUpperCase();
            const num = format(date, 'd');
            const mon = format(date, 'MMM').toUpperCase();
            return (
              <Pressable key={key} onPress={() => setSelectedDateKey(key)} style={[styles.dateChip, selected && styles.dateChipOn]}>
                <Text style={[styles.dateTop, selected && styles.dateOn]}>{top}</Text>
                <Text style={[styles.dateNum, selected && styles.dateOn]}>{num}</Text>
                <Text style={[styles.dateMon, selected && styles.dateOn]}>{mon}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitle, styles.sectionTitlePad]}>SELECT TIME SLOT</Text>
        <View style={styles.slotGrid}>
          {TIME_SLOTS.map((t) => {
            const on = selectedTime === t;
            return (
              <Pressable key={t} onPress={() => setSelectedTime(t)} style={[styles.slotBtn, on && styles.slotBtnOn]}>
                <Text style={[styles.slotText, on && styles.slotTextOn]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitlePad]}>APPOINTMENT TYPE</Text>
        <View style={styles.typeRow}>
          <Pressable
            onPress={() => setAppointmentType('instore')}
            style={[styles.typeCard, appointmentType === 'instore' && styles.typeCardOn]}
          >
            <MaterialIcons name="storefront" size={32} color={NAVY} />
            <Text style={styles.typeLabel}>In-store Visit</Text>
          </Pressable>
          <Pressable
            onPress={() => setAppointmentType('call')}
            style={[styles.typeCard, appointmentType === 'call' && styles.typeCardOn]}
          >
            <MaterialIcons name="call" size={32} color={NAVY} />
            <Text style={styles.typeLabel}>Call Us</Text>
          </Pressable>
        </View>

        <Text style={styles.notesLabel}>ADD NOTES (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Looking for bridal necklace, solitaire engagement rings..."
          placeholderTextColor="#9ca3af"
          style={styles.notesInput}
          multiline
        />

        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
          placeholderTextColor="#9ca3af"
          style={styles.textInput}
          autoCapitalize="words"
        />

        <Text style={[styles.sectionTitle, styles.sectionTitlePad]}>CONTACT DETAILS</Text>
        <View style={styles.contactCard}>
          <View style={styles.phoneIconWrap}>
            <MaterialIcons name="smartphone" size={22} color={NAVY} />
          </View>
          <View style={styles.contactMid}>
            <Text style={styles.contactLabel}>MOBILE NUMBER</Text>
            <TextInput
              ref={phoneRef}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#9ca3af"
              style={styles.phoneInput}
              keyboardType="phone-pad"
            />
          </View>
          <Pressable onPress={editPhone} hitSlop={8}>
            <Text style={styles.editGold}>EDIT</Text>
          </Pressable>
        </View>

        <ButtonLoader
          label="CONFIRM APPOINTMENT"
          loading={submitting}
          disabled={!canConfirm || submitting}
          onPress={onConfirm}
          style={[styles.confirmBtn, !canConfirm && styles.confirmDisabled]}
        />
        <Text style={styles.footerDisclaimer}>Free consultation • No-commitment required</Text>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerIcon: { width: 40 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: NAVY },
  headerGold: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  boutiqueCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  boutiqueThumb: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  boutiqueMeta: { flex: 1, justifyContent: 'center' },
  boutiqueTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  boutiqueName: { flex: 1, minWidth: 0, fontSize: fontSizes.md, fontWeight: '700', color: NAVY },
  boutiqueRating: { marginTop: 4, fontSize: fontSizes.xs, color: MUTED },
  locRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: 6 },
  boutiqueLoc: { flex: 1, fontSize: fontSizes.xs, color: MUTED, lineHeight: 18 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: NAVY, letterSpacing: 0.6 },
  sectionTitlePad: { marginTop: spacing.xl, marginBottom: spacing.md },
  monthGold: { fontSize: fontSizes.sm, fontWeight: '700', color: GOLD },
  dateRow: { gap: spacing.sm, paddingBottom: spacing.sm },
  dateChip: {
    width: 64,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dateChipOn: { backgroundColor: NAVY, borderColor: NAVY },
  dateTop: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  dateNum: { fontSize: fontSizes.xl, fontWeight: '800', color: NAVY, marginVertical: 2 },
  dateMon: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  dateOn: { color: '#fff' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slotBtn: {
    width: '47%',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  slotBtnOn: { backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: NAVY },
  slotText: { fontSize: fontSizes.sm, fontWeight: '600', color: NAVY },
  slotTextOn: { color: NAVY },
  typeRow: { flexDirection: 'row', gap: spacing.md },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: spacing.sm,
  },
  typeCardOn: { borderWidth: 2, borderColor: NAVY, backgroundColor: '#eff6ff' },
  typeLabel: { fontSize: fontSizes.sm, fontWeight: '700', color: NAVY, textAlign: 'center' },
  notesLabel: { marginTop: spacing.xl, marginBottom: spacing.sm, fontSize: fontSizes.sm, fontWeight: '600', color: MUTED },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 100,
    fontSize: fontSizes.sm,
    color: NAVY,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  inputLabel: { marginTop: spacing.lg, marginBottom: spacing.sm, fontSize: 11, fontWeight: '800', color: NAVY, letterSpacing: 0.5 },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: NAVY,
    backgroundColor: '#fff',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  phoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactMid: { flex: 1 },
  contactLabel: { fontSize: 9, fontWeight: '800', color: MUTED, letterSpacing: 0.5 },
  phoneInput: { marginTop: 4, fontSize: fontSizes.md, fontWeight: '600', color: NAVY, padding: 0 },
  editGold: { fontSize: fontSizes.sm, fontWeight: '800', color: GOLD },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: NAVY,
    paddingVertical: spacing.lg,
    borderRadius: 999,
    marginTop: spacing.md,
  },
  confirmDisabled: { opacity: 0.45 },
  confirmText: { fontSize: fontSizes.sm, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  footerDisclaimer: { textAlign: 'center', marginTop: spacing.md, fontSize: 10, color: '#94a3b8' },
  topRow: { flexDirection: 'row', padding: spacing.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: MUTED },
});
