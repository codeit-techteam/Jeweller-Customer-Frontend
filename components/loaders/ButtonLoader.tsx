import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ButtonLoader({ label, loading = false, disabled = false, onPress, style }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const blocked = disabled || loading;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: blocked ? 0.72 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [blocked, opacity]);

  return (
    <Animated.View style={[{ opacity }]}>
      <Pressable onPress={onPress} disabled={blocked} style={[styles.button, style]}>
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.text}>{label}</Text>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1F44',
    paddingHorizontal: 18,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
