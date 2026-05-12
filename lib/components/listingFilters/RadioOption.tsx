import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Single-line radio row used by every filter sheet (Rings + Collections).
 *
 * Hard guarantees (do NOT change without checking every caller):
 *  - `flexDirection: 'row'` + `alignItems: 'center'` — radio and label can
 *    never stack vertically, regardless of parent layout.
 *  - `width: '100%'` — the row fills its parent, so the label can never wrap
 *    below the ring.
 *  - Label has `marginTop: 0`, an explicit `lineHeight`, and `numberOfLines={1}`
 *    as belt-and-braces safety against any ambient global Text styles.
 *  - Ring is laid out first (left) with a fixed right margin, label is next.
 *
 * We purposely expose only `label / value / selectedValue / onChange` so
 * callers cannot accidentally introduce a column layout around the dot or the
 * text.
 */
export type RadioOptionProps<T extends string> = {
  label: string;
  value: T;
  selectedValue: T | null | undefined;
  onChange: (value: T) => void;
  /** Draws a hairline separator under the row (on by default). */
  showDivider?: boolean;
  /** Disables light haptic on select. Default: enabled. */
  disableHaptic?: boolean;
};

export function RadioOption<T extends string>({
  label,
  value,
  selectedValue,
  onChange,
  showDivider = true,
  disableHaptic = false,
}: RadioOptionProps<T>) {
  const isSelected = selectedValue === value;

  const handlePress = useCallback(() => {
    if (!disableHaptic) void Haptics.selectionAsync();
    onChange(value);
  }, [disableHaptic, onChange, value]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      style={[styles.row, showDivider && styles.rowDivider]}
    >
      <View style={[styles.ring, isSelected && styles.ringOn]}>
        {isSelected ? <View style={styles.dot} /> : null}
      </View>
      <Text
        style={[styles.label, isSelected && styles.labelOn]}
        numberOfLines={1}
        ellipsizeMode="tail"
        allowFontScaling={false}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  ring: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ringOn: {
    borderColor: "#0B1C2C",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0B1C2C",
  },
  label: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginTop: 0,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  labelOn: {
    fontWeight: "700",
    color: "#0B1C2C",
  },
});
