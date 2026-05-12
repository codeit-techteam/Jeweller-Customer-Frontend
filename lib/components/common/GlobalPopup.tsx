import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';

import { type PopupType, usePopupStore } from '@/lib/stores/popupStore';

const NAVY = '#0A2540';

type Palette = {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  ringBg: string;
};

const PALETTES: Record<PopupType, Palette> = {
  success: { icon: 'check-circle', iconColor: '#16A34A', ringBg: '#E7F7EE' },
  error: { icon: 'error-outline', iconColor: '#DC2626', ringBg: '#FDECEC' },
  confirm: { icon: 'warning-amber', iconColor: '#D97706', ringBg: '#FFF4E5' },
  info: { icon: 'info-outline', iconColor: '#2563EB', ringBg: '#E8F0FE' },
};

const DEFAULT_TITLES: Record<PopupType, string> = {
  success: 'Success',
  error: 'Something went wrong',
  confirm: 'Are you sure?',
  info: 'Heads up',
};

export function GlobalPopup() {
  const visible = usePopupStore((s) => s.visible);
  const type = usePopupStore((s) => s.type);
  const title = usePopupStore((s) => s.title);
  const message = usePopupStore((s) => s.message);
  const confirmLabel = usePopupStore((s) => s.confirmLabel);
  const cancelLabel = usePopupStore((s) => s.cancelLabel);
  const destructive = usePopupStore((s) => s.destructive);
  const autoDismiss = usePopupStore((s) => s.autoDismiss);
  const onConfirm = usePopupStore((s) => s.onConfirm);
  const onCancel = usePopupStore((s) => s.onCancel);
  const hidePopup = usePopupStore((s) => s.hidePopup);

  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } else if (type === 'confirm') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [visible, type]);

  useEffect(() => {
    if (!visible) return;
    if (type === 'confirm') return;

    let duration: number | null = null;
    if (typeof autoDismiss === 'number') duration = autoDismiss;
    else if (autoDismiss === true) duration = 2000;
    else if (autoDismiss === undefined && type === 'success') duration = 2000;

    if (duration == null) return;

    dismissTimer.current = setTimeout(() => {
      hidePopup();
    }, duration);

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [visible, type, autoDismiss, hidePopup]);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    clearTimer();
    hidePopup();
    onCancel?.();
  }, [clearTimer, hidePopup, onCancel]);

  const handleConfirm = useCallback(async () => {
    clearTimer();
    hidePopup();
    if (onConfirm) await onConfirm();
  }, [clearTimer, hidePopup, onConfirm]);

  const palette = PALETTES[type];
  const resolvedTitle = title || DEFAULT_TITLES[type];
  const resolvedConfirmLabel = confirmLabel || (type === 'confirm' ? 'Confirm' : 'OK');
  const resolvedCancelLabel = cancelLabel || 'Cancel';
  const isDestructive = destructive || (type === 'confirm' && /delete|remove|logout|cancel/i.test(resolvedConfirmLabel));

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={type === 'confirm' ? handleCancel : hidePopup}
      onBackButtonPress={type === 'confirm' ? handleCancel : hidePopup}
      backdropOpacity={0.5}
      backdropColor="#000"
      style={styles.modalRoot}
      animationIn="zoomIn"
      animationOut="fadeOut"
      animationInTiming={240}
      animationOutTiming={180}
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
      statusBarTranslucent
    >
      <View style={styles.card}>
        <View style={[styles.iconRing, { backgroundColor: palette.ringBg }]}>
          <MaterialIcons name={palette.icon} size={36} color={palette.iconColor} />
        </View>

        <Text style={styles.title}>{resolvedTitle}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.actions}>
          {type === 'confirm' ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.cancelBtn}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={resolvedCancelLabel}
            >
              <Text style={styles.cancelText}>{resolvedCancelLabel}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.primaryBtn,
              isDestructive && styles.primaryBtnDanger,
              type === 'success' && styles.primaryBtnSuccess,
              type === 'error' && styles.primaryBtnDanger,
            ]}
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel={resolvedConfirmLabel}
          >
            <Text style={styles.primaryText}>{resolvedConfirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: NAVY,
    marginTop: 2,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 22,
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 15,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryBtnDanger: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  primaryBtnSuccess: {
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
