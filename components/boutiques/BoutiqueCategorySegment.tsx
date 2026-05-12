import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type BoutiqueCategoryTab = 'ALL' | 'NEAR ME';

const ACTIVE_BG = '#0F172A';
const ACTIVE_TEXT = '#FFFFFF';
const INACTIVE_TEXT = '#6B7280';
const TRACK_BORDER = 'rgba(0,0,0,0.08)';
const INSET = 4;

const SPRING = { damping: 22, stiffness: 220, mass: 0.85 };

type Props = {
  value: BoutiqueCategoryTab;
  onChange: (next: BoutiqueCategoryTab) => void;
};

export function BoutiqueCategorySegment({ value, onChange }: Props) {
  const trackW = useSharedValue(0);
  const index = useSharedValue(value === 'ALL' ? 0 : 1);
  const scaleAll = useSharedValue(1);
  const scaleNear = useSharedValue(1);

  useEffect(() => {
    index.value = withSpring(value === 'ALL' ? 0 : 1, SPRING);
  }, [value, index]);

  const onTrackLayout = useCallback(
    (e: LayoutChangeEvent) => {
      trackW.value = e.nativeEvent.layout.width;
    },
    [trackW],
  );

  const pillStyle = useAnimatedStyle(() => {
    const w = trackW.value;
    if (w <= INSET * 2) return { opacity: 0 };
    const segW = (w - INSET * 2) / 2;
    return {
      opacity: 1,
      width: segW,
      transform: [{ translateX: INSET + index.value * segW }],
    };
  });

  const allLabelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAll.value }],
  }));
  const nearLabelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleNear.value }],
  }));

  const select = useCallback(
    (next: BoutiqueCategoryTab) => {
      if (next === value) return;
      void Haptics.selectionAsync().catch(() => {});
      onChange(next);
    },
    [onChange, value],
  );

  const bump = (which: 'all' | 'near') => {
    const sv = which === 'all' ? scaleAll : scaleNear;
    sv.value = withTiming(0.96, { duration: 70 }, () => {
      sv.value = withSpring(1, { damping: 12, stiffness: 400 });
    });
  };

  return (
    <View style={styles.glassOuter}>
      <View style={styles.track} onLayout={onTrackLayout}>
        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: value === 'ALL' }}
            style={styles.cell}
            onPress={() => select('ALL')}
            onPressIn={() => bump('all')}
          >
            <Animated.View style={[styles.cellInner, allLabelStyle]}>
              <MaterialIcons
                name="apps"
                size={17}
                color={value === 'ALL' ? ACTIVE_TEXT : INACTIVE_TEXT}
                style={styles.icon}
              />
              <Text style={[styles.label, value === 'ALL' ? styles.labelActive : styles.labelInactive]}>ALL</Text>
            </Animated.View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: value === 'NEAR ME' }}
            style={styles.cell}
            onPress={() => select('NEAR ME')}
            onPressIn={() => bump('near')}
          >
            <Animated.View style={[styles.cellInner, nearLabelStyle]}>
              <MaterialIcons
                name="near-me"
                size={17}
                color={value === 'NEAR ME' ? ACTIVE_TEXT : INACTIVE_TEXT}
                style={styles.icon}
              />
              <Text
                style={[styles.label, value === 'NEAR ME' ? styles.labelActive : styles.labelInactive]}
                numberOfLines={1}
              >
                NEAR ME
              </Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glassOuter: {
    marginTop: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TRACK_BORDER,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.95)',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  track: {
    borderRadius: 999,
    overflow: 'hidden',
    minHeight: 48,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: INSET,
    bottom: INSET,
    borderRadius: 999,
    backgroundColor: ACTIVE_BG,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 48,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  icon: { marginTop: -1 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.65,
  },
  labelActive: { color: ACTIVE_TEXT },
  labelInactive: { color: INACTIVE_TEXT },
});
