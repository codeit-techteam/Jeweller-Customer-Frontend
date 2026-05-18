import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { appConfig } from '@/lib/appConfig';
import { ButtonLoader } from '@/components/loaders';
const BG = '#F7F7F7';
const NAVY = '#0A1F44';
const SUB_GRAY = '#999999';
const SUBTITLE_GRAY = '#777777';
const LABEL_GRAY = '#888888';
const BORDER_LIGHT = '#EEEEEE';
const SECONDARY_BG = '#EEEEEE';
const PLACEHOLDER = '#999999';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

const DEV_AUTH_ENABLED = appConfig.devAuth;

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoggedIn } = useAuth();
  React.useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(app)/home');
    }
  }, [isLoggedIn, router]);

  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChangeNumber = useCallback((text: string) => {
    setError('');
    setMobileNumber(digitsOnly(text));
  }, []);

  const onSendOtp = useCallback(async () => {
    if (loading) return;
    if (mobileNumber.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      if (DEV_AUTH_ENABLED) {
        const result = await login(mobileNumber);
        if (result === 'not-found') {
          setError('Account not found. Please create an account.');
          setLoading(false);
          return;
        }
      }

      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone: mobileNumber },
      });
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  }, [loading, mobileNumber, router, login]);

  const onCreateAccount = useCallback(() => {
    router.push('/(auth)/create-account');
  }, [router]);

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  }, [router]);

  const displayNumber =
    mobileNumber.length <= 5
      ? mobileNumber
      : `${mobileNumber.slice(0, 5)} ${mobileNumber.slice(5)}`;

  const scrollBottomPad = 40 + Math.max(insets.bottom, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialIcons name="diamond" size={32} color={NAVY} />
            </View>
            <Text style={styles.brand}>LUXE & CO</Text>
            <Text style={styles.brandSub}>FINE JEWELLERY</Text>
          </View>

          <View style={styles.card}>
            <TouchableOpacity
              onPress={onBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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

            <Text style={styles.title}>Login to Continue</Text>
            <Text style={styles.subtitle}>Enter your mobile number to proceed</Text>

            <Text style={styles.label}>Mobile Number</Text>

            <View style={[styles.inputBox, error ? styles.inputBoxError : null]}>
              <Text style={styles.country}>+91</Text>
              <View style={styles.countryDivider} />
              <TextInput
                value={displayNumber}
                onChangeText={onChangeNumber}
                placeholder="98765 43210"
                placeholderTextColor={PLACEHOLDER}
                keyboardType="number-pad"
                maxLength={12}
                style={styles.input}
                selectionColor={NAVY}
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <ButtonLoader
              label="Send OTP"
              loading={loading}
              disabled={loading}
              onPress={onSendOtp}
              style={[styles.primaryBtn, loading ? styles.primaryBtnDisabled : null]}
            />

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onCreateAccount}
              activeOpacity={0.88}
            >
              <Text style={styles.secondaryText}>Create a Account</Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => console.log('[Login] Terms')}>
                Terms of Service
              </Text>
              {' & '}
              <Text style={styles.termsLink} onPress={() => console.log('[Login] Privacy')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  brand: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 2,
    color: NAVY,
  },
  brandSub: {
    fontSize: 12,
    color: SUB_GRAY,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  card: {
    flex: 1,
    marginTop: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    color: NAVY,
  },
  subtitle: {
    color: SUBTITLE_GRAY,
    marginBottom: 20,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    marginBottom: 6,
    color: LABEL_GRAY,
    fontSize: 13,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#fff',
  },
  inputBoxError: {
    borderColor: '#dc2626',
  },
  countryDivider: {
    width: 1,
    height: 22,
    backgroundColor: BORDER_LIGHT,
    marginRight: 10,
  },
  country: {
    marginRight: 10,
    fontWeight: '600',
    color: NAVY,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: NAVY,
    paddingVertical: 0,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#dc2626',
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: NAVY,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  secondaryBtn: {
    marginTop: 12,
    backgroundColor: SECONDARY_BG,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  secondaryText: {
    color: NAVY,
    fontWeight: '600',
    fontSize: 15,
  },
  terms: {
    marginTop: 20,
    fontSize: 12,
    textAlign: 'center',
    color: LABEL_GRAY,
    lineHeight: 18,
  },
  termsLink: {
    color: NAVY,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
