import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { addDays, format, isToday, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BoutiqueSkeletonLoader } from '@/components/loaders';
import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';
import { useUserLocation } from '@/hooks/useUserLocation';
import {
  getBoutiqueHoursStatus,
  normalizeWorkingDays,
} from '@/lib/boutiques/boutiqueUi';
import { BoutiqueStatusBadge } from '@/lib/components/common/BoutiqueStatusBadge';
import { EmptyState } from '@/lib/components/common/EmptyState';
import { RemoteImage } from '@/lib/components/common/RemoteImage';
import {
  boutiqueHasCoordinates,
  formatBoutiqueDistanceLine,
} from '@/lib/utils/formatBoutiqueDistance';
import { formatBoutiqueLocation } from '@/lib/utils/formatBoutiqueLocation';
import { productPrimaryUri } from '@/lib/services/mock/imageUrls';
import { createAppointment, getBoutiqueById, getProductById } from '@/services/api';
import { createAppointmentBookedNotifications } from '@/lib/services/notifications';
import { calculateDistanceKm, parseCoord } from '@/utils/calculateDistance';
import { fontSizes, radius, spacing } from '@/src/constants/theme';
import { useAuth } from '@/context/AuthContext';

const NAVY = '#0f172a';
const GOLD = '#b08d57';
const WHATSAPP = '#25D366';

/** Converts a display time like "1:00 PM" → "13:00" (HH:MM 24-hr). */
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

const TIME_SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'];

function paramStr(raw: string | string[] | undefined): string | undefined {
  if (raw == null) return undefined;
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function BookVisitScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    boutiqueId?: string | string[];
    productId?: string | string[];
    productData?: string | string[];
    boutiqueData?: string | string[];
  }>();
  const boutiqueId = paramStr(params.boutiqueId);
  const productId = paramStr(params.productId);
  const routeProductData = paramStr(params.productData);
  const routeBoutiqueData = paramStr(params.boutiqueData);

  const parsedProductFromParams = useMemo(() => {
    if (!routeProductData) return null;
    try {
      return JSON.parse(routeProductData) as {
        id: string;
        name: string;
        price: number;
        image?: string | null;
        category?: string;
        boutique_id?: string | null;
      };
    } catch {
      return null;
    }
  }, [routeProductData]);

  const parsedBoutiqueFromParams = useMemo(() => {
    if (!routeBoutiqueData) return null;
    try {
      return JSON.parse(routeBoutiqueData) as {
        id: string;
        name: string;
        address?: string | null;
        location?: string | null;
        rating?: number | null;
        distance?: number | null;
        image?: string | null;
        logo?: string | null;
        phone?: string | null;
        whatsapp?: string | null;
        coordinates?: { lat: number; lng: number } | null;
        latitude?: number | null;
        longitude?: number | null;
        openingTime?: string | null;
        closingTime?: string | null;
        workingDays?: string[];
      };
    } catch {
      return null;
    }
  }, [routeBoutiqueData]);

  const [product, setProduct] = useState(parsedProductFromParams);
  const [profile, setProfile] = useState(parsedBoutiqueFromParams);
  const [loading, setLoading] = useState(!(parsedBoutiqueFromParams && parsedProductFromParams));
  const [loadError, setLoadError] = useState<string | null>(null);

  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(new Date(), i);
      return { date: d, key: format(d, 'yyyy-MM-dd') };
    });
  }, []);

  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<'instore' | 'whatsapp'>('instore');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    coords: userCoords,
    loading: locationLoading,
    permission: locationPermission,
    gpsFailed: locationGpsFailed,
  } = useUserLocation(true);

  useEffect(() => {
    console.log('[BookStoreVisit] route params', {
      productId,
      boutiqueId,
      hasProductData: Boolean(routeProductData),
      hasBoutiqueData: Boolean(routeBoutiqueData),
    });
    console.log('[BookStoreVisit] received productId', productId);
    console.log('[BookStoreVisit] received boutiqueId', boutiqueId);
  }, [boutiqueId, productId, routeBoutiqueData, routeProductData]);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      setLoadError(null);

      if (parsedBoutiqueFromParams) {
        setProfile(parsedBoutiqueFromParams);
      }
      if (parsedProductFromParams) {
        setProduct(parsedProductFromParams);
      }

      const shouldFetchBoutique = !parsedBoutiqueFromParams && !!boutiqueId;
      const shouldFetchProduct = !parsedProductFromParams && !!productId;
      if (!shouldFetchBoutique && !shouldFetchProduct) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [boutiqueResponse, productResponse] = await Promise.all([
          shouldFetchBoutique ? getBoutiqueById(boutiqueId as string) : Promise.resolve(null),
          shouldFetchProduct ? getProductById(productId as string) : Promise.resolve(null),
        ]);

        if (!mounted) return;

        if (boutiqueResponse) {
          console.log('[BookStoreVisit] boutique API response', boutiqueResponse);
          const formattedLocation = formatBoutiqueLocation({
            location: boutiqueResponse.location ?? null,
            full_address: boutiqueResponse.full_address ?? null,
            address: boutiqueResponse.address ?? null,
          });
          setProfile((prev) => ({
            id: boutiqueResponse.id,
            name: boutiqueResponse.name,
            address: formattedLocation,
            location: formattedLocation,
            rating: boutiqueResponse.rating ?? prev?.rating ?? 0,
            distance:
              boutiqueResponse.distance != null &&
              Number.isFinite(Number(boutiqueResponse.distance))
                ? Number(boutiqueResponse.distance)
                : (prev?.distance ?? null),
            image:
              boutiqueResponse.cover_image ??
              boutiqueResponse.image ??
              prev?.image ??
              null,
            logo:
              boutiqueResponse.logo_image ??
              boutiqueResponse.logo ??
              boutiqueResponse.image ??
              prev?.logo ??
              null,
            phone:
              boutiqueResponse.phone ??
              boutiqueResponse.phone_number ??
              prev?.phone ??
              null,
            whatsapp:
              boutiqueResponse.whatsapp ??
              boutiqueResponse.whatsapp_number ??
              prev?.whatsapp ??
              null,
            coordinates:
              boutiqueResponse.coordinates ??
              (boutiqueResponse.latitude != null && boutiqueResponse.longitude != null
                ? {
                    lat: Number(boutiqueResponse.latitude),
                    lng: Number(boutiqueResponse.longitude),
                  }
                : prev?.coordinates ?? null),
            latitude: boutiqueResponse.latitude ?? prev?.latitude ?? null,
            longitude: boutiqueResponse.longitude ?? prev?.longitude ?? null,
            openingTime: boutiqueResponse.opening_time ?? prev?.openingTime ?? null,
            closingTime: boutiqueResponse.closing_time ?? prev?.closingTime ?? null,
            workingDays: normalizeWorkingDays(
              boutiqueResponse.working_days ?? prev?.workingDays,
            ),
          }));
        }

        if (productResponse) {
          setProduct((prev) => ({
            id: productResponse.id,
            name: productResponse.name,
            price: Number(productResponse.price),
            image:
              productResponse.product_images?.[0]?.image_url ??
              productResponse.image ??
              prev?.image ??
              null,
            category: productResponse.category?.name ?? prev?.category ?? 'RINGS',
            boutique_id: productResponse.boutique_id ?? prev?.boutique_id ?? null,
          }));
        }
      } catch (error) {
        console.log('[BookStoreVisit] boutique/product API failed', error);
        if (!mounted) return;
        if (!parsedBoutiqueFromParams) {
          setLoadError('Boutique unavailable');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [boutiqueId, parsedBoutiqueFromParams, parsedProductFromParams, productId]);

  const monthLabel = useMemo(() => {
    const first = dateOptions[0]?.date;
    return first ? format(first, 'MMMM yyyy') : '';
  }, [dateOptions]);

  const canConfirm =
    Boolean(selectedDateKey) &&
    Boolean(selectedTime) &&
    name.trim().length > 0 &&
    phone.trim().length > 0;

  const openMaps = () => {
    if (!profile) return;
    const c = profile.coordinates;
    const laRaw = profile.latitude != null ? Number(profile.latitude) : c?.lat;
    const loRaw = profile.longitude != null ? Number(profile.longitude) : c?.lng;
    if (
      laRaw != null &&
      loRaw != null &&
      Number.isFinite(laRaw) &&
      Number.isFinite(loRaw)
    ) {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${laRaw},${loRaw}`,
      ).catch(() => {});
      return;
    }
    const query = profile.address ?? profile.location ?? profile.name;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(query))}`,
    ).catch(() => {});
  };

  const dial = () => {
    const raw = profile?.phone?.trim();
    if (!raw) return;
    Linking.openURL(`tel:${raw.replace(/\s/g, '')}`).catch(() => {});
  };

  const onConfirm = async () => {
    if (!canConfirm || !selectedDateKey || !selectedTime || !profile) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await createAppointment({
        userId: user?.id ?? null,
        boutiqueId: profile.id,
        date: selectedDateKey,
        time: toHHMM(selectedTime),
        type: visitType === 'instore' ? 'in-store' : 'call',
        notes: notes.trim() || null,
        customerName: name.trim() || null,
        customerPhone: phone.trim() || null,
        serviceRequested: product?.name ?? null,
      });
      if (user?.id) {
        await createAppointmentBookedNotifications({
          userId: user.id,
          appointmentId: result.id,
          boutiqueId: profile.id,
          boutiqueName: profile.name,
          date: selectedDateKey,
          time: selectedTime,
        });
      }
      const d = parseISO(selectedDateKey);
      const dateFormatted = format(d, 'do MMM');
      router.push({
        pathname: '/(app)/appointment-booked',
        params: {
          boutiqueId: profile.id,
          boutiqueName: profile.name,
          date: dateFormatted,
          time: selectedTime,
          address: locationLine,
          appointmentId: result.id,
        },
      });
    } catch {
      Alert.alert('Booking Failed', 'Could not confirm your appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const distanceKm = useMemo(() => {
    if (!profile) return null;
    if (profile.distance != null && Number.isFinite(Number(profile.distance))) {
      const d = Number(profile.distance);
      if (__DEV__) {
        console.log('[BookVisit distance]', { source: 'server', distanceKm: d });
      }
      return d;
    }
    if (!userCoords) return null;
    const la = parseCoord(profile.latitude ?? profile.coordinates?.lat);
    const lo = parseCoord(profile.longitude ?? profile.coordinates?.lng);
    if (la == null || lo == null) return null;
    const d = calculateDistanceKm(userCoords.lat, userCoords.lng, la, lo);
    if (__DEV__) {
      console.log('[BookVisit distance]', {
        source: 'client',
        userLocation: userCoords,
        boutiqueLat: la,
        boutiqueLng: lo,
        distanceKm: d,
      });
    }
    return d;
  }, [profile, userCoords]);

  const distanceLine = formatBoutiqueDistanceLine({
    distanceKm,
    locationLoading,
    hasBoutiqueCoords: Boolean(
      profile &&
        boutiqueHasCoordinates({
          latitude: profile.latitude ?? profile.coordinates?.lat ?? null,
          longitude: profile.longitude ?? profile.coordinates?.lng ?? null,
        }),
    ),
    permission: locationPermission,
    userLocationGpsFailed: locationGpsFailed,
  });
  const locationLine = profile
    ? formatBoutiqueLocation({
        location: profile.location,
        full_address: profile.address,
        address: profile.address,
      })
    : 'Location unavailable';

  const visitHours = useMemo(() => {
    if (!profile?.openingTime || !profile?.closingTime) {
      return { hasHours: false as const, openNow: false, statusSubLabel: '' };
    }
    const h = getBoutiqueHoursStatus(
      profile.openingTime,
      profile.closingTime,
      profile.workingDays ?? [],
    );
    return { hasHours: true as const, openNow: h.openNow, statusSubLabel: h.statusSubLabel };
  }, [profile]);

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
          </Pressable>
        </View>
        <View style={styles.loadingWrap}>
          <BoutiqueSkeletonLoader count={1} />
          <View style={styles.productSkeleton}>
            <ShimmerBlock width={88} height={88} borderRadius={12} />
            <View style={styles.productSkeletonMeta}>
              <ShimmerBlock height={10} width="45%" />
              <ShimmerBlock height={16} width="90%" style={{ marginTop: 8 }} />
              <ShimmerBlock height={16} width="35%" style={{ marginTop: 8 }} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
          </Pressable>
        </View>
        <View style={styles.empty}>
          <EmptyState
            icon="storefront"
            title="Boutique unavailable"
            subtitle={loadError ?? 'We could not load the selected boutique. Please try again.'}
            actionLabel="Retry"
            onAction={() => router.replace({ pathname: '/(app)/book-visit', params: { ...params } })}
          />
          <Pressable style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
          <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={styles.screenTitle}>Book Store Visit</Text>
          <Text style={styles.screenSub}>VISIT BOUTIQUE & VIEW THIS JEWELLERY IN PERSON</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {product ? (
          <View style={styles.productCard}>
            <RemoteImage
              uri={product.image ?? productPrimaryUri(product.id, product.category ?? 'RINGS')}
              style={styles.productThumb}
            />
            <View style={styles.productMeta}>
              <Text style={styles.productEyebrow}>YOU&apos;LL VIEW THIS AT STORE</Text>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productPrice}>₹{Number(product.price).toLocaleString('en-IN')}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.boutiqueDark}>
          <View style={styles.trustedBadge}>
            <MaterialIcons name="verified" size={14} color={GOLD} />
            <Text style={styles.trustedText}>TRUSTED SELLER</Text>
          </View>
          <Text style={styles.boutiqueTitle}>{profile.name}</Text>
          <View style={styles.boutiqueRow}>
            <MaterialIcons name="star" size={14} color={GOLD} />
            <Text style={styles.boutiqueMuted}>
              {Number(profile.rating ?? 0).toFixed(1)}
              {distanceLine ? ` · ${distanceLine}` : ""}
            </Text>
          </View>
          <View style={styles.boutiqueRow}>
            <MaterialIcons name="location-on" size={14} color="#94a3b8" />
            <Text style={styles.boutiqueMuted}>{locationLine}</Text>
          </View>
          {visitHours.hasHours ? (
            <BoutiqueStatusBadge
              isOpen={visitHours.openNow}
              subLabel={visitHours.statusSubLabel}
              opensAt={profile.openingTime}
              closesAt={profile.closingTime}
              variant="compact"
              style={styles.visitStatusBadge}
            />
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <Text style={styles.monthGold}>{monthLabel}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateOptions.map(({ date, key }) => {
              const selected = selectedDateKey === key;
              const labelTop = isToday(date) ? 'TODAY' : format(date, 'EEE').toUpperCase();
              const labelNum = format(date, 'd');
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedDateKey(key)}
                  style={[styles.dateChip, selected && styles.dateChipOn]}
                >
                  <Text style={[styles.dateChipTop, selected && styles.dateChipTextOn]}>{labelTop}</Text>
                  <Text style={[styles.dateChipNum, selected && styles.dateChipTextOn]}>{labelNum}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          <View style={styles.slotGrid}>
            {TIME_SLOTS.map((t) => {
              const on = selectedTime === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setSelectedTime(t)}
                  style={[styles.slotBtn, on && styles.slotBtnOn]}
                >
                  <Text style={[styles.slotText, on && styles.slotTextOn]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.visitTypeLabel}>CHOOSE VISIT TYPE</Text>
        <View style={styles.visitToggle}>
          <Pressable
            onPress={() => setVisitType('instore')}
            style={[styles.visitPill, visitType === 'instore' && styles.visitPillOn]}
          >
            <Text style={[styles.visitPillText, visitType === 'instore' && styles.visitPillTextOn]}>In-store Visit</Text>
          </Pressable>
          <Pressable
            onPress={() => setVisitType('whatsapp')}
            style={[styles.visitPill, visitType === 'whatsapp' && styles.visitPillOn]}
          >
            <FontAwesome5 name="whatsapp" size={16} color={WHATSAPP} brand />
            <Text style={[styles.visitPillText, visitType === 'whatsapp' && styles.visitPillTextOn]}>WhatsApp</Text>
          </Pressable>
        </View>

        <Text style={styles.inputLabel}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          autoCapitalize="words"
        />

        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile number"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          keyboardType="phone-pad"
        />

        <Text style={styles.sectionTitleSm}>Add Notes</Text>
        <Text style={styles.notesEyebrow}>PERSONALIZED NOTES (OPTIONAL)</Text>
        <View style={styles.notesWrap}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Looking for bridal set / custom design..."
            placeholderTextColor="#9ca3af"
            style={styles.notesInput}
            multiline
            textAlignVertical="top"
          />
          <MaterialIcons name="edit" size={18} color="#9ca3af" style={styles.notesIcon} />
        </View>

        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <MaterialIcons name="verified" size={16} color="#16a34a" />
            <Text style={styles.trustText}>NO PAYMENT REQUIRED</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialIcons name="event-available" size={16} color="#16a34a" />
            <Text style={styles.trustText}>FREE CONSULTATION</Text>
          </View>
          <View style={styles.trustItem}>
            <MaterialIcons name="cancel" size={16} color="#16a34a" />
            <Text style={styles.trustText}>CANCEL ANYTIME</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.callBtn} onPress={dial}>
            <MaterialIcons name="call" size={18} color={GOLD} />
            <Text style={styles.callBtnText}>CALL</Text>
          </Pressable>
          <Pressable style={styles.dirBtn} onPress={openMaps}>
            <MaterialIcons name="near-me" size={20} color={NAVY} />
            <Text style={styles.dirBtnText}>DIRECTIONS</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.confirmBtn, (!canConfirm || submitting) && styles.confirmBtnDisabled]}
          onPress={onConfirm}
          disabled={!canConfirm || submitting}
        >
          <Text style={styles.confirmText}>CONFIRM APPOINTMENT</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </Pressable>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
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
  headerTitles: { flex: 1, alignItems: 'center' },
  screenTitle: { fontSize: fontSizes.lg, fontWeight: '700', color: NAVY },
  screenSub: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eef0f3',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  productThumb: { width: 88, height: 88, borderRadius: radius.md, overflow: 'hidden' },
  productMeta: { flex: 1, justifyContent: 'center' },
  productEyebrow: { fontSize: 9, fontWeight: '700', color: GOLD, letterSpacing: 0.6 },
  productName: { marginTop: 4, fontSize: fontSizes.md, fontWeight: '700', color: NAVY },
  productPrice: { marginTop: 4, fontSize: fontSizes.lg, fontWeight: '800', color: NAVY },
  boutiqueDark: {
    backgroundColor: NAVY,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    position: 'relative',
  },
  trustedBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  trustedText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  boutiqueTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: '#fff', marginBottom: spacing.sm, paddingRight: 100 },
  boutiqueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  boutiqueMuted: { fontSize: fontSizes.sm, color: '#cbd5e1' },
  visitStatusBadge: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  section: { marginBottom: spacing.lg },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: '700', color: NAVY },
  sectionTitleSm: { fontSize: fontSizes.md, fontWeight: '700', color: NAVY, marginTop: spacing.lg },
  monthGold: { fontSize: fontSizes.sm, fontWeight: '700', color: GOLD },
  dateRow: { gap: spacing.sm, paddingVertical: 4 },
  dateChip: {
    width: 72,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dateChipOn: { backgroundColor: NAVY, borderColor: NAVY },
  dateChipTop: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  dateChipNum: { fontSize: fontSizes.lg, fontWeight: '800', color: NAVY, marginTop: 2 },
  dateChipTextOn: { color: '#fff' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  slotBtn: {
    width: '30%',
    minWidth: 100,
    flexGrow: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  slotBtnOn: { backgroundColor: NAVY, borderColor: NAVY },
  slotText: { fontSize: fontSizes.sm, fontWeight: '600', color: NAVY },
  slotTextOn: { color: '#fff' },
  visitTypeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  visitToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  visitPill: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  visitPillOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  visitPillText: { fontSize: fontSizes.sm, fontWeight: '600', color: '#64748b' },
  visitPillTextOn: { color: NAVY },
  inputLabel: { fontSize: fontSizes.xs, fontWeight: '700', color: '#64748b', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: NAVY,
    marginBottom: spacing.md,
  },
  notesEyebrow: { fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, marginBottom: spacing.sm },
  notesWrap: { position: 'relative', marginBottom: spacing.lg },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    minHeight: 100,
    fontSize: fontSizes.sm,
    color: NAVY,
  },
  notesIcon: { position: 'absolute', right: spacing.md, bottom: spacing.md },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg, justifyContent: 'space-between' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '32%' },
  trustText: { fontSize: 8, fontWeight: '700', color: '#64748b', flexShrink: 1 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: NAVY,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  callBtnText: { fontSize: fontSizes.xs, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  dirBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  dirBtnText: { fontSize: fontSizes.xs, fontWeight: '800', color: NAVY, letterSpacing: 0.5 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#9a7b4f',
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmText: { fontSize: fontSizes.sm, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  loadingWrap: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  productSkeleton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#eef0f3',
  },
  productSkeletonMeta: { flex: 1, justifyContent: 'center' },
  goBackBtn: {
    marginTop: spacing.md,
    backgroundColor: NAVY,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  goBackBtnText: { color: '#fff', fontSize: fontSizes.sm, fontWeight: '700' },
  emptyText: { fontSize: fontSizes.md, color: '#64748b' },
  emptyLink: { marginTop: spacing.md, fontSize: fontSizes.sm, fontWeight: '700', color: NAVY },
});
