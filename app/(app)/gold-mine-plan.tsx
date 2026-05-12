import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalculatorCard } from '@/lib/components/goldmine/CalculatorCard';
import { DonutSummary } from '@/lib/components/goldmine/DonutSummary';
import { InfoCard } from '@/lib/components/goldmine/InfoCard';
import { StepItem } from '@/lib/components/goldmine/StepItem';
import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { PLACEHOLDER_IMAGE_URI } from '@/lib/services/mock/imageUrls';
import { spacing } from '@/src/constants/theme';

const NAVY = '#0b1f48';
const GOLD = '#c9a227';
const MIN_AMOUNT = 1000;
const SLIDER_MAX = 100_000;
const SLIDER_STEP = 1000;

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clampAmount(n: number) {
  return Math.min(SLIDER_MAX, Math.max(MIN_AMOUNT, Math.round(n / SLIDER_STEP) * SLIDER_STEP));
}

/** Gold Mine 10+1 — single scrollable investment plan screen */
export default function GoldMinePlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [monthlyAmount, setMonthlyAmount] = useState(10_200);
  const [amountText, setAmountText] = useState('10200');
  const [email, setEmail] = useState('');
  const [amountErr, setAmountErr] = useState('');
  const [emailErr, setEmailErr] = useState('');

  const { totalPay, bonus, totalValue } = useMemo(() => {
    const totalPay0 = monthlyAmount * 10;
    const bonus0 = monthlyAmount;
    return { totalPay: totalPay0, bonus: bonus0, totalValue: totalPay0 + bonus0 };
  }, [monthlyAmount]);

  const syncAmountFromText = useCallback(() => {
    const raw = parseInt(amountText.replace(/\D/g, ''), 10);
    if (Number.isNaN(raw) || raw < MIN_AMOUNT) {
      setAmountErr(`Minimum ₹${MIN_AMOUNT.toLocaleString('en-IN')}`);
      setMonthlyAmount(MIN_AMOUNT);
      setAmountText(String(MIN_AMOUNT));
      return;
    }
    setAmountErr('');
    const c = clampAmount(raw);
    setMonthlyAmount(c);
    setAmountText(String(c));
  }, [amountText]);

  const onSliderChange = useCallback((v: number) => {
    const c = clampAmount(v);
    setMonthlyAmount(c);
    setAmountText(String(c));
    setAmountErr('');
  }, []);

  const validateForm = useCallback(() => {
    let ok = true;
    syncAmountFromText();
    const raw = parseInt(amountText.replace(/\D/g, ''), 10);
    if (Number.isNaN(raw) || raw < MIN_AMOUNT) {
      setAmountErr(`Minimum ₹${MIN_AMOUNT.toLocaleString('en-IN')}`);
      ok = false;
    }
    if (!email.trim()) {
      setEmailErr('Enter email');
      ok = false;
    } else if (!EMAIL_OK.test(email.trim())) {
      setEmailErr('Invalid email');
      ok = false;
    } else {
      setEmailErr('');
    }
    return ok;
  }, [amountText, email, syncAmountFromText]);

  const onStartPlan = useCallback(() => {
    if (validateForm()) {
      console.log('Start Plan', { monthlyAmount, email });
    }
  }, [validateForm, monthlyAmount, email]);

  const onClickToPay = useCallback(() => {
    console.log('Start Plan');
  }, []);

  const onCheckSavings = useCallback(() => {
    console.log('Start Plan');
  }, []);

  const onFooterContact = useCallback(() => {
    console.log('[GoldMine] Contact us');
  }, []);

  const onFooterStart = useCallback(() => {
    console.log('Start Plan');
  }, []);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.flex}>
          <View style={styles.header}>
            <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
              <MaterialIcons name="arrow-back-ios" size={20} color={NAVY} />
            </Pressable>
            <Text style={styles.headerTitle}>Investment Plan</Text>
            <View style={{ width: 28 }} />
          </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        >
          <LinearGradient
            colors={['#050d1c', '#0b1f48', '#132f5c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <RemoteImage
              uri={PLACEHOLDER_IMAGE_URI}
              style={styles.heroWatermark}
              resizeMode="cover"
            />
            <Text style={styles.heroEyebrow}>EXCLUSIVE OFFER</Text>
            <Text style={styles.heroTitle}>Gold Mine 10+1</Text>
            <Text style={styles.heroSub}>Monthly Installment Plan</Text>
          </LinearGradient>

          <View style={styles.formCard}>
            <Text style={styles.formHeadline}>Pay 10 installments, get 100% off on 11th!</Text>

            <Text style={styles.fieldLabel}>MONTHLY AMOUNT (₹)</Text>
            <TextInput
              style={styles.inputLine}
              placeholder="Enter amount (Min ₹1,000)"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={amountText}
              onChangeText={(t) => {
                setAmountText(t.replace(/[^0-9]/g, ''));
                setAmountErr('');
              }}
              onBlur={syncAmountFromText}
            />
            {amountErr ? <Text style={styles.fieldErr}>{amountErr}</Text> : null}

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>EMAIL ID</Text>
            <TextInput
              style={styles.inputLine}
              placeholder="your@email.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailErr('');
              }}
            />
            {emailErr ? <Text style={styles.fieldErr}>{emailErr}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
              onPress={onStartPlan}
            >
              <Text style={styles.primaryBtnText}>START NOW</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryLink, pressed && { opacity: 0.85 }]}
              onPress={onClickToPay}
            >
              <MaterialIcons name="payments" size={18} color={NAVY} />
              <Text style={styles.secondaryLinkText}>Click to Pay</Text>
            </Pressable>

            <View style={styles.supportRow}>
              <MaterialIcons name="headset-mic" size={16} color="#94a3b8" />
              <Text style={styles.supportText}>Support: +91 800 123 4567</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Why Gold Mine Plan?</Text>
          <View style={styles.sectionPad}>
            <InfoCard
              icon="calendar-today"
              title="Plan Ahead"
              description="Small savings for big returns."
            />
            <InfoCard
              icon="card-giftcard"
              title="For Special Moments"
              description="Perfect for birthdays & weddings."
            />
            <InfoCard
              icon="local-offer"
              title="Special Discounts"
              description="Unmatched 100% off benefits."
              iconVariant="accent"
            />
          </View>

          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.sectionPad}>
            <StepItem
              step={1}
              title="Pay Monthly"
              description="Pay 10 consistent installments."
            />
            <StepItem
              step={2}
              title="Get Special Discount"
              description="100% off on your 11th installment."
            />
            <StepItem
              step={3}
              title="Happy Shopping"
              description="Redeem and buy your favorite jewellery."
              isLast
            />
          </View>

          <CalculatorCard
            amount={monthlyAmount}
            min={MIN_AMOUNT}
            max={SLIDER_MAX}
            step={SLIDER_STEP}
            onAmountChange={onSliderChange}
            onCheckSavings={onCheckSavings}
          />

          <View style={{ height: 12 }} />

          <DonutSummary totalPay={totalPay} bonus={bonus} totalValue={totalValue} />

          <Text style={[styles.sectionTitle, { marginTop: 24, marginHorizontal: 16 }]}>Redemption Options</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.redemptionScroll}
          >
            <View style={styles.redemptionCard}>
              <View style={styles.redemptionHeader}>
                <View style={styles.redemptionBadge}>
                  <Text style={styles.redemptionBadgeText}>6 MONTHS PLAN</Text>
                </View>
                <MaterialIcons name="lock" size={16} color={GOLD} />
              </View>
              <Text style={styles.redemptionHint}>Need to redeem early?</Text>
              <Text style={styles.redemptionBold}>
                Get 40% discount on the average installment value.
              </Text>
            </View>
            <View style={styles.redemptionCard}>
              <View style={styles.redemptionHeader}>
                <View style={styles.redemptionBadge}>
                  <Text style={styles.redemptionBadgeText}>8 MONTHS PLAN</Text>
                </View>
                <MaterialIcons name="lock" size={16} color={GOLD} />
              </View>
              <Text style={styles.redemptionHint}>Flexible early exit</Text>
              <Text style={styles.redemptionBold}>
                Get 40% discount on the average installment value.
              </Text>
            </View>
          </ScrollView>

          <View style={{ height: 88 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            style={({ pressed }) => [styles.footerOutline, pressed && { opacity: 0.9 }]}
            onPress={onFooterContact}
          >
            <MaterialIcons name="chat-bubble-outline" size={18} color="#111" />
            <Text style={styles.footerOutlineText}>CONTACT US</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.footerSolid, pressed && { opacity: 0.92 }]}
            onPress={onFooterStart}
          >
            <Text style={styles.footerSolidText}>START NOW</Text>
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8eaef',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: NAVY },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  heroWatermark: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.88)', marginBottom: 4 },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formHeadline: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 18,
    lineHeight: 22,
  },
  fieldLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 0.6, marginBottom: 6 },
  inputLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  fieldErr: { fontSize: 11, color: '#dc2626', marginTop: 4 },
  primaryBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  secondaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  secondaryLinkText: { fontSize: 14, fontWeight: '700', color: NAVY },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  supportText: { fontSize: 11, color: '#94a3b8' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionPad: { paddingHorizontal: 16 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  footerOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
  },
  footerOutlineText: { fontSize: 12, fontWeight: '800', color: '#111827' },
  footerSolid: {
    flex: 1,
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerSolidText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  redemptionScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  redemptionCard: {
    width: 260,
    backgroundColor: '#f4f5f7',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  redemptionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  redemptionBadge: {
    backgroundColor: NAVY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  redemptionBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  redemptionHint: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  redemptionBold: { fontSize: 13, fontWeight: '800', color: '#111827', lineHeight: 18 },
});
