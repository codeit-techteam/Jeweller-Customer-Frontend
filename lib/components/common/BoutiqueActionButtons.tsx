import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const SECONDARY_BG = '#F4F5F7';
const SECONDARY_FG = '#3A3F45';
const PRIMARY_BG = '#F7F1E1';
const PRIMARY_BORDER = '#C8A951';
const PRIMARY_FG = '#8B6B1F';

const TILE_RADIUS = 14;
const ICON_SIZE = 18;

const SECONDARY_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.035,
  shadowRadius: 6,
  elevation: 2,
} as const;

const PRIMARY_SHADOW = {
  shadowColor: '#C8A951',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
} as const;

export type BoutiqueActionButtonsProps = {
  onDirections: () => void;
  onCall: () => void;
  onBookAppt: () => void;
  /** Row: margins, horizontal padding, gap between tiles */
  style?: StyleProp<ViewStyle>;
};

/**
 * Directions / Call / Book Appt — medium tiles, icon above full-width labels.
 */
export function BoutiqueActionButtons({
  onDirections,
  onCall,
  onBookAppt,
  style,
}: BoutiqueActionButtonsProps) {
  return (
    <View style={[styles.buttonRow, style]}>
      <TouchableOpacity
        style={[styles.secondaryBtn, SECONDARY_SHADOW]}
        onPress={onDirections}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel="Directions"
      >
        <View style={styles.iconWrapper}>
          <Feather name="arrow-up-right" size={ICON_SIZE} color={SECONDARY_FG} />
        </View>
        <Text style={styles.secondaryText}>DIRECTIONS</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.secondaryBtn, SECONDARY_SHADOW]}
        onPress={onCall}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel="Call now"
      >
        <View style={styles.iconWrapper}>
          <Feather name="phone" size={ICON_SIZE} color={SECONDARY_FG} />
        </View>
        <Text style={styles.secondaryText}>CALL NOW</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.primaryBtn, PRIMARY_SHADOW]}
        onPress={onBookAppt}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel="Book appointment"
      >
        <View style={styles.iconWrapper}>
          <Feather name="calendar" size={ICON_SIZE} color={PRIMARY_FG} />
        </View>
        <Text style={styles.primaryText}>BOOK APPT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
    paddingHorizontal: 2,
  },
  secondaryBtn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SECONDARY_BG,
    borderRadius: TILE_RADIUS,
    paddingVertical: 11,
  },
  primaryBtn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_BG,
    borderRadius: TILE_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PRIMARY_BORDER,
    paddingVertical: 11,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    marginTop: 5,
    width: '100%',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    color: SECONDARY_FG,
    letterSpacing: 0.45,
  },
  primaryText: {
    marginTop: 5,
    width: '100%',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    color: PRIMARY_FG,
    letterSpacing: 0.45,
  },
});
