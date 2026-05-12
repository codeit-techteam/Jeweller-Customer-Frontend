import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import {
  type AddressInput,
  type AddressLabel,
  useAddressStore,
} from '@/lib/stores/addressStore';
import { fontSizes, spacing } from '@/src/constants/theme';

const NAVY = '#0f172a';
const MUTED = '#64748b';
const LABEL_GREY = '#8E8E93';
const INPUT_BG = '#F5F6F8';
const DANGER = '#c53030';
const CARD_BORDER = '#e8eaed';
const SCREEN_BG = '#f8f9fa';

const LABELS: AddressLabel[] = ['Home', 'Office', 'Other'];

type Errors = Partial<Record<keyof AddressInput, string>>;

function paramStr(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default function AddressFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const editingId = useMemo(() => paramStr(id), [id]);

  const getAddressById = useAddressStore((s) => s.getAddressById);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const setDefault = useAddressStore((s) => s.setDefault);
  const defaultId = useAddressStore((s) => s.defaultId);
  const addressCount = useAddressStore((s) => s.addresses.length);

  const existing = editingId ? getAddressById(editingId) : undefined;
  const isEdit = Boolean(existing);

  const [label, setLabel] = useState<AddressLabel>(existing?.label ?? 'Home');
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [line1, setLine1] = useState(existing?.line1 ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [stateRegion, setStateRegion] = useState(existing?.state ?? '');
  const [pincode, setPincode] = useState(existing?.pincode ?? '');
  const [country, setCountry] = useState(existing?.country ?? 'India');
  const [makeDefault, setMakeDefault] = useState<boolean>(
    existing ? existing.id === defaultId : addressCount === 0,
  );
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (editingId && !existing) {
      Toast.show({ type: 'error', text1: 'Address not found' });
      router.back();
    }
  }, [editingId, existing, router]);

  const validate = useCallback((): Errors => {
    const e: Errors = {};
    if (!name.trim()) e.name = 'Full name is required';
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone.trim()) e.phone = 'Phone is required';
    else if (phoneDigits.length < 10) e.phone = 'Enter a valid phone number';
    if (!line1.trim()) e.line1 = 'Address line is required';
    if (!city.trim()) e.city = 'City is required';
    if (!stateRegion.trim()) e.state = 'State is required';
    if (!pincode.trim()) e.pincode = 'Pincode is required';
    else if (!/^\d{4,6}$/.test(pincode.trim())) e.pincode = 'Enter a valid pincode';
    return e;
  }, [name, phone, line1, city, stateRegion, pincode]);

  const onSave = useCallback(() => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Please fix the highlighted fields',
      });
      return;
    }

    const payload: AddressInput = {
      label,
      name: name.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      city: city.trim(),
      state: stateRegion.trim(),
      pincode: pincode.trim(),
      country: country.trim() || 'India',
    };

    if (isEdit && existing) {
      updateAddress(existing.id, payload);
      if (makeDefault && existing.id !== defaultId) setDefault(existing.id);
      Toast.show({ type: 'success', text1: 'Address updated' });
    } else {
      const newId = addAddress(payload, { makeDefault });
      if (makeDefault) setDefault(newId);
      Toast.show({ type: 'success', text1: 'Address added' });
    }
    router.back();
  }, [
    validate,
    label,
    name,
    phone,
    line1,
    city,
    stateRegion,
    pincode,
    country,
    isEdit,
    existing,
    makeDefault,
    defaultId,
    updateAddress,
    addAddress,
    setDefault,
    router,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
          <MaterialIcons name="arrow-back-ios" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Address' : 'Add New Address'}</Text>
        <Pressable hitSlop={12} onPress={onSave} accessibilityRole="button">
          <Text style={styles.headerSave}>Save</Text>
        </Pressable>
      </View>
      <View style={styles.headerRule} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, 14) + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.eyebrow}>SAVE AS</Text>
            <View style={styles.labelRow}>
              {LABELS.map((opt) => {
                const active = opt === label;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setLabel(opt)}
                    style={({ pressed }) => [
                      styles.labelChip,
                      active && styles.labelChipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <MaterialIcons
                      name={
                        opt === 'Home' ? 'home' : opt === 'Office' ? 'business-center' : 'place'
                      }
                      size={16}
                      color={active ? '#fff' : NAVY}
                    />
                    <Text style={[styles.labelChipText, active && styles.labelChipTextActive]}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.eyebrow}>CONTACT</Text>
            <Field
              label="Full Name"
              icon="person-outline"
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              autoCapitalize="words"
              error={errors.name}
            />
            <Field
              label="Phone"
              icon="phone-android"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^\d+\s]/g, ''))}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              error={errors.phone}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.eyebrow}>ADDRESS</Text>
            <Field
              label="Address Line"
              icon="home"
              value={line1}
              onChangeText={setLine1}
              placeholder="Flat / House no. / Building, Street"
              multiline
              error={errors.line1}
            />
            <View style={styles.row2}>
              <View style={styles.col}>
                <Field
                  label="City"
                  icon="location-city"
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  error={errors.city}
                />
              </View>
              <View style={styles.col}>
                <Field
                  label="State"
                  icon="public"
                  value={stateRegion}
                  onChangeText={setStateRegion}
                  placeholder="State"
                  error={errors.state}
                />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={styles.col}>
                <Field
                  label="Pincode"
                  icon="markunread-mailbox"
                  value={pincode}
                  onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="110001"
                  keyboardType="number-pad"
                  error={errors.pincode}
                />
              </View>
              <View style={styles.col}>
                <Field
                  label="Country"
                  icon="flag"
                  value={country}
                  onChangeText={setCountry}
                  placeholder="India"
                />
              </View>
            </View>
          </View>

          <View style={styles.defaultRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.defaultTitle}>Set as default</Text>
              <Text style={styles.defaultSub}>
                Used automatically at checkout and for boutique visits.
              </Text>
            </View>
            <Switch
              value={makeDefault}
              onValueChange={setMakeDefault}
              trackColor={{ false: '#e5e7eb', true: '#0f172a' }}
              thumbColor="#fff"
              ios_backgroundColor="#e5e7eb"
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 14) + 10,
            },
          ]}
        >
          <Pressable
            onPress={onSave}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.saveBtnText}>
              {isEdit ? 'Save Changes' : 'Add Address'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  multiline?: boolean;
  error?: string;
};

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  error,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <MaterialIcons name={icon} size={18} color={error ? DANGER : MUTED} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          style={[styles.input, multiline && styles.inputMultiline]}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          multiline={multiline}
          selectionColor={NAVY}
        />
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: NAVY,
  },
  headerSave: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: NAVY,
    minWidth: 44,
    textAlign: 'right',
  },
  headerRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CARD_BORDER,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: LABEL_GREY,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  labelRow: { flexDirection: 'row', gap: 8 },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: INPUT_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  labelChipActive: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  labelChipText: { fontSize: fontSizes.sm, fontWeight: '700', color: NAVY },
  labelChipTextActive: { color: '#fff' },
  field: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: LABEL_GREY,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  inputRowError: {
    borderColor: DANGER,
    backgroundColor: '#FDF2F2',
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    color: NAVY,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  inputMultiline: { minHeight: 48, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  fieldError: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: DANGER,
    marginTop: 4,
    marginLeft: 2,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
    gap: 12,
  },
  defaultTitle: { fontSize: fontSizes.md, fontWeight: '800', color: NAVY, marginBottom: 2 },
  defaultSub: { fontSize: fontSizes.xs, color: MUTED, lineHeight: 16 },
  bottomBar: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: CARD_BORDER,
  },
  saveBtn: {
    backgroundColor: NAVY,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  saveBtnPressed: { opacity: 0.92 },
  saveBtnText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
