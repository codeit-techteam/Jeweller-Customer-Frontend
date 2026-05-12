import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RemoteImage } from '@/lib/components/common/RemoteImage';
import { PLACEHOLDER_IMAGE_URI } from '@/lib/services/mock/imageUrls';

const NAVY = '#0b1f3a';
const GOLD = '#c9a227';

const STEPS = [
  { key: 'pay', label: 'PAY MONTHLY', icon: 'payments' as const, active: true },
  { key: 'discount', label: 'GET SPECIAL DISCOUNTS', icon: 'card-giftcard' as const, active: false },
  { key: 'redeem', label: 'REDEEM', icon: 'shopping-bag' as const, active: false },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  productName: string;
  productPrice: number;
  imageUri?: string | null;
};

function fmtInr(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/** Recommended monthly = 1/10 of product price (rounded to ₹100), min ₹1,000 */
function monthlyFromPrice(price: number) {
  return Math.max(1000, Math.round(price / 10 / 100) * 100);
}

export function GoldMineModal({ visible, onClose, productName, productPrice, imageUri }: Props) {
  const monthly = monthlyFromPrice(productPrice);
  const totalTen = monthly * 10;

  const scale = useRef(new Animated.Value(0.96)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      scale.setValue(0.96);
      cardOpacity.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scale, cardOpacity]);

  const handleStartPlan = useCallback(() => {
    console.log('[GoldMineModal] Start plan', { productName, monthly, totalTen });
    onClose();
  }, [onClose, productName, monthly, totalTen]);

  const thumbUri = imageUri?.startsWith('http') ? imageUri : PLACEHOLDER_IMAGE_URI;

  const blurStack = (
    <>
      <BlurView
        intensity={Platform.OS === 'ios' ? 42 : 32}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.dim} />
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.rootInner}>
        {Platform.OS === 'web' ? <View style={[StyleSheet.absoluteFillObject, styles.dimWeb]} /> : blurStack}

        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close modal" />

        <View style={styles.center} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [{ scale }],
              },
            ]}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title} numberOfLines={2}>
                Gold Mine 10+1 Plan
              </Text>
              <Pressable style={styles.closeCircle} onPress={onClose} hitSlop={8} accessibilityLabel="Close">
                <MaterialIcons name="close" size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollInner}
              bounces={false}
            >
              <View style={styles.stepperRow}>
                {STEPS.map((s) => (
                  <View key={s.key} style={styles.stepCol}>
                    <View style={[styles.stepIcon, s.active ? styles.stepIconActive : styles.stepIconInactive]}>
                      <MaterialIcons name={s.icon} size={18} color={s.active ? '#fff' : '#94a3b8'} />
                    </View>
                    <Text
                      style={[styles.stepLabel, s.active ? styles.stepLabelActive : styles.stepLabelInactive]}
                      numberOfLines={2}
                    >
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.productCard}>
                <View style={styles.thumbWrap}>
                  <RemoteImage uri={thumbUri} style={styles.thumb} resizeMode="cover" />
                </View>
                <View style={styles.productMeta}>
                  <Text style={styles.currently}>Currently Selected</Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {productName}
                  </Text>
                </View>
                <Text style={styles.productPrice}>{fmtInr(productPrice)}</Text>
              </View>

              <LinearGradient
                colors={['#132f5c', '#0b1f3a', '#050a14']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.amountCard}
              >
                <Text style={styles.amountLabel}>RECOMMENDED MONTHLY AMOUNT</Text>
                <Text style={styles.amountValue}>{fmtInr(monthly)}</Text>
                <View style={styles.tenurePill}>
                  <Text style={styles.tenureText}>10 Months Tenure</Text>
                </View>
              </LinearGradient>

              <View style={styles.calcRow}>
                <Text style={styles.calcLeft}>Your total payment (10 months)</Text>
                <Text style={styles.calcRight} numberOfLines={2}>
                  {fmtInr(monthly)} × 10 = {fmtInr(totalTen)}
                </Text>
              </View>

              <View style={styles.benefitBox}>
                <View style={styles.benefitAccent} />
                <View style={styles.benefitIconWrap}>
                  <MaterialIcons name="stars" size={22} color="#fff" />
                </View>
                <View style={styles.benefitTextCol}>
                  <Text style={styles.benefitTitle}>100% discount on 11th installment</Text>
                  <Text style={styles.benefitSub}>
                    You save 1 month EMI ({fmtInr(monthly)}) instantly.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
                onPress={handleStartPlan}
              >
                <Text style={styles.primaryBtnText}>START PLAN</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={onClose} hitSlop={8}>
                <Text style={styles.secondaryBtnText}>CLOSE</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rootInner: { flex: 1 },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  dimWeb: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '4%',
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: NAVY,
    paddingRight: 8,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollInner: {
    paddingBottom: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 4,
  },
  stepCol: {
    width: '31%',
    alignItems: 'center',
  },
  scroll: { maxHeight: 420 },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepIconActive: { backgroundColor: NAVY },
  stepIconInactive: { backgroundColor: '#e5e7eb' },
  stepLabel: {
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  stepLabelActive: { color: '#0f172a' },
  stepLabelInactive: { color: '#94a3b8' },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  thumb: { width: '100%', height: '100%' },
  productMeta: { flex: 1, minWidth: 0 },
  currently: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginBottom: 4 },
  productName: { fontSize: 13, fontWeight: '800', color: NAVY },
  productPrice: { fontSize: 14, fontWeight: '800', color: NAVY },
  amountCard: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  tenurePill: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tenureText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  calcLeft: { flex: 1, fontSize: 12, color: '#64748b' },
  calcRight: { fontSize: 12, fontWeight: '800', color: NAVY, textAlign: 'right', maxWidth: '52%' },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    overflow: 'hidden',
    marginBottom: 8,
  },
  benefitAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: GOLD,
  },
  benefitIconWrap: {
    marginLeft: 10,
    marginTop: 12,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextCol: { flex: 1, padding: 12, paddingLeft: 10 },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4,
  },
  benefitSub: {
    fontSize: 12,
    color: '#a16207',
    lineHeight: 17,
  },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8eaef',
    paddingTop: 14,
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: NAVY,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 8 },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
});
