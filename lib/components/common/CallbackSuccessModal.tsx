import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPremiumModal } from '@/lib/components/common/AnimatedPremiumModal';

export type CallbackSuccessPayload = {
  referenceId: string;
  mobileNumber: string;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
  requirement: string;
};

const SLOT_LABELS: Record<CallbackSuccessPayload['preferredTimeSlot'], string> = {
  morning: 'Morning (9 AM – 12 PM)',
  afternoon: 'Afternoon (12 PM – 4 PM)',
  evening: 'Evening (4 PM – 8 PM)',
};

function formatPhoneDisplay(digits: string) {
  const d = digits.replace(/\D/g, '').slice(-10);
  if (d.length !== 10) return digits;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

type Props = {
  visible: boolean;
  payload: CallbackSuccessPayload | null;
  onDone: () => void;
};

export function CallbackSuccessModal({ visible, payload, onDone }: Props) {
  const ringScale = useSharedValue(0.4);
  const ringOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      ringScale.value = 0.4;
      ringOpacity.value = 0;
      checkScale.value = 0;
      return;
    }
    ringOpacity.value = withTiming(1, { duration: 200 });
    ringScale.value = withSpring(1, { damping: 14, stiffness: 180 });
    checkScale.value = withDelay(180, withSpring(1, { damping: 12, stiffness: 200 }));
  }, [visible, ringScale, ringOpacity, checkScale]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  if (!payload) return null;

  return (
    <AnimatedPremiumModal visible={visible} onClose={onDone} contentStyle={styles.modalContent}>
      <View style={styles.card}>
        <Animated.View style={[styles.iconRing, ringStyle]}>
          <Animated.View style={checkStyle}>
            <MaterialIcons name="check-circle" size={56} color="#16A34A" />
          </Animated.View>
        </Animated.View>

        <Text style={styles.title}>Request Submitted Successfully</Text>
        <Text style={styles.subtitle}>
          Our jewellery support team will contact you shortly.
        </Text>

        <View style={styles.detailsBox}>
          <DetailRow icon="phone" label="Mobile Number" value={formatPhoneDisplay(payload.mobileNumber)} />
          <DetailRow
            icon="schedule"
            label="Preferred Time Slot"
            value={SLOT_LABELS[payload.preferredTimeSlot]}
          />
          <DetailRow icon="description" label="Requirement" value={payload.requirement} multiline />
        </View>

        <Text style={styles.refLabel}>
          Reference ID: <Text style={styles.refValue}>{payload.referenceId}</Text>
        </Text>

        <TouchableOpacity activeOpacity={0.92} onPress={onDone} style={styles.ctaTouchable}>
          <LinearGradient
            colors={['#1C2E4A', '#020F1F']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>Done</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </AnimatedPremiumModal>
  );
}

function DetailRow({
  icon,
  label,
  value,
  multiline,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <MaterialIcons name={icon} size={18} color="#64748B" style={styles.detailIcon} />
      <View style={styles.detailTextCol}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={multiline ? 4 : 2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    maxWidth: 380,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
    lineHeight: 20,
  },
  refLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 18,
  },
  refValue: {
    fontWeight: '700',
    color: '#0D1B2A',
  },
  ctaTouchable: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  ctaBtn: {
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
