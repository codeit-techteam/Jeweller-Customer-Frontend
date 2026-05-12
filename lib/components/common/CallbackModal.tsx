import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
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
import Modal from 'react-native-modal';

type SlotId = 'morning' | 'afternoon' | 'evening';

const TIME_SLOTS: { id: SlotId; title: string; sub: string }[] = [
  { id: 'morning', title: 'Morning', sub: '(9 AM - 12 PM)' },
  { id: 'afternoon', title: 'Afternoon', sub: '(12 PM - 4 PM)' },
  { id: 'evening', title: 'Evening', sub: '(4 PM - 8 PM)' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CallbackModal({ visible, onClose }: Props) {
  const [phone, setPhone] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SlotId>('morning');

  const handleSubmit = useCallback(() => {
    console.log('Callback requested', {
      phone,
      selectedSlot,
      inquiry,
    });
    setPhone('');
    setInquiry('');
    setSelectedSlot('morning');
    onClose();
  }, [phone, selectedSlot, inquiry, onClose]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.5}
      backdropColor="#000"
      style={styles.modalRoot}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={260}
      animationOutTiming={200}
      avoidKeyboard
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Request a Callback</Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>Our jewellery expert will call you shortly</Text>

            <Text style={styles.label}>MOBILE NUMBER</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="+91 98765 43210"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={16}
              />
              <MaterialIcons name="smartphone" size={22} color="#cbd5e1" />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>PREFERRED TIME SLOT</Text>
              <View style={styles.slotContainer}>
                {TIME_SLOTS.map((slot) => {
                  const active = selectedSlot === slot.id;
                  return (
                    <TouchableOpacity
                      key={slot.id}
                      activeOpacity={0.85}
                      onPress={() => setSelectedSlot(slot.id)}
                      style={[styles.slotBtn, active && styles.activeSlot]}
                    >
                      <Text style={[styles.slotTitle, active && styles.activeSlotTitle]}>
                        {slot.title}
                      </Text>
                      <Text style={[styles.slotSub, active && styles.activeSlotSub]}>{slot.sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.label}>WHAT ARE YOU LOOKING FOR?</Text>
            <TextInput
              placeholder="E.g. Engagement rings, Custom gold bands..."
              placeholderTextColor="#94a3b8"
              multiline
              style={styles.textArea}
              value={inquiry}
              onChangeText={setInquiry}
              maxLength={500}
              textAlignVertical="top"
            />

            <TouchableOpacity
              activeOpacity={0.92}
              onPress={handleSubmit}
              style={styles.ctaTouchable}
            >
              <LinearGradient
                colors={['#1C2E4A', '#020F1F']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaText}>Request Callback</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.cancelWrap}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    justifyContent: 'center',
    margin: 20,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    maxHeight: '92%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  scrollContent: {
    paddingBottom: 8,
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
  subtitle: {
    color: '#666',
    marginTop: 6,
    marginBottom: 20,
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
    marginBottom: 20,
    paddingBottom: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  section: {
    marginBottom: 4,
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  slotBtn: {
    flexGrow: 1,
    flexBasis: '28%',
    minWidth: 100,
    backgroundColor: '#F2F2F2',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeSlot: {
    backgroundColor: '#0D1B2A',
  },
  slotTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  activeSlotTitle: {
    color: '#fff',
  },
  slotSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  activeSlotSub: {
    color: 'rgba(255,255,255,0.88)',
  },
  textArea: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    minHeight: 88,
    marginBottom: 22,
    fontSize: 15,
    color: '#0f172a',
  },
  ctaTouchable: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 4,
  },
  ctaBtn: {
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelWrap: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  cancel: {
    textAlign: 'center',
    color: '#777',
    fontSize: 15,
    fontWeight: '500',
  },
});
