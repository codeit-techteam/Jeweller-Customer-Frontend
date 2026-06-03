import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontSizes } from '@/src/constants/theme';

export type BoutiqueSortOptionId =
  | 'NEAREST'
  | 'HIGHEST_RATED'
  | 'MOST_REVIEWED'
  | 'RECENTLY_ADDED'
  | 'OPEN_NOW';

export const BOUTIQUE_SORT_OPTIONS: {
  id: BoutiqueSortOptionId;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}[] = [
  { id: 'NEAREST', label: 'Nearest', icon: 'near-me' },
  { id: 'HIGHEST_RATED', label: 'Highest Rated', icon: 'star-outline' },
  { id: 'MOST_REVIEWED', label: 'Most Reviewed', icon: 'rate-review' },
  { id: 'RECENTLY_ADDED', label: 'Recently Added', icon: 'fiber-new' },
];

type SortRowDef = {
  id: BoutiqueSortOptionId;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

const ALL_SORT_ROWS: SortRowDef[] = [...BOUTIQUE_SORT_OPTIONS];

const NAVY = '#0D1B2A';
const NAVY_SOFT = 'rgba(13, 27, 42, 0.06)';
const MUTED = '#6B7280';
const GOLD = '#B8860B';
const GOLD_SOFT = 'rgba(184, 134, 11, 0.10)';
const SHEET_BG = '#FFFFFF';
const HAIRLINE = 'rgba(15, 23, 42, 0.06)';

const SPRING = { damping: 26, stiffness: 320, mass: 0.9 } as const;
const CLOSE_DURATION = 220;
const SELECTION_CLOSE_DELAY = 180;

const SCREEN_WIDTH = Dimensions.get('window').width;
const ICON_TILE = 40;
const ICON_GAP = 14;
const RADIO_SIZE = 22;
const ROW_PADDING_H = 16;

type Props = {
  value: BoutiqueSortOptionId | null;
  onChange: (next: BoutiqueSortOptionId | null) => void;
};

export function BoutiqueSortDropdown({ value, onChange }: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const progress = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedOption = value
    ? BOUTIQUE_SORT_OPTIONS.find((o) => o.id === value)
    : BOUTIQUE_SORT_OPTIONS.find((o) => o.id === 'NEAREST');
  const triggerLabel = selectedOption?.label ?? 'Nearest';

  const unmount = useCallback(() => setMounted(false), []);

  useEffect(() => {
    if (!mounted) return;
    progress.value = withSpring(1, SPRING);
  }, [mounted, progress]);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const openMenu = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    progress.value = 0;
    setMounted(true);
    setVisible(true);
    void Haptics.selectionAsync().catch(() => {});
  }, [progress]);

  const close = useCallback(() => {
    setVisible(false);
    progress.value = withTiming(
      0,
      { duration: CLOSE_DURATION, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(unmount)();
      },
    );
  }, [progress, unmount]);

  const pick = useCallback(
    (id: BoutiqueSortOptionId | null) => {
      void Haptics.selectionAsync().catch(() => {});
      onChange(id);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(close, SELECTION_CLOSE_DELAY);
    },
    [close, onChange],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.9, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [44, 0]) },
    ],
  }));

  return (
    <>
      <Pressable
        onPress={openMenu}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        accessibilityRole="button"
        accessibilityLabel="Sort boutiques"
        accessibilityHint="Opens sort options"
        accessibilityState={{ expanded: visible }}
      >
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {triggerLabel}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color={NAVY} />
      </Pressable>

      <Modal
        visible={mounted}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={close}
      >
        <View style={styles.modalRoot}>
          <AnimatedPressable
            style={[StyleSheet.absoluteFillObject, backdropStyle]}
            onPress={close}
            accessibilityLabel="Dismiss sort menu"
            accessibilityRole="button"
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 18 : 24}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.backdropTint} />
          </AnimatedPressable>

          <Animated.View style={[styles.sheet, sheetStyle]}>
            <SafeAreaView edges={['bottom']} style={styles.sheetSafe}>
              <View style={styles.grabberWrap} pointerEvents="none">
                <View style={styles.grabber} />
              </View>

              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>Sort by</Text>
                  <Text style={styles.headerSubtitle}>
                    Choose how boutiques are ordered
                  </Text>
                </View>
                <Pressable
                  onPress={close}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && styles.closeBtnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close sort menu"
                >
                  <MaterialIcons name="close" size={18} color={NAVY} />
                </Pressable>
              </View>

              <View style={styles.optionGroup}>
                {ALL_SORT_ROWS.map((row, idx) => {
                  const selected =
                    row.id === 'NEAREST'
                      ? value === 'NEAREST' || value === null
                      : value === row.id;
                  const isLast = idx === ALL_SORT_ROWS.length - 1;
                  const next = !isLast ? ALL_SORT_ROWS[idx + 1] : null;
                  const nextSelected = next
                    ? next.id === 'NEAREST'
                      ? value === 'NEAREST' || value === null
                      : value === next.id
                    : false;
                  const showDivider = !isLast && !selected && !nextSelected;
                  return (
                    <SortRow
                      key={row.id}
                      label={row.label}
                      icon={row.icon}
                      selected={selected}
                      showDivider={showDivider}
                      onPress={() => pick(row.id)}
                    />
                  );
                })}
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

type SortRowProps = {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  selected: boolean;
  showDivider: boolean;
  onPress: () => void;
};

function SortRow({ label, icon, selected, showDivider, onPress }: SortRowProps) {
  return (
    <View style={styles.rowWrapper}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: NAVY_SOFT, borderless: false }}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
        style={styles.rowPressable}
      >
        <View style={[styles.row, selected && styles.rowSelected]}>
          <View
            style={[
              styles.iconTile,
              selected && styles.iconTileSelected,
            ]}
          >
            <MaterialIcons
              name={icon}
              size={20}
              color={selected ? GOLD : NAVY}
            />
          </View>

          <View style={styles.labelWrap}>
            <Text
              style={[styles.rowLabel, selected && styles.rowLabelSelected]}
            >
              {label}
            </Text>
          </View>

          <View
            style={[
              styles.radio,
              selected && styles.radioSelected,
            ]}
          >
            {selected ? <View style={styles.radioDot} /> : null}
          </View>
        </View>
      </Pressable>
      {showDivider ? <View style={styles.divider} pointerEvents="none" /> : null}
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  triggerPressed: { opacity: 0.92 },
  triggerLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: NAVY,
    letterSpacing: 0.15,
    marginRight: 2,
  },

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 14, 26, 0.32)',
  },

  sheet: {
    width: SCREEN_WIDTH,
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
      },
      android: { elevation: 24 },
      default: {},
    }),
  },
  sheetSafe: {
    paddingTop: 8,
    paddingBottom: 12,
  },

  grabberWrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 6,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: NAVY,
    letterSpacing: 0.1,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.05,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NAVY_SOFT,
  },
  closeBtnPressed: {
    backgroundColor: 'rgba(13, 27, 42, 0.12)',
  },

  optionGroup: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },

  rowWrapper: {
    width: '100%',
  },
  rowPressable: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: ROW_PADDING_H,
    minHeight: 64,
    borderRadius: 14,
  },
  rowSelected: {
    backgroundColor: GOLD_SOFT,
  },
  iconTile: {
    width: ICON_TILE,
    height: ICON_TILE,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ICON_GAP,
  },
  iconTileSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(184, 134, 11, 0.28)',
  },
  labelWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: NAVY,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  rowLabelSelected: {
    fontWeight: '700',
  },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: RADIO_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  radioSelected: {
    borderColor: GOLD,
    backgroundColor: '#fff',
  },
  radioDot: {
    width: RADIO_SIZE - 10,
    height: RADIO_SIZE - 10,
    borderRadius: (RADIO_SIZE - 10) / 2,
    backgroundColor: GOLD,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: HAIRLINE,
    marginLeft: ROW_PADDING_H + ICON_TILE + ICON_GAP,
    marginRight: ROW_PADDING_H,
  },
});
