import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppointmentTab } from '@/lib/utils/appointments';

import { luxury } from './appointmentTheme';

const TRACK_HEIGHT = 56;
const TRACK_RADIUS = 16;
const TRACK_PADDING = 6;
const SEGMENT_GAP = 8;

type TabDef = { key: AppointmentTab; label: string };

type Props = {
  tabs: TabDef[];
  activeTab: AppointmentTab;
  counts: Record<AppointmentTab, number>;
  onChange: (tab: AppointmentTab) => void;
};

export function AppointmentSegmentedControl({ tabs, activeTab, counts, onChange }: Props) {
  const handlePress = useCallback(
    (key: AppointmentTab) => {
      if (key === activeTab) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(key);
    },
    [activeTab, onChange],
  );

  return (
    <View style={styles.track}>
      {tabs.map((tab) => {
        const selected = tab.key === activeTab;
        const count = counts[tab.key] ?? 0;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => handlePress(tab.key)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && styles.segmentPressed,
            ]}
          >
            <Text
              style={[styles.label, selected && styles.labelActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {tab.label}
            </Text>
            <View style={[styles.countPill, selected && styles.countPillActive]}>
              <Text style={[styles.countText, selected && styles.countTextActive]}>{count}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    minHeight: TRACK_HEIGHT,
    backgroundColor: luxury.segmentTrack,
    borderRadius: TRACK_RADIUS,
    padding: TRACK_PADDING,
    gap: SEGMENT_GAP,
  },
  segment: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  segmentSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1814',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26, 24, 20, 0.06)',
  },
  segmentPressed: { opacity: 0.92 },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: luxury.segmentInactive,
    flexShrink: 1,
    textAlign: 'center',
  },
  labelActive: {
    fontWeight: '700',
    color: luxury.textPrimary,
  },
  countPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(120, 116, 108, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  countPillActive: {
    backgroundColor: 'rgba(26, 24, 20, 0.08)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: luxury.segmentInactive,
    includeFontPadding: false,
  },
  countTextActive: {
    color: luxury.textPrimary,
    fontWeight: '800',
  },
});
