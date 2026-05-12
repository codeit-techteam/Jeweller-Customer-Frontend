/**
 * Dual-thumb range (`rn-range-slider` v2.2.2 vendored under `lib/vendor/rn-range-slider`).
 *
 * Performance: parent `onChange` runs only on **touch end** so heavy trees (e.g. filter
 * preview + bottom sheet) do not re-render every pan frame. Live INR line is throttled
 * and driven with Reanimated shared values during drag.
 */
import RangeSlider from "@/lib/vendor/rn-range-slider";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, type TextStyle, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

const THUMB = 20;
const RAIL_H = 4;
const ACTIVE = "#0B1C2C";
const RAIL = "#e2e8f0";

/** Throttle hero text React updates during drag (ms). */
const HERO_THROTTLE_MS = 40;

function formatInrPair(low: number, high: number): string {
  return `₹${low.toLocaleString("en-IN")} — ₹${high.toLocaleString("en-IN")}`;
}

export type PriceRangeSliderProps = {
  min: number;
  max: number;
  low: number;
  high: number;
  /** Defaults to 1000 */
  step?: number;
  /** Minimum gap between low and high (defaults to `step`) */
  minRange?: number;
  /**
   * Called **once** when the user lifts their finger(s) — commits final `low` / `high`.
   * Do not use this for per-frame updates.
   */
  onChange: (low: number, high: number) => void;
  /** Style for the INR summary line shown above the rail */
  heroTextStyle?: TextStyle;
};

function PriceRangeSliderInner({
  min,
  max,
  low,
  high,
  step = 1000,
  minRange,
  onChange,
  heroTextStyle,
}: PriceRangeSliderProps) {
  const gap = minRange ?? step;

  const liveLow = useSharedValue(low);
  const liveHigh = useSharedValue(high);

  const [heroLine, setHeroLine] = useState(() => formatInrPair(low, high));

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const heroTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPairRef = useRef<[number, number]>([low, high]);

  const clearHeroTimer = useCallback(() => {
    if (heroTimerRef.current != null) {
      clearTimeout(heroTimerRef.current);
      heroTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    liveLow.value = low;
    liveHigh.value = high;
    latestPairRef.current = [low, high];
    clearHeroTimer();
    setHeroLine(formatInrPair(low, high));
  }, [low, high, liveLow, liveHigh, clearHeroTimer]);

  useEffect(() => () => clearHeroTimer(), [clearHeroTimer]);

  const onValueChanged = useCallback(
    (l: number, h: number, byUser: boolean) => {
      if (!byUser) return;
      liveLow.value = l;
      liveHigh.value = h;
      latestPairRef.current = [l, h];

      if (heroTimerRef.current != null) return;
      heroTimerRef.current = setTimeout(() => {
        heroTimerRef.current = null;
        const [a, b] = latestPairRef.current;
        setHeroLine(formatInrPair(a, b));
      }, HERO_THROTTLE_MS);
    },
    [liveLow, liveHigh],
  );

  const onSliderTouchEnd = useCallback(
    (l: number, h: number) => {
      clearHeroTimer();
      liveLow.value = l;
      liveHigh.value = h;
      latestPairRef.current = [l, h];
      setHeroLine(formatInrPair(l, h));
      onChangeRef.current(l, h);
    },
    [clearHeroTimer, liveLow, liveHigh],
  );

  const renderThumb = useCallback(
    (_name: "low" | "high") => <View style={styles.thumb} />,
    [],
  );

  const renderRail = useCallback(() => <View style={styles.rail} />, []);

  const renderRailSelected = useCallback(
    () => <View style={styles.railSelected} />,
    [],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.heroDefault, heroTextStyle]}>{heroLine}</Text>
      <RangeSlider
        min={min}
        max={max}
        step={step}
        minRange={gap}
        low={low}
        high={high}
        onValueChanged={onValueChanged}
        onSliderTouchEnd={onSliderTouchEnd}
        renderThumb={renderThumb}
        renderRail={renderRail}
        renderRailSelected={renderRailSelected}
      />
    </View>
  );
}

export const PriceRangeSlider = memo(PriceRangeSliderInner);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  heroDefault: {
    fontSize: 18,
    fontWeight: "700",
    color: "#001B39",
    textAlign: "center",
    marginBottom: 8,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: ACTIVE,
  },
  rail: {
    flex: 1,
    height: RAIL_H,
    borderRadius: RAIL_H / 2,
    backgroundColor: RAIL,
  },
  railSelected: {
    flex: 1,
    height: RAIL_H,
    borderRadius: RAIL_H / 2,
    backgroundColor: ACTIVE,
  },
});
