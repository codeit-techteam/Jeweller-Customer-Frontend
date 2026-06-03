import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalculatorCard } from '@/lib/components/goldreserve/CalculatorCard';
import { InfoCard } from '@/lib/components/goldreserve/InfoCard';
import { StepItem } from '@/lib/components/goldreserve/StepItem';
import { spacing } from '@/src/constants/theme';

const NAVY = '#001b33';
const GOLD = '#c9a227';

/** Unsplash — gold ring (per spec) */
const HERO_URI =
  'https://images.unsplash.com/photo-1611599537845-1c7aca0091c0?w=1400&q=85&auto=format&fit=crop';

/** Calculation: grams reserved per monthly installment */
const GOLD_RATE_PER_GRAM = 7440;

const MIN_FORM = 1000;
const MIN_CALC = 1000;
const CALC_MAX = 100_000;
const CALC_STEP = 1000;

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GoldReservePlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [formAmountText, setFormAmountText] = useState('2000');
  const [email, setEmail] = useState('');
  const [formAmountErr, setFormAmountErr] = useState('');
  const [emailErr, setEmailErr] = useState('');

  const [amount, setAmount] = useState(2000);

  const validateForm = useCallback(() => {
    let ok = true;
    const raw = parseInt(formAmountText.replace(/\D/g, ''), 10);
    if (Number.isNaN(raw) || raw < MIN_FORM) {
      setFormAmountErr(`Minimum ₹${MIN_FORM.toLocaleString('en-IN')}`);
      ok = false;
    } else {
      setFormAmountErr('');
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
  }, [formAmountText, email]);

  const onStartNowForm = useCallback(() => {
    if (validateForm()) {
      console.log('[GoldReserve] Start', { formAmountText, email });
    }
  }, [validateForm, formAmountText, email]);

  const onFooterContact = useCallback(() => {
    Linking.openURL('tel:18004190066').catch(() => {});
  }, []);

  const onFooterStart = useCallback(() => {
    console.log('[GoldReserve] Start now footer');
  }, []);

  const onFaq = useCallback(() => {
    Linking.openURL('https://example.com/faq').catch(() => console.log('View FAQ'));
  }, []);

  const onTerms = useCallback(() => {
    Linking.openURL('https://example.com/terms').catch(() => console.log('Terms'));
  }, []);

  const onProfile = useCallback(() => {
    router.push('/(app)/(tabs)/profile');
  }, [router]);

  const padBottom = 120 + insets.bottom;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.flex}>
          <View style={styles.topBar}>
            <Pressable hitSlop={12} onPress={() => router.back()} accessibilityRole="button">
              <MaterialIcons name="arrow-back-ios" size={20} color={NAVY} />
            </Pressable>
            <Text style={styles.topTitle} numberOfLines={1}>
              Gold Reserve 10+1
            </Text>
            <Pressable hitSlop={12} onPress={onProfile} accessibilityRole="button">
              <MaterialIcons name="account-circle" size={26} color={NAVY} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, { paddingBottom: padBottom }]}
          >
            <View style={styles.heroContainer}>
              <Image source={{ uri: HERO_URI }} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.darkOverlay} />
              <LinearGradient
                colors={['transparent', 'rgba(0,27,51,0.45)', '#001b33']}
                locations={[0.4, 0.78, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <View style={styles.heroOverlay}>
                <Text style={styles.heroTitle}>It&apos;s reigning gold</Text>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>GRP - GOLD RESERVE PLAN</Text>
                </View>
                <Text style={styles.heroIntro}>
                  Every month you pay, you receive gold units at live value. Protect your wealth from
                  market fluctuations with our premium GehnaHub reserve program.
                </Text>
              </View>
            </View>

            <View style={styles.heroSpacer} />

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>MONTHLY AMOUNT</Text>
              <TextInput
                style={styles.formInput}
                placeholder="₹ 2,000"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                value={formAmountText}
                onChangeText={(t) => {
                  setFormAmountText(t.replace(/[^0-9]/g, ''));
                  setFormAmountErr('');
                }}
              />
              {formAmountErr ? <Text style={styles.err}>{formAmountErr}</Text> : null}

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>EMAIL ID</Text>
              <TextInput
                style={styles.formInput}
                placeholder="name@gehnahub.com"
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
              {emailErr ? <Text style={styles.err}>{emailErr}</Text> : null}

              <Pressable
                style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.92 }]}
                onPress={onStartNowForm}
              >
                <Text style={styles.startBtnText}>START NOW</Text>
              </Pressable>

              <View style={styles.supportRow}>
                <MaterialIcons name="headset-mic" size={16} color="#94a3b8" />
                <Text style={styles.supportText}>For any queries call us at 1800 419 0066</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Why Gold Reserve Plan?</Text>
            <View style={styles.sectionPad}>
              <InfoCard
                icon="event-repeat"
                title="Plan Ahead"
                description="Systematic accumulation for your future milestones."
              />
              <InfoCard
                icon="savings"
                title="Gold Accumulation"
                description="Units credited at live market rates every single month."
              />
              <InfoCard
                icon="card-giftcard"
                title="Special Benefits"
                description="Exclusive vouchers and 11th month benefits."
              />
            </View>

            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.sectionPad}>
              <StepItem
                step={1}
                title="Monthly Payments"
                description="Pay 10 monthly installments to accumulate gold units at live prices."
              />
              <StepItem
                step={2}
                title="Get Special Benefits"
                description="Unlock voucher worth up to 1 installment after 10 months."
              />
              <StepItem
                step={3}
                title="Happy Shopping"
                description="Redeem your total gold value to buy exquisite jewellery."
                isLast
              />
            </View>

            <CalculatorCard
              amount={amount}
              goldRatePerGram={GOLD_RATE_PER_GRAM}
              min={MIN_CALC}
              max={CALC_MAX}
              step={CALC_STEP}
              onAmountChange={setAmount}
            />

            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Plan Information</Text>
            <View style={styles.planBox}>
              <Text style={styles.planIntro}>
                Complete your plan to unlock a benefit voucher that can be applied toward plain gold
                or jewellery purchases, subject to plan rules.
              </Text>
              <View style={styles.bulletRow}>
                <MaterialIcons name="check-circle" size={18} color={GOLD} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>Redeem for plain gold with 100% voucher benefit.</Text>
              </View>
              <View style={styles.bulletRow}>
                <MaterialIcons name="check-circle" size={18} color={GOLD} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>
                  Special making charge discounts for diamond & polki jewellery.
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <MaterialIcons name="check-circle" size={18} color={GOLD} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>Redeem after 11 months — plan-based discount benefits.</Text>
              </View>
              <Text style={styles.disclaimer}>
                Gold weight is indicative and based on the rate shown; final weight at redemption may
                vary with live rates and showroom availability. T&Cs apply.
              </Text>
            </View>

            <View style={styles.linksBlock}>
              <Pressable style={styles.linkRow} onPress={onFaq}>
                <Text style={styles.linkText}>View all FAQ</Text>
                <MaterialIcons name="open-in-new" size={18} color={NAVY} />
              </Pressable>
              <Pressable style={styles.linkRow} onPress={onTerms}>
                <Text style={styles.linkText}>View Terms & Conditions</Text>
                <MaterialIcons name="description" size={18} color={NAVY} />
              </Pressable>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable
              style={({ pressed }) => [styles.footerOutline, pressed && { opacity: 0.9 }]}
              onPress={onFooterContact}
            >
              <MaterialIcons name="phone-in-talk" size={18} color={NAVY} />
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
  safe: { flex: 1, backgroundColor: '#f0f2f5' },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8eaef',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginHorizontal: 8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  scrollContent: { paddingTop: 0 },
  heroContainer: {
    height: 380,
    width: '100%',
    backgroundColor: '#0a1628',
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  /** Flex layout keeps copy in the lower third with room above the overlapping card */
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 80,
    paddingTop: 16,
  },
  heroSpacer: {
    height: 20,
    width: '100%',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: NAVY,
    letterSpacing: 0.6,
  },
  heroIntro: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.95)',
  },
  formCard: {
    marginTop: -40,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#001b33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  fieldLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  formInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  err: { fontSize: 11, color: '#dc2626', marginTop: 4 },
  startBtn: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  startBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  supportText: { fontSize: 11, color: '#94a3b8', flex: 1, textAlign: 'center' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: NAVY,
    marginTop: 20,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionPad: { paddingHorizontal: 16 },
  planBox: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaef',
  },
  planIntro: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 14 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bulletIcon: { marginRight: 8, marginTop: 1 },
  bulletText: { flex: 1, fontSize: 13, color: '#334155', lineHeight: 19 },
  disclaimer: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 15,
    marginTop: 12,
  },
  linksBlock: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: NAVY,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  footerOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 14,
  },
  footerOutlineText: { fontSize: 12, fontWeight: '800', color: NAVY },
  footerSolid: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerSolidText: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
