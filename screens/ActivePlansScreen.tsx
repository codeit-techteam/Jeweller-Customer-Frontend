import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ComingSoonModal } from '@/lib/components/common/ComingSoonModal';
import { MyHeader } from '@/lib/components/common/MyHeader';
import { PlanCard } from '@/lib/components/common/PlanCard';
import type { ComingSoonPlanId } from '@/lib/config/comingSoonPlans';

const BG = '#ffffff';
const NAVY = '#0B1C2C';
const MUTED = '#6B7280';
const SUBTLE = '#9CA3AF';

const H_PAD = 16;

export default function ActivePlansScreen() {
  const [comingSoonPlan, setComingSoonPlan] = useState<ComingSoonPlanId | null>(null);

  const openComingSoon = useCallback((planId: ComingSoonPlanId) => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setComingSoonPlan(planId);
  }, []);

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
            onPress={() => openComingSoon('gold_reserve')}
          />
          <PlanCard
            title="Gold Mine 10+"
            subtitle="Monthly savings plan"
            validity="Renews monthly"
            onPress={() => openComingSoon('gold_mine')}
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
          onPress={() => openComingSoon('gold_reserve')}
          style={({ pressed }) => [styles.exploreCta, pressed && styles.pressed]}
        >
          <Text style={styles.exploreCtaText}>Explore New Plans</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#fff" />
        </Pressable>
      </ScrollView>

      <ComingSoonModal
        visible={comingSoonPlan !== null}
        planId={comingSoonPlan ?? 'gold_mine'}
        onClose={() => setComingSoonPlan(null)}
      />
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
