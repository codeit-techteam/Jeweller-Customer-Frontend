import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { useAuth } from '@/context/AuthContext';
import { AnimatedPremiumModal } from '@/lib/components/common/AnimatedPremiumModal';
import {
  CallbackSuccessModal,
  type CallbackSuccessPayload,
} from '@/lib/components/common/CallbackSuccessModal';
import { createCallbackRequest } from '@/services/api';

type SlotId = 'morning' | 'afternoon' | 'evening';

const TIME_SLOTS: { id: SlotId; title: string; sub: string }[] = [
  { id: 'morning', title: 'Morning', sub: '(9 AM - 12 PM)' },
  { id: 'afternoon', title: 'Afternoon', sub: '(12 PM - 4 PM)' },
  { id: 'evening', title: 'Evening', sub: '(4 PM - 8 PM)' },
];

const REQUIREMENT_MAX = 300;
const REQUIREMENT_MIN = 5;

type FieldErrors = {
  mobileNumber?: string;
  preferredTimeSlot?: string;
  requirement?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(-10);
}

function validateForm(
  phone: string,
  slot: SlotId | null,
  inquiry: string,
): FieldErrors {
  const errors: FieldErrors = {};
  const mobile = digitsOnly(phone);
  if (!mobile) {
    errors.mobileNumber = 'Mobile number is required';
  } else if (mobile.length !== 10) {
    errors.mobileNumber = 'Enter a valid 10-digit mobile number';
  }
  if (!slot) {
    errors.preferredTimeSlot = 'Please select a preferred time slot';
  }
  const trimmed = inquiry.trim();
  if (!trimmed) {
    errors.requirement = 'Please describe what you are looking for';
  } else if (trimmed.length < REQUIREMENT_MIN) {
    errors.requirement = `At least ${REQUIREMENT_MIN} characters required`;
  } else if (trimmed.length > REQUIREMENT_MAX) {
    errors.requirement = `Maximum ${REQUIREMENT_MAX} characters allowed`;
  }
  return errors;
}

export function CallbackModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { user } = useAuth();

  const modalMaxHeight = useMemo(
    () => Math.min(windowHeight * 0.82, 560),
    [windowHeight],
  );

  const [phone, setPhone] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SlotId | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successPayload, setSuccessPayload] = useState<CallbackSuccessPayload | null>(null);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = useCallback(() => {
    setPhone('');
    setInquiry('');
    setSelectedSlot(null);
    setErrors({});
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (visible) {
      setFormVisible(true);
      setSuccessVisible(false);
      setSuccessPayload(null);
      resetForm();
    } else {
      resetForm();
      setFormVisible(false);
      setSuccessVisible(false);
      setSuccessPayload(null);
    }
  }, [visible, resetForm]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    };
  }, []);

  const handleDismissAll = useCallback(() => {
    if (submitting) return;
    resetForm();
    setFormVisible(false);
    setSuccessVisible(false);
    setSuccessPayload(null);
    onClose();
  }, [submitting, resetForm, onClose]);

  const handleFormClose = useCallback(() => {
    if (submitting) return;
    handleDismissAll();
  }, [submitting, handleDismissAll]);

  const inquiryLength = inquiry.trim().length;
  const showCharCount = inquiry.length > 0;

  const slotError = errors.preferredTimeSlot;

  const handleSubmit = useCallback(async () => {
    const nextErrors = validateForm(phone, selectedSlot, inquiry);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    if (submitting || !selectedSlot) return;

    setSubmitting(true);
    try {
      const result = await createCallbackRequest({
        customerId: user?.id ?? null,
        customerName: user?.full_name ?? null,
        mobileNumber: digitsOnly(phone),
        preferredTimeSlot: selectedSlot,
        requirement: inquiry.trim(),
      });

      const payload: CallbackSuccessPayload = {
        referenceId: result.referenceId,
        mobileNumber: result.mobileNumber,
        preferredTimeSlot: result.preferredTimeSlot,
        requirement: result.requirement,
      };

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setFormVisible(false);
      resetForm();

      successTimerRef.current = setTimeout(() => {
        setSuccessPayload(payload);
        setSuccessVisible(true);
        Toast.show({
          type: 'success',
          text1: 'Callback request submitted successfully',
          visibilityTime: 3000,
        });
      }, 300);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message: string }).message === 'string'
          ? (err as { message: string }).message
          : 'Could not submit your request. Please try again.';
      Toast.show({ type: 'error', text1: message });
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSubmitting(false);
    }
  }, [phone, selectedSlot, inquiry, submitting, user, resetForm]);

  const handleSuccessDone = useCallback(() => {
    setSuccessVisible(false);
    setSuccessPayload(null);
    onClose();
  }, [onClose]);

  const bottomPad = useMemo(() => Math.max(insets.bottom, 12), [insets.bottom]);

  return (
    <>
      <AnimatedPremiumModal
        visible={visible && formVisible}
        onClose={handleFormClose}
        lockDismiss={submitting}
        contentStyle={styles.modalContent}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.keyboardView, { maxHeight: modalMaxHeight }]}
        >
          <View
            style={[
              styles.modalContainer,
              { maxHeight: modalMaxHeight, paddingBottom: bottomPad },
            ]}
          >
            <ScrollView
              style={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Request a Callback</Text>
                <TouchableOpacity
                  onPress={handleFormClose}
                  disabled={submitting}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Text style={[styles.close, submitting && styles.closeDisabled]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>Our jewellery expert will call you shortly</Text>

              <Text style={styles.label}>MOBILE NUMBER</Text>
              <View
                style={[
                  styles.inputBox,
                  errors.mobileNumber ? styles.inputBoxError : null,
                ]}
              >
                <TextInput
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(digitsOnly(t));
                    if (errors.mobileNumber) {
                      setErrors((e) => ({ ...e, mobileNumber: undefined }));
                    }
                  }}
                  maxLength={10}
                  editable={!submitting}
                  accessibilityLabel="Mobile number"
                />
                <MaterialIcons name="smartphone" size={22} color="#cbd5e1" />
              </View>
              {errors.mobileNumber ? (
                <Text style={styles.errorText} accessibilityLiveRegion="polite">
                  {errors.mobileNumber}
                </Text>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.label}>PREFERRED TIME SLOT</Text>
                <View style={styles.slotContainer}>
                  {TIME_SLOTS.map((slot) => {
                    const active = selectedSlot === slot.id;
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectedSlot(slot.id);
                          if (errors.preferredTimeSlot) {
                            setErrors((e) => ({ ...e, preferredTimeSlot: undefined }));
                          }
                        }}
                        disabled={submitting}
                        style={[styles.slotBtn, active && styles.activeSlot]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.slotTitle, active && styles.activeSlotTitle]}>
                          {slot.title}
                        </Text>
                        <Text style={[styles.slotSub, active && styles.activeSlotSub]}>
                          {slot.sub}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {slotError ? (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {slotError}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.label}>WHAT ARE YOU LOOKING FOR?</Text>
              <TextInput
                placeholder="E.g. Engagement rings, Custom gold bands..."
                placeholderTextColor="#94a3b8"
                multiline
                style={[
                  styles.textArea,
                  errors.requirement ? styles.textAreaError : null,
                ]}
                value={inquiry}
                onChangeText={(t) => {
                  setInquiry(t.slice(0, REQUIREMENT_MAX));
                  if (errors.requirement) {
                    setErrors((e) => ({ ...e, requirement: undefined }));
                  }
                }}
                maxLength={REQUIREMENT_MAX}
                textAlignVertical="top"
                editable={!submitting}
                accessibilityLabel="Requirement description"
              />
              <View style={styles.textAreaMeta}>
                {errors.requirement ? (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {errors.requirement}
                  </Text>
                ) : (
                  <View />
                )}
                {showCharCount ? (
                  <Text
                    style={[
                      styles.charCount,
                      inquiryLength < REQUIREMENT_MIN && inquiryLength > 0
                        ? styles.charCountWarn
                        : null,
                    ]}
                  >
                    {inquiryLength}/{REQUIREMENT_MAX}
                  </Text>
                ) : null}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={handleSubmit}
                disabled={submitting}
                style={[styles.ctaTouchable, submitting && styles.ctaDisabled]}
                accessibilityRole="button"
                accessibilityState={{ disabled: submitting, busy: submitting }}
              >
                <LinearGradient
                  colors={['#1C2E4A', '#020F1F']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.ctaBtn}
                >
                  {submitting ? (
                    <View style={styles.ctaRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.ctaText}>Submitting Request...</Text>
                    </View>
                  ) : (
                    <Text style={styles.ctaText}>Request Callback</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFormClose}
                disabled={submitting}
                activeOpacity={0.7}
                style={styles.cancelWrap}
              >
                <Text style={styles.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </AnimatedPremiumModal>

      <CallbackSuccessModal
        visible={visible && successVisible}
        payload={successPayload}
        onDone={handleSuccessDone}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    maxWidth: 400,
  },
  keyboardView: {
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    width: '100%',
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  scrollBody: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  footer: {
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EEF2F6',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    paddingRight: 12,
  },
  close: {
    fontSize: 18,
    color: '#334155',
    fontWeight: '300',
    lineHeight: 22,
  },
  closeDisabled: {
    opacity: 0.35,
  },
  subtitle: {
    color: '#666',
    marginTop: 6,
    marginBottom: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 4,
    paddingBottom: 4,
  },
  inputBoxError: {
    borderBottomColor: '#DC2626',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 4,
    marginTop: 4,
  },
  slotContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  slotBtn: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeSlot: {
    backgroundColor: '#0D1B2A',
  },
  slotTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555',
  },
  activeSlotTitle: {
    color: '#fff',
  },
  slotSub: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeSlotSub: {
    color: 'rgba(255,255,255,0.88)',
  },
  textArea: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    minHeight: 64,
    maxHeight: 96,
    fontSize: 15,
    color: '#0f172a',
  },
  textAreaError: {
    borderBottomColor: '#DC2626',
  },
  textAreaMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  charCountWarn: {
    color: '#D97706',
  },
  ctaTouchable: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 4,
  },
  ctaDisabled: {
    opacity: 0.85,
  },
  ctaBtn: {
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelWrap: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  cancel: {
    textAlign: 'center',
    color: '#777',
    fontSize: 15,
    fontWeight: '500',
  },
});
