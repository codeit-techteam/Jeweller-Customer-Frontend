import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBoutique } from '@/hooks/useBoutique';
import { BoutiqueStatusBadge } from '@/lib/components/common/BoutiqueStatusBadge';
import { showPopup } from '@/lib/stores/popupStore';
import { applyLiveHoursToProfile, formatBoutiqueTimeRange } from '@/services/boutique.service';
import { fontSizes, radius, spacing } from '@/src/constants/theme';

const BG = '#f0f2f5';
const NAVY = '#0f172a';
const GOLD = '#c5a059';
const WHATSAPP = '#25D366';
const MUTED = '#64748b';

function paramStr(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

function sanitizeWhatsapp(input: string): string {
  return input.replace(/[\s+-]/g, '');
}

function osmStaticMapUri(lat: number, lng: number): string {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=15&size=600x200&markers=${lat},${lng},red-pushpin`;
}

export default function ContactBoutiqueScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ boutiqueId?: string | string[]; productId?: string | string[] }>();
  const boutiqueId = paramStr(params.boutiqueId);
  const boutiqueQuery = useBoutique(boutiqueId);

  const profile = useMemo(() => {
    const d = boutiqueQuery.data;
    return d ? applyLiveHoursToProfile(d) : null;
  }, [boutiqueQuery.data]);

  const loading = Boolean(boutiqueId) && boutiqueQuery.isPending && !boutiqueQuery.data;
  const notFound =
    !boutiqueId || boutiqueQuery.isError || (boutiqueQuery.isSuccess && !boutiqueQuery.data);

  const displayName = profile?.name ?? 'Boutique';

  const openWhatsApp = async () => {
    if (!profile?.whatsapp) {
      showPopup({ type: 'info', title: 'WhatsApp', message: 'WhatsApp number unavailable for this boutique.' });
      return;
    }
    const n = digitsOnly(sanitizeWhatsapp(profile.whatsapp));
    if (!n) {
      showPopup({ type: 'info', title: 'WhatsApp', message: 'WhatsApp number unavailable for this boutique.' });
      return;
    }
    const url = `https://wa.me/${n}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else
        showPopup({
          type: 'error',
          title: 'WhatsApp',
          message: 'Cannot open WhatsApp on this device.',
        });
    } catch {
      showPopup({ type: 'error', title: 'WhatsApp', message: 'Could not open WhatsApp.' });
    }
  };

  const dial = () => {
    if (!profile?.phone?.trim()) {
      showPopup({ type: 'info', title: 'Phone', message: 'Phone number unavailable for this boutique.' });
      return;
    }
    Linking.openURL(`tel:${profile.phone.replace(/\s/g, '')}`);
  };

  const openMaps = () => {
    if (!profile) return;
    const lat = profile.coordinates?.lat;
    const lng = profile.coordinates?.lng;
    if (lat != null && lng != null) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() => {});
      return;
    }
    const q = encodeURIComponent(profile.contactAddress.replace(/\+/g, ' '));
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`).catch(() => {});
  };

  const copyAddress = async () => {
    if (!profile) return;
    try {
      await Clipboard.setStringAsync(profile.contactAddress);
      showPopup({
        type: 'success',
        title: 'Copied',
        message: 'Address copied to clipboard.',
      });
    } catch {
      showPopup({
        type: 'info',
        title: 'Address',
        message: profile.contactAddress,
      });
    }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `${displayName} — ${profile?.contactAddress ?? ''}`,
        title: displayName,
      });
    } catch {
      /* ignore */
    }
  };

  const hoursDisplay =
    profile?.openingTime && profile?.closingTime
      ? formatBoutiqueTimeRange(profile.openingTime, profile.closingTime)
      : profile?.hoursLabel?.trim() || 'Timing unavailable';

  const reviewsLine =
    profile && profile.reviewCount > 0 ? `${profile.reviewCount} reviews` : 'No reviews yet';

  const mapUri =
    profile?.coordinates?.lat != null && profile.coordinates.lng != null
      ? osmStaticMapUri(profile.coordinates.lat, profile.coordinates.lng)
      : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <MaterialIcons name="chevron-left" size={28} color={NAVY} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading boutique...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <MaterialIcons name="chevron-left" size={28} color={NAVY} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {!boutiqueId ? 'Boutique not found' : 'Unable to load boutique'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.headerSide}
        >
          <MaterialIcons name="chevron-left" size={28} color={NAVY} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={styles.headerMeta} numberOfLines={2}>
            ★ {profile.rating.toFixed(1)} · {reviewsLine} · {profile.shortLocation} · {hoursDisplay}
          </Text>
          <View style={styles.trustPill}>
            <MaterialIcons name="verified" size={14} color={GOLD} />
            <Text style={styles.trustPillText}>{profile.trustedTag}</Text>
          </View>
          <View style={styles.statusRow}>
            <BoutiqueStatusBadge
              isOpen={profile.openNow}
              subLabel={profile.statusSubLabel}
              opensAt={profile.openingTime}
              closesAt={profile.closingTime}
              variant="default"
            />
          </View>
        </View>
        <Pressable hitSlop={12} onPress={onShare} accessibilityRole="button" style={styles.headerSide}>
          <MaterialIcons name="share" size={22} color={NAVY} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.iconBox}>
              <FontAwesome5 name="whatsapp" size={22} color={WHATSAPP} brand />
            </View>
            <Text style={styles.cardTitle}>Whatsapp</Text>
          </View>
          <Text style={styles.cardDesc}>
            Connect instantly with a jewellery expert for a personal viewing.
          </Text>
          <Pressable style={styles.btnPrimary} onPress={openWhatsApp}>
            <Text style={styles.btnPrimaryText}>Start Chat</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.iconBox}>
              <MaterialIcons name="phone" size={22} color={NAVY} />
            </View>
            <Text style={styles.cardTitle}>Phone Call</Text>
          </View>
          <Text style={styles.cardDesc}>
            Schedule a private session at the boutique to browse our latest collection.
          </Text>
          <Pressable style={styles.btnOutline} onPress={dial}>
            <Text style={styles.btnOutlineText}>Call Us</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.mapWrap}>
            <Pressable onPress={openMaps} accessibilityRole="button" accessibilityLabel="Open map">
              {mapUri ? (
                <Image source={{ uri: mapUri }} style={styles.mapImage} resizeMode="cover" />
              ) : (
                <View style={styles.mapPlaceholder}>
                  <MaterialIcons name="place" size={28} color="#1e40af" style={styles.pinBlue} />
                  <Text style={styles.mapFallbackText}>Map preview unavailable</Text>
                </View>
              )}
            </Pressable>
          </View>
          <Text style={styles.locationLabel}>OUR LOCATION</Text>
          <Text style={styles.address}>{profile.contactAddress}</Text>
          <View style={styles.locBtnRow}>
            <Pressable style={styles.locBtn} onPress={openMaps}>
              <MaterialIcons name="explore" size={18} color={NAVY} />
              <Text style={styles.locBtnText}>Directions</Text>
            </Pressable>
            <Pressable style={styles.locBtn} onPress={copyAddress}>
              <MaterialIcons name="content-copy" size={18} color={NAVY} />
              <Text style={styles.locBtnText}>Copy</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.quickLabel}>QUICK CONTACT</Text>
        <View style={styles.quickRow}>
          <Pressable style={styles.quickPill} onPress={dial}>
            <MaterialIcons name="call" size={18} color={NAVY} />
            <Text style={styles.quickPillText}>Call Us</Text>
          </Pressable>
          <Pressable style={styles.quickPill} onPress={openWhatsApp}>
            <FontAwesome5 name="whatsapp" size={18} color={WHATSAPP} brand />
            <Text style={styles.quickPillText}>WhatsApp</Text>
          </Pressable>
        </View>

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerSide: { width: 40, alignItems: 'center', justifyContent: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs },
  headerTitle: {
    textAlign: 'center',
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: NAVY,
  },
  headerMeta: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: fontSizes.xs,
    fontWeight: '500',
    color: MUTED,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f5f0e6',
  },
  trustPillText: { fontSize: 9, fontWeight: '800', color: NAVY, letterSpacing: 0.4 },
  statusRow: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.md },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: fontSizes.md, fontWeight: '700', color: NAVY },
  cardDesc: {
    fontSize: fontSizes.sm,
    color: MUTED,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  btnPrimary: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: fontSizes.sm, fontWeight: '700', color: '#fff' },
  btnOutline: {
    borderWidth: 1.5,
    borderColor: NAVY,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  btnOutlineText: { fontSize: fontSizes.sm, fontWeight: '700', color: NAVY },
  mapWrap: { marginHorizontal: -spacing.lg, marginTop: -spacing.lg, marginBottom: spacing.md },
  mapImage: {
    height: 148,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
    backgroundColor: '#e2e8f0',
  },
  mapPlaceholder: {
    height: 148,
    backgroundColor: '#e2e8f0',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapFallbackText: { marginTop: 8, fontSize: fontSizes.xs, color: MUTED, fontWeight: '600' },
  pinBlue: { marginBottom: 4 },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  address: { fontSize: fontSizes.sm, color: MUTED, lineHeight: 22, marginBottom: spacing.lg },
  locBtnRow: { flexDirection: 'row', gap: spacing.sm },
  locBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  locBtnText: { fontSize: fontSizes.xs, fontWeight: '700', color: NAVY },
  quickLabel: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  quickRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  quickPillText: { fontSize: fontSizes.xs, fontWeight: '700', color: NAVY },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: MUTED, fontSize: fontSizes.md },
});
