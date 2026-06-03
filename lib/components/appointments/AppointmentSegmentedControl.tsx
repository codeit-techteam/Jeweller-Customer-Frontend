import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { AppointmentTab } from '@/lib/utils/appointments';

import { luxury } from './appointmentTheme';

const TRACK_HEIGHT = 52;
const TRACK_RADIUS = 16;
const TRACK_INSET = 4;
const PILL_RADIUS = 12;
const ANIM_MS = 280;
const TAB_GAP = 4;

type TabDef = { key: AppointmentTab; label: string };

type Props = {
  tabs: TabDef[];
  activeTab: AppointmentTab;
  counts: Record<AppointmentTab, number>;
  onChange: (tab: AppointmentTab) => void;
};

type SegmentLayout = { x: number; width: number };

function formatCount(n: number): string {
  if (n > 99) return '99+';
  return String(n);
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
  const label = formatCount(count);
  const wide = label.length > 1;

  return (
    <View style={[styles.badge, wide && styles.badgeWide, active ? styles.badgeActive : styles.badgeIdle]}>
      <Text style={[styles.badgeText, active ? styles.badgeTextActive : styles.badgeTextIdle]}>
        {label}
      </Text>
    </View>
  );
}

export function AppointmentSegmentedControl({ tabs, activeTab, counts, onChange }: Props) {
  const [segmentLayouts, setSegmentLayouts] = useState<SegmentLayout[]>([]);

  const activeIndex = useMemo(
    () => Math.max(0, tabs.findIndex((t) => t.key === activeTab)),
    [tabs, activeTab],
  );

  const activeLayout = segmentLayouts[activeIndex];
  const pillLeft = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  useEffect(() => {
    if (!activeLayout) return;
    pillLeft.value = withTiming(activeLayout.x, {
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
    pillWidth.value = withTiming(activeLayout.width, {
      duration: ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeLayout, pillLeft, pillWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    left: pillLeft.value,
    width: pillWidth.value,
  }));

  const onSegmentLayout = useCallback((index: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setSegmentLayouts((prev) => {
      const next = [...prev];
      next[index] = { x, width };
      return next;
    });
  }, []);

  const handlePress = useCallback(
    (key: AppointmentTab) => {
      if (key === activeTab) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(key);
    },
    [activeTab, onChange],
  );

  const showPill = Boolean(activeLayout?.width);

  return (
    <View style={styles.outer}>
      <View style={styles.track}>
        <View style={styles.row}>
          {showPill ? (
            <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none">
              <View style={styles.goldAccent} />
            </Animated.View>
          ) : null}

          {tabs.map((tab, index) => {
            const selected = tab.key === activeTab;
            const count = counts[tab.key] ?? 0;

            return (
              <View
                key={tab.key}
                style={styles.cell}
                onLayout={(e) => onSegmentLayout(index, e)}
                collapsable={false}
              >
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  onPress={() => handlePress(tab.key)}
                  style={({ pressed }) => [
                    styles.pressable,
                    pressed && !selected && styles.pressablePressed,
                  ]}
                >
                  <Text
                    style={[styles.label, selected && styles.labelActive]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tab.label}
                  </Text>
                  <CountBadge count={count} active={selected} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignSelf: 'stretch',
  },
  track: {
    width: '100%',
    minHeight: TRACK_HEIGHT,
    backgroundColor: '#F7F7F7',
    borderRadius: TRACK_RADIUS,
    padding: TRACK_INSET,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26, 24, 20, 0.08)',
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    position: 'relative',
    minHeight: TRACK_HEIGHT - TRACK_INSET * 2,
    gap: TAB_GAP,
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: PILL_RADIUS,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26, 24, 20, 0.05)',
    overflow: 'hidden',
  },
  goldAccent: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    bottom: 0,
    height: 2.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    backgroundColor: luxury.gold,
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
  pressable: {
    flex: 1,
    minHeight: TRACK_HEIGHT - TRACK_INSET * 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  pressablePressed: {
    opacity: 0.9,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: luxury.segmentInactive,
    flexShrink: 1,
    textAlign: 'center',
  },
  labelActive: {
    fontWeight: '700',
    color: luxury.textPrimary,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeWide: {
    minWidth: 22,
    paddingHorizontal: 5,
  },
  badgeIdle: {
    backgroundColor: 'rgba(120, 116, 108, 0.14)',
  },
  badgeActive: {
    backgroundColor: luxury.goldFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  badgeTextIdle: {
    color: luxury.segmentInactive,
  },
  badgeTextActive: {
    color: luxury.goldDark,
    fontWeight: '800',
  },
});
