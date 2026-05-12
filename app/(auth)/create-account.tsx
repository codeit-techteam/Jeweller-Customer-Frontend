import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontSizes, spacing } from '@/src/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { ButtonLoader } from '@/components/loaders';

const BLACK = '#0a0a0a';
const MUTED = '#6b7280';
const INPUT_BG = '#f3f4f6';
const BORDER = '#e5e7eb';
const CTA_ACTIVE = '#0A2540';
const CTA_DISABLED = '#C7CBD1';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'terms' | 'form', string>>;

type FormState = {
  name: string;
  phone: string;
  email: string;
};

const emptyForm: FormState = {
  name: '',
  phone: '',
  email: '',
};

type FieldKey = 'name' | 'email' | 'phone';

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<InstanceType<typeof KeyboardAwareScrollView> | null>(null);
  const fieldY = useRef<Partial<Record<FieldKey, number>>>({});

  const [form, setForm] = useState<FormState>(emptyForm);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [phoneBlurred, setPhoneBlurred] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const { signup, isLoggedIn } = useAuth();
  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(app)/home');
    }
  }, [isLoggedIn, router]);


  const baseFooterBottom = Math.max(insets.bottom, 0) + 10;
  const animatedBottom = useRef(new Animated.Value(baseFooterBottom)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const target = keyboardHeight > 0 ? keyboardHeight + 10 : baseFooterBottom;
    Animated.timing(animatedBottom, {
      toValue: target,
      duration: Platform.OS === 'ios' ? 250 : 220,
      useNativeDriver: false,
    }).start();
  }, [keyboardHeight, baseFooterBottom]);

  const phoneDisplay =
    form.phone.length <= 5 ? form.phone : `${form.phone.slice(0, 5)} ${form.phone.slice(5)}`;

  const isValid = useMemo(
    () =>
      form.name.trim().length > 2 &&
      form.email.includes('@') &&
      form.phone.length >= 10 &&
      acceptTerms === true,
    [form.name, form.email, form.phone, acceptTerms],
  );

  const hasStartedFilling = useMemo(
    () =>
      form.name.trim().length > 0 ||
      form.email.trim().length > 0 ||
      form.phone.length > 0,
    [form.name, form.email, form.phone],
  );

  const buttonLabel = useMemo(() => {
    if (loading) return 'Creating account...';
    if (isValid) return 'Create Account';
    if (hasStartedFilling) return 'Continue';
    return 'Create Account';
  }, [loading, isValid, hasStartedFilling]);

  const showEmailErrorBorder = useMemo(() => {
    if (!form.email.trim()) return false;
    return emailBlurred && !isValidEmail(form.email);
  }, [form.email, emailBlurred]);

  const phoneHint = useMemo(() => {
    if (errors.phone) return errors.phone;
    if (phoneBlurred && form.phone.length > 0 && form.phone.length < 10) {
      return 'Enter a valid 10-digit mobile number.';
    }
    return null;
  }, [errors.phone, phoneBlurred, form.phone.length]);

  const showPhoneErrorBorder = !!errors.phone || (phoneBlurred && form.phone.length > 0 && form.phone.length < 10);

  const onFieldLayout = useCallback((key: FieldKey) => (e: LayoutChangeEvent) => {
    fieldY.current[key] = e.nativeEvent.layout.y;
  }, []);

  const scrollToField = useCallback((key: FieldKey) => {
    const y = fieldY.current[key];
    if (y == null) return;
    const target = Math.max(0, y - 24);
    scrollRef.current?.scrollToPosition(0, target, true);
  }, []);

  const onInputFocus = useCallback(
    (key: FieldKey) => () => {
      requestAnimationFrame(() => scrollToField(key));
    },
    [scrollToField],
  );

  const onChangePhone = useCallback((text: string) => {
    setErrors((e) => ({ ...e, phone: undefined }));
    setForm((f) => ({ ...f, phone: digitsOnly(text) }));
  }, []);

  const validateForSubmit = useCallback((): boolean => {
    const next: FieldErrors = {};
    if (form.name.trim().length <= 2) next.name = 'Please enter your full name (at least 3 characters).';
    if (form.phone.length < 10) next.phone = 'Enter a valid 10-digit mobile number.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    if (!acceptTerms) next.terms = 'Please accept the Terms of Service and Privacy Policy.';
    setErrors(next);
    const order: FieldKey[] = ['name', 'email', 'phone'];
    let scrolled = false;
    for (const k of order) {
      if (next[k]) {
        requestAnimationFrame(() => scrollToField(k));
        scrolled = true;
        break;
      }
    }
    if (!scrolled && next.terms) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd(true));
    }
    return Object.keys(next).length === 0;
  }, [form.name, form.phone, form.email, acceptTerms, scrollToField]);

  const handleSignup = useCallback(async () => {
    if (!isValid || loading) return;
    if (!validateForSubmit()) return;
    setLoading(true);
    try {
      const result = await signup(form.name.trim(), form.email.trim(), form.phone, selectedImageUri ?? undefined);
      if (result === 'exists') {
        setErrors((e) => ({ ...e, phone: 'Phone number already registered. Please login.' }));
        setLoading(false);
        return;
      }

      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          phone: form.phone,
          name: form.name.trim(),
          email: form.email.trim(),
          newsletter: newsletter ? '1' : '0',
        },
      });
    } catch (e: any) {
      setErrors((prev) => ({
        ...prev,
        form: typeof e?.message === 'string' ? e.message : 'Could not create account. Please try again.',
      }));
    } finally {
      setLoading(false);
    }
  }, [isValid, loading, validateForSubmit, signup, form.name, form.email, form.phone, router, newsletter]);

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/login');
  }, [router]);

  const onAvatarPress = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      setErrors((prev) => ({
        ...prev,
        form: 'Please allow gallery access to upload your profile image.',
      }));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
      setErrors((prev) => ({ ...prev, form: undefined }));
    }
  }, []);

  const scrollBottomPad = 160 + Math.max(insets.bottom, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.flex}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>
            <KeyboardAwareScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
              enableOnAndroid
              extraScrollHeight={100}
              extraHeight={24}
              keyboardOpeningTime={200}
              enableAutomaticScroll
              enableResetScrollToCoords={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              bounces
            >
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" hitSlop={14} onPress={onBack} style={styles.backSlot}>
              <MaterialIcons
                name={Platform.OS === 'android' ? 'arrow-back' : 'arrow-back-ios'}
                size={22}
                color={BLACK}
              />
            </Pressable>
            <Text style={styles.screenTitle}>CREATE ACCOUNT</Text>
            <View style={styles.backSlot} />
          </View>

          <Text style={styles.stepHint}>Step 1 of 2</Text>

          <Text style={styles.hero}>Join the Platform</Text>

          <View style={styles.avatarBlock}>
            <Pressable onPress={onAvatarPress} style={styles.avatarOuter}>
              <View style={styles.avatarCircle}>
                {selectedImageUri ? (
                  <Image source={{ uri: selectedImageUri }} style={styles.avatarImage} />
                ) : (
                  <MaterialIcons name="photo-camera" size={36} color={MUTED} />
                )}
              </View>
              <Pressable onPress={onAvatarPress} style={styles.avatarFab} hitSlop={8}>
                <MaterialIcons name="add" size={22} color="#fff" />
              </Pressable>
            </Pressable>
            <Text style={styles.avatarLabel}>PROFILE PORTRAIT</Text>
          </View>

          <View style={styles.field} onLayout={onFieldLayout('name')}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              value={form.name}
              onChangeText={(t) => {
                setForm((f) => ({ ...f, name: t }));
                setErrors((e) => ({ ...e, name: undefined }));
              }}
              onFocus={onInputFocus('name')}
              placeholder="Evelyn Thorne"
              placeholderTextColor={MUTED}
              style={[styles.input, errors.name ? styles.inputError : null]}
              autoCapitalize="words"
            />
            {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
          </View>

          <View style={styles.field} onLayout={onFieldLayout('email')}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              value={form.email}
              onChangeText={(t) => {
                setForm((f) => ({ ...f, email: t }));
                setErrors((e) => ({ ...e, email: undefined }));
              }}
              onBlur={() => setEmailBlurred(true)}
              onFocus={() => {
                setEmailBlurred(false);
                onInputFocus('email')();
              }}
              placeholder="evelyn@luxeandco.com"
              placeholderTextColor={MUTED}
              style={[
                styles.input,
                (errors.email || showEmailErrorBorder) ? styles.inputError : null,
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          <View style={styles.field} onLayout={onFieldLayout('phone')}>
            <Text style={styles.label}>PHONE NUMBER</Text>
            <View style={[styles.phoneRow, showPhoneErrorBorder ? styles.inputError : null]}>
              <Text style={styles.phonePrefix}>+91</Text>
              <View style={styles.phoneDivider} />
              <TextInput
                value={phoneDisplay}
                onChangeText={onChangePhone}
                onBlur={() => setPhoneBlurred(true)}
                onFocus={() => {
                  setPhoneBlurred(false);
                  onInputFocus('phone')();
                }}
                placeholder="98765 43210"
                placeholderTextColor={MUTED}
                style={styles.phoneInput}
                keyboardType="number-pad"
                maxLength={12}
              />
              <MaterialIcons name="verified-user" size={20} color={BLACK} style={styles.shieldIcon} />
            </View>
            {phoneHint ? <Text style={styles.fieldError}>{phoneHint}</Text> : null}
          </View>

          <View style={styles.checkboxRow}>
            <Pressable
              style={[styles.checkbox, acceptTerms && styles.checkboxOn]}
              onPress={() => {
                setAcceptTerms((v) => !v);
                setErrors((e) => ({ ...e, terms: undefined }));
              }}
            >
              {acceptTerms ? <MaterialIcons name="check" size={16} color="#fff" /> : null}
            </Pressable>
            <Text style={styles.checkboxLabel}>
              I accept the{' '}
              <Text style={styles.link} onPress={() => console.log('[CreateAccount] Terms')}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.link} onPress={() => console.log('[CreateAccount] Privacy')}>
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
          {errors.terms ? <Text style={styles.termsError}>{errors.terms}</Text> : null}
          {errors.form ? <Text style={styles.termsError}>{errors.form}</Text> : null}

          <View style={styles.checkboxRow}>
            <Pressable
              style={[styles.checkbox, newsletter && styles.checkboxOn]}
              onPress={() => setNewsletter((v) => !v)}
            >
              {newsletter ? <MaterialIcons name="check" size={16} color="#fff" /> : null}
            </Pressable>
            <Text style={styles.checkboxLabel}>
              Subscribe to the LUXE & CO Newsletter for early access to &quot;The Archive&quot; releases.
            </Text>
          </View>

          <Pressable style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
            </Text>
          </Pressable>
            </KeyboardAwareScrollView>

            <Animated.View style={[styles.footerContainer, { bottom: animatedBottom }]} pointerEvents="box-none">
              <View style={styles.footerSurface} pointerEvents="box-none">
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.88)', '#FFFFFF']}
                  locations={[0, 0.45, 1]}
                  style={styles.footerGradient}
                  pointerEvents="none"
                />
                <ButtonLoader
                  label={buttonLabel}
                  loading={loading}
                  disabled={!isValid || loading}
                  onPress={handleSignup}
                  style={[
                    styles.button,
                    !isValid && !loading ? styles.buttonDisabled : styles.buttonActive,
                    loading && styles.buttonLoading,
                  ]}
                />
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  backSlot: { width: 40 },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: BLACK,
    letterSpacing: 1.2,
  },
  stepHint: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: spacing.sm,
  },
  hero: {
    fontSize: 28,
    fontWeight: '600',
    color: BLACK,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: undefined }),
  },
  avatarBlock: { alignItems: 'center', marginBottom: spacing['2xl'] },
  avatarOuter: { position: 'relative', marginBottom: spacing.md },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarFab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: MUTED,
  },
  field: { marginBottom: spacing.lg },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: BLACK,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    fontSize: fontSizes.md,
    color: BLACK,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  fieldError: {
    marginTop: spacing.xs,
    fontSize: fontSizes.xs,
    color: '#dc2626',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
  },
  phonePrefix: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: BLACK,
  },
  phoneDivider: {
    width: 1,
    height: 22,
    backgroundColor: BORDER,
    marginHorizontal: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    fontSize: fontSizes.md,
    color: BLACK,
    paddingVertical: 4,
  },
  shieldIcon: { marginLeft: spacing.sm },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: BLACK,
    borderColor: BLACK,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: BLACK,
    lineHeight: 20,
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: BLACK,
  },
  termsError: {
    fontSize: fontSizes.xs,
    color: '#dc2626',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  footerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  footerSurface: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingTop: 8,
    paddingHorizontal: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },
  footerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  button: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  buttonActive: {
    backgroundColor: CTA_ACTIVE,
  },
  buttonDisabled: {
    backgroundColor: CTA_DISABLED,
  },
  buttonLoading: {
    opacity: 0.88,
  },
  loginLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loginLinkText: {
    fontSize: fontSizes.sm,
    color: MUTED,
  },
  loginLinkBold: {
    fontWeight: '800',
    color: BLACK,
  },
});
