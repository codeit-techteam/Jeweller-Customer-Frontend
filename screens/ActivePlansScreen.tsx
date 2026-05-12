import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MyHeader } from '@/lib/components/common/MyHeader';
import { PlanCard } from '@/lib/components/common/PlanCard';

const BG = '#ffffff';
const NAVY = '#0B1C2C';
const MUTED = '#6B7280';
const SUBTLE = '#9CA3AF';

const H_PAD = 16;

export default function ActivePlansScreen() {
  const router = useRouter();

  const openGoldReserve = useCallback(() => {
    router.push('/(app)/gold-reserve-plan');
  }, [router]);

  const openGoldMine = useCallback(() => {
    router.push('/(app)/gold-mine-plan');
  }, [router]);

  const onExplorePlans = useCallback(() => {
    router.push('/(app)/gold-reserve-plan');
  }, [router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerPad}>
        <MyHeader title="Active Plans" showBack />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Your plans</Text>
        <Text style={styles.subheading}>
          Track investments, renewals and bonuses across every active subscription.
        </Text>

        <View style={styles.plansBlock}>
          <PlanCard
            title="Gold Reserve 10+1"
            subtitle="Invest 10 months, get 1 month bonus"
            validity="Valid till Dec 2026"
            highlight
            progress={{ current: 7, total: 10, unit: 'months' }}
            onPress={openGoldReserve}
          />
          <PlanCard
            title="Gold Mine 10+"
            subtitle="Monthly savings plan"
            validity="Renews monthly"
            onPress={openGoldMine}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.eyebrow}>DISCOVER MORE</Text>
        <View style={styles.exploreCard}>
          <View style={styles.exploreIconWrap}>
            <MaterialIcons name="auto-awesome" size={22} color={NAVY} />
          </View>
          <View style={styles.exploreTextBlock}>
            <Text style={styles.exploreTitle}>Explore New Plans</Text>
            <Text style={styles.exploreSubtitle}>
              Unlock premium savings with curated gold and jewellery plans.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onExplorePlans}
          style={({ pressed }) => [styles.exploreCta, pressed && styles.pressed]}
        >
          <Text style={styles.exploreCtaText}>Explore New Plans</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },
  headerPad: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: NAVY,
  },
  subheading: {
    fontSize: 13,
    color: MUTED,
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  plansBlock: { gap: 12 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: SUBTLE,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  exploreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECEEF1',
  },
  exploreIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  exploreTextBlock: { flex: 1 },
  exploreTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: NAVY,
  },
  exploreSubtitle: {
    fontSize: 12,
    color: MUTED,
    marginTop: 3,
    lineHeight: 17,
  },
  exploreCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: NAVY,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  exploreCtaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pressed: { opacity: 0.9 },
});
