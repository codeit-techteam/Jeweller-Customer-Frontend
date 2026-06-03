import { BlurView } from 'expo-blur';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Modal from 'react-native-modal';
import Animated, { FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** When true, backdrop tap and Android back are ignored */
  lockDismiss?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

function ModalBackdrop() {
  if (Platform.OS === 'web') {
    return <View style={[StyleSheet.absoluteFill, styles.webBackdrop]} />;
  }
  return (
    <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
  );
}

export function AnimatedPremiumModal({
  visible,
  onClose,
  children,
  lockDismiss = false,
  contentStyle,
  testID,
}: Props) {
  const insets = useSafeAreaInsets();

  const handleBackdrop = useCallback(() => {
    if (!lockDismiss) onClose();
  }, [lockDismiss, onClose]);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleBackdrop}
      onBackButtonPress={handleBackdrop}
      customBackdrop={<ModalBackdrop />}
      backdropOpacity={0.6}
      backdropColor="#000"
      backdropTransitionInTiming={200}
      backdropTransitionOutTiming={200}
      animationInTiming={1}
      animationOutTiming={1}
      style={[styles.modalRoot, { marginTop: insets.top, marginBottom: insets.bottom }]}
      avoidKeyboard
      useNativeDriver
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating={false}
      statusBarTranslucent
      propagateSwipe={false}
    >
      <Animated.View
        testID={testID}
        entering={FadeInDown.duration(300).springify().damping(20).stiffness(180)}
        exiting={FadeOut.duration(220)}
        style={[styles.contentWrap, contentStyle]}
      >
        <Animated.View entering={ZoomIn.duration(280).springify()} style={styles.scaleWrap}>
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  scaleWrap: {
    width: '100%',
  },
  webBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
