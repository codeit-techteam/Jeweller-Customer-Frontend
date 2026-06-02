import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { appConfig } from '@/lib/appConfig';
import { ButtonLoader } from '@/components/loaders';

const BG = '#F6F7F9';
const NAVY = '#0A1F44';
const ICON_CIRCLE_BG = '#E9EDF3';
const SUBTITLE_GRAY = '#777777';
const MUTED = '#888888';
const BADGE_TEXT = '#555555';
const BORDER_LIGHT = '#EEEEEE';
const OTP_LEN = 6;
const RESEND_SECONDS = 30;
const DEV_AUTH_ENABLED = appConfig.devAuth;

function paramStr(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? raw[0] : raw;
}

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 5) return d.length ? `+91 ${d}` : '';
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

function emptyOtp(): string[] {
  return Array(OTP_LEN).fill('');
}

type VerifyParams = {
  phone?: string | string[];
  name?: string | string[];
  email?: string | string[];
};

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<VerifyParams>();
  const { verifyOtp } = useAuth();
  const phoneDigits = useMemo(
    () => paramStr(params.phone).replace(/\D/g, '').slice(0, 10),
    [params.phone],
  );
  const displayPhone = useMemo(() => formatPhoneDisplay(phoneDigits), [phoneDigits]);

  const [otp, setOtp] = useState<string[]>(() => emptyOtp());
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [isResendAvailable, setIsResendAvailable] = useState(false);
  const [resendKey, setResendKey] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const focusAnim = useRef(Array.from({ length: OTP_LEN }, () => new Animated.Value(0))).current;
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const { width: screenWidth } = useWindowDimensions();

  const otpGap = useMemo(() => {
    if (screenWidth <= 340) return 6;
    if (screenWidth <= 390) return 8;
    return 10;
  }, [screenWidth]);

  const otpBoxSize = useMemo(() => {
    const horizontalScreenPadding = 20 * 2;
    const maxOtpRowWidth = 340;
    const containerWidth = Math.min(Math.max(screenWidth - horizontalScreenPadding, 280), maxOtpRowWidth);
    const rawSize = Math.floor((containerWidth - otpGap * (OTP_LEN - 1)) / OTP_LEN);
    return Math.max(40, Math.min(rawSize, 52));
  }, [otpGap, screenWidth]);

  const otpRowWidth = useMemo(
    () => otpBoxSize * OTP_LEN + otpGap * (OTP_LEN - 1),
    [otpBoxSize, otpGap],
  );

  useEffect(() => {
    if (phoneDigits.length !== 10) {
      router.replace('/(auth)/login');
    }
  }, [phoneDigits, router]);

  useEffect(() => {
    let isCancelled = false;

    async function sendInitialOtp() {
      try {
        if (DEV_AUTH_ENABLED) {
          const { sendTestOTP } = await import('../../services/devAuthService');
          await sendTestOTP(phoneDigits);
          return;
        }

        const { sendOTP } = await import('../../services/authService');
        await sendOTP(phoneDigits);
      } catch {
        if (!isCancelled) {
          setError('Could not send OTP. Please try again.');
        }
      }
    }

    if (phoneDigits.length === 10) {
      sendInitialOtp();
    }

    setTimer(RESEND_SECONDS);
    setIsResendAvailable(false);
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(id);
          setIsResendAvailable(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [resendKey, phoneDigits]);

  const setInputRef = useCallback((index: number) => (el: TextInput | null) => {
    inputsRef.current[index] = el;
  }, []);

  const handleOtpChange = useCallback(
    (text: string, index: number) => {
      setError('');
      const digits = text.replace(/\D/g, '');
      const digit = digits.slice(-1);
      setOtp((prev) => {
        const next = [...prev];
        if (digits.length > 1) {
          const fill = digits.slice(0, OTP_LEN - index).split('');
          fill.forEach((d, offset) => {
            next[index + offset] = d;
          });
        } else {
          next[index] = digit;
        }
        return next;
      });

      if (digits.length > 1) {
        const target = Math.min(index + digits.length, OTP_LEN - 1);
        inputsRef.current[target]?.focus();
        return;
      }

      if (digit && index < OTP_LEN - 1) {
        requestAnimationFrame(() => inputsRef.current[index + 1]?.focus());
      }
    },
    [],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key !== 'Backspace') return;

      if (otp[index]) {
        setOtp((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
        return;
      }

      if (index > 0) {
        setOtp((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
        requestAnimationFrame(() => inputsRef.current[index - 1]?.focus());
      }
    },
    [otp],
  );

  const animateFocus = useCallback(
    (index: number, toValue: number) => {
      Animated.timing(focusAnim[index], {
        toValue,
        duration: 160,
        useNativeDriver: true,
      }).start();
    },
    [focusAnim],
  );

  const handleFocus = useCallback(
    (index: number) => {
      setFocusedIndex(index);
      animateFocus(index, 1);
    },
    [animateFocus],
  );

  const handleBlur = useCallback(
    (index: number) => {
      animateFocus(index, 0);
      setFocusedIndex((prev) => (prev === index ? null : prev));
    },
    [animateFocus],
  );

  const onVerify = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== OTP_LEN) {
      setError(`Please enter the complete ${OTP_LEN}-digit code.`);
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const name = paramStr(params.name);
      const email = paramStr(params.email);

      const result = await verifyOtp(phoneDigits, code, {
        fullName: name || undefined,
        email: email || undefined,
      });

      if (result === 'invalid-otp') {
        setError('Invalid OTP');
        setSubmitting(false);
        return;
      }

      // Navigation is handled by PostLoginSyncHandler after session persist.
      setSubmitting(false);
    } catch (e: any) {
      const rawMessage = typeof e?.message === 'string' ? e.message : '';
      let friendly = 'Could not verify the code. Please try again.';

      const lowered = rawMessage.toLowerCase();
      if (lowered.includes('expired')) {
        friendly = 'This code has expired. Please request a new OTP.';
      } else if (lowered.includes('invalid') || lowered.includes('token')) {
        friendly = 'The OTP you entered is invalid. Please check and try again.';
      } else if (lowered.includes('rate limit') || lowered.includes('too many')) {
        friendly = 'Too many attempts. Please wait a moment before trying again.';
      } else if (!rawMessage) {
        friendly = 'Network or server error. Please check your connection and retry.';
      } else {
        friendly = rawMessage;
      }

      setError(friendly);
    } finally {
      setSubmitting(false);
    }
  }, [otp, submitting, params.name, params.email, phoneDigits, router]);

  const onResend = useCallback(async () => {
    if (!isResendAvailable) return;
    setOtp(emptyOtp());
    setError('');
    setIsResendAvailable(false);
    setTimer(RESEND_SECONDS);
    setResendKey((k) => k + 1);
    try {
      if (DEV_AUTH_ENABLED) {
        const { sendTestOTP } = await import('../../services/devAuthService');
        await sendTestOTP(phoneDigits);
      } else {
        const { sendOTP } = await import('../../services/authService');
        await sendOTP(phoneDigits);
      }
    } catch {
      setError('Could not resend OTP. Please try again.');
    }
    requestAnimationFrame(() => inputsRef.current[0]?.focus());
  }, [isResendAvailable, phoneDigits]);

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/login');
  }, [router]);

  const footerBottom = Math.max(16, insets.bottom + 12);

  if (phoneDigits.length !== 10) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>
            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: footerBottom + 24 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              bounces
            >
              <View style={styles.column}>
                <View style={styles.topBar}>
                  <TouchableOpacity
                    onPress={onBack}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.topBarSide}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={Platform.OS === 'android' ? 'arrow-back' : 'arrow-back-ios'}
                      size={22}
                      color={NAVY}
                    />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Verify OTP</Text>
                  <View style={styles.topBarSide} />
                </View>

                <View style={styles.heroBlock}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="lock-open" size={24} color={NAVY} />
                  </View>
                  <Text style={styles.heroTitle}>Verify OTP</Text>
                  <Text style={styles.subtitle}>
                    Enter the {OTP_LEN}-digit code sent to{'\n'}
                    {displayPhone}
                  </Text>

                  <View style={[styles.otpContainer, { width: otpRowWidth }]}>
                    {otp.map((digit, index) => (
                      <Animated.View
                        key={index}
                        style={[
                          styles.otpBoxWrap,
                          {
                            width: otpBoxSize,
                            height: otpBoxSize,
                            marginRight: index < OTP_LEN - 1 ? otpGap : 0,
                            transform: [
                              {
                                scale: focusAnim[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.04],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        <TextInput
                          ref={setInputRef(index)}
                          style={[
                            styles.otpBox,
                            error ? styles.otpBoxError : null,
                            focusedIndex === index ? styles.otpBoxFocused : null,
                          ]}
                          keyboardType="number-pad"
                          maxLength={OTP_LEN}
                          value={digit}
                          placeholder="·"
                          placeholderTextColor="#bbbbbb"
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          onFocus={() => handleFocus(index)}
                          onBlur={() => handleBlur(index)}
                          textAlign="center"
                          selectionColor={NAVY}
                          autoFocus={index === 0}
                        />
                      </Animated.View>
                    ))}
                  </View>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                <View style={styles.buttonContainer}>
                  <ButtonLoader
                    label="Verify & Proceed"
                    loading={submitting}
                    disabled={submitting || otp.join('').length !== OTP_LEN}
                    onPress={onVerify}
                    style={[
                      styles.button,
                      (submitting || otp.join('').length !== OTP_LEN) ? styles.buttonDisabled : null,
                    ]}
                  />
                </View>

                <View style={styles.resendBlock}>
                  <Text style={styles.resendText}>Didn&apos;t receive the code?</Text>
                  {!isResendAvailable ? (
                    <Text style={styles.timerLine}>
                      Resend OTP in{' '}
                      <Text style={styles.timerBold}>
                        00:{timer < 10 ? `0${timer}` : timer}
                      </Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={onResend} activeOpacity={0.7} style={styles.resendBtn}>
                      <Text style={styles.resendLink}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.footerSpacer} />

                <View style={styles.footer}>
                  <View style={styles.securePill}>
                    <MaterialIcons name="shield" size={16} color={NAVY} style={styles.secureIcon} />
                    <Text style={styles.secure}>Secure Verification</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  column: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    minHeight: 44,
  },
  topBarSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: NAVY,
    textAlign: 'center',
  },
  heroBlock: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ICON_CIRCLE_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: NAVY,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: SUBTITLE_GRAY,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    alignSelf: 'center',
    maxWidth: '100%',
  },
  otpBoxWrap: {
    borderRadius: 14,
  },
  otpBox: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#fff',
    fontSize: 22,
    fontWeight: '600',
    color: NAVY,
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  otpBoxFocused: {
    borderColor: NAVY,
  },
  otpBoxError: {
    borderColor: '#dc2626',
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'stretch',
  },
  resendBlock: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: NAVY,
    height: 50,
    width: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: NAVY,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  resendText: {
    marginTop: 20,
    color: MUTED,
    fontSize: 14,
  },
  resendBtn: {
    marginTop: 6,
    paddingVertical: 4,
  },
  resendLink: {
    color: NAVY,
    fontWeight: '700',
    fontSize: 14,
  },
  timerLine: {
    marginTop: 8,
    fontSize: 14,
    color: MUTED,
  },
  timerBold: {
    fontWeight: '700',
    color: NAVY,
  },
  footerSpacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 8,
  },
  securePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ICON_CIRCLE_BG,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  secureIcon: {
    marginRight: 6,
  },
  secure: {
    fontSize: 12,
    color: BADGE_TEXT,
    fontWeight: '600',
  },
});
