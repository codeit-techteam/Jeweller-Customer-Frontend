import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import type { Appointment } from '@/lib/services/mock/appointments';
import { ApiError, getAppointmentDetail, type AppointmentApiRow } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { fontSizes, spacing } from '@/src/constants/theme';

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
      return 'We could not load this appointment. Please try again.';
    }
    return m;
  }
  return 'Unable to load appointment.';
}

function paramStr(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? raw[0] : raw;
}

function mapRow(row: AppointmentApiRow): Appointment {
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

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const appointmentId = useMemo(() => paramStr(id), [id]);

  const [a, setA] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!appointmentId || !userId) {
      setA(null);
      setLoading(false);
      setError(!userId ? 'Sign in to view this appointment.' : null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const row = await getAppointmentDetail(appointmentId, userId);
      setA(mapRow(row));
    } catch (e) {
      const msg = e instanceof ApiError ? userFacingAppointmentError(e) : 'Unable to load appointment';
      setError(msg);
      setA(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId, userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text style={styles.navTitle}>Appointment</Text>
        <View style={styles.backSlot} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6b5c22" />
        </View>
      ) : a ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <RemoteImage uri={a.image} fallbackTint="#d4c4a8" style={styles.hero} />
          <View style={styles.body}>
            <Text style={styles.status}>
              {a.status === 'upcoming' ? 'UPCOMING' : a.status === 'completed' ? 'COMPLETED' : 'CANCELLED'}
            </Text>
            <Text style={styles.name}>{a.boutiqueName}</Text>
            <Text style={styles.line}>
              {a.date}
              {a.time ? ` · ${a.time}` : ''}
            </Text>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.address}>{a.address}</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.missing}>
          <Text style={styles.missingText}>{error ?? 'Appointment not found.'}</Text>
          <Pressable onPress={() => router.back()} style={styles.missingBtn}>
            <Text style={styles.missingBtnText}>Go back</Text>
          </Pressable>
          {error && userId ? (
            <Pressable onPress={() => void load()} style={styles.retryWrap}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { width: 40 },
  backSlot: { width: 40 },
  navTitle: { flex: 1, textAlign: 'center', fontSize: fontSizes.md, fontWeight: '600' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: spacing['2xl'] },
  hero: { width: '100%', height: 200 },
  body: { padding: spacing.lg },
  status: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6b5c22',
    marginBottom: spacing.sm,
  },
  name: { fontSize: fontSizes['2xl'], fontWeight: '800', color: '#0f172a', marginBottom: spacing.xs },
  line: { fontSize: fontSizes.md, color: '#64748b', marginBottom: spacing.lg },
  label: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: spacing.xs },
  address: { fontSize: fontSizes.md, color: '#334155', lineHeight: 22 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  missingText: { fontSize: fontSizes.md, color: '#64748b', textAlign: 'center' },
  missingBtn: { marginTop: spacing.lg, padding: spacing.md },
  missingBtnText: { fontWeight: '700', color: '#6b5c22' },
  retryWrap: { marginTop: spacing.md },
  retryText: { fontWeight: '700', color: '#2563eb' },
});
