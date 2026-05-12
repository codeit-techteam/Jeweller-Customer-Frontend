import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';

type Props = {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function ShimmerBlock({ width = '100%', height, borderRadius = 10, style }: Props) {
  const translateX = useRef(new Animated.Value(-220)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 220,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [translateX]);

  return (
    <View style={[styles.base, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: '#eceff3',
  },
  shimmer: {
    width: '45%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
});
