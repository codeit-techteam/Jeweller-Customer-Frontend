import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import type { NotificationSettings } from '@/lib/services/notifications';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from '@/lib/services/notifications';
import { syncPushTokenForUser } from '@/lib/services/pushNotifications';
import { fontSizes, spacing } from '@/src/constants/theme';

type ToggleRowProps = {
  label: string;
  subtitle?: string;
  value: boolean;
  onChange: (next: boolean) => void;
};

function ToggleRow({ label, subtitle, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#e2e8f0', true: '#93c5fd' }}
        thumbColor={value ? '#1e40af' : '#f8fafc'}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      setLoading(true);
      try {
        const data = await fetchNotificationSettings(user.id);
        setSettings(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const patch = useCallback(
    async (key: keyof NotificationSettings, value: boolean) => {
      if (!user?.id || !settings) return;
      const next = { ...settings, [key]: value };
      setSettings(next);
      setSaving(true);
      try {
        const saved = await updateNotificationSettings(user.id, { [key]: value });
        setSettings(saved);
        if (key === 'push_enabled' && value) {
          await syncPushTokenForUser(user.id);
        }
      } catch {
        setSettings(settings);
      } finally {
        setSaving(false);
      }
    },
    [settings, user?.id],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerIcon}>
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerIcon} />
      </View>

      {loading || !settings ? (
        <View style={styles.center}>
          <ActivityIndicator color="#1e40af" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionEyebrow}>IN-APP</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Offers"
              subtitle="Deals, festivals, and promotions"
              value={settings.offers_enabled}
              onChange={(v) => void patch('offers_enabled', v)}
            />
            <ToggleRow
              label="Appointments"
              subtitle="Bookings, confirmations, and reminders"
              value={settings.appointments_enabled}
              onChange={(v) => void patch('appointments_enabled', v)}
            />
            <ToggleRow
              label="Support"
              subtitle="Callback and helpdesk updates"
              value={settings.support_enabled}
              onChange={(v) => void patch('support_enabled', v)}
            />
            <ToggleRow
              label="System"
              subtitle="Maintenance, updates, and announcements"
              value={settings.system_enabled}
              onChange={(v) => void patch('system_enabled', v)}
            />
          </View>

          <Text style={styles.sectionEyebrow}>PUSH</Text>
          <View style={styles.card}>
            <ToggleRow
              label="Push Notifications"
              subtitle="Alerts when the app is in background or closed"
              value={settings.push_enabled}
              onChange={(v) => void patch('push_enabled', v)}
            />
          </View>

          {saving ? <Text style={styles.savingHint}>Saving...</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerIcon: { width: 40, alignItems: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#9ca3af',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowText: { flex: 1, paddingRight: spacing.md },
  rowLabel: { fontSize: fontSizes.sm, fontWeight: '600', color: '#0f172a' },
  rowSub: { marginTop: 2, fontSize: fontSizes.xs, color: '#64748b' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  savingHint: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: fontSizes.xs,
    color: '#64748b',
  },
});
