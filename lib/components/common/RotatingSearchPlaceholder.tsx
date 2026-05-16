import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    StyleSheet,
    type StyleProp,
    type TextStyle,
} from "react-native";

const TYPE_MS = 38;
const HOLD_MS = 1500;
const FADE_MS = 200;

type Props = {
  phrases: readonly string[];
  /** When true, freezes on the current visible slice (e.g. parent has text). */
  paused: boolean;
  style?: StyleProp<TextStyle>;
};

/**
 * Subtle typing + fade cycle for the search bar — no layout impact.
 */
export function RotatingSearchPlaceholder({ phrases, paused, style }: Props) {
  const [line, setLine] = useState(() => phrases[0] ?? "");
  const [sliceLen, setSliceLen] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  };

  useEffect(() => {
    if (paused || phrases.length === 0) {
      clearTimers();
      return;
    }

    let disposed = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, ms);
        timersRef.current.push(t);
      });

    async function loop() {
      let idx = 0;
      while (!disposed) {
        const text = phrases[idx % phrases.length] ?? "";
        setLine(text);
        setSliceLen(0);
        opacity.setValue(1);

        for (let len = 1; len <= text.length && !disposed; len += 1) {
          setSliceLen(len);
          await sleep(TYPE_MS);
        }
        if (disposed) break;

        await sleep(HOLD_MS);
        if (disposed) break;

        await new Promise<void>((resolve) => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: FADE_MS,
            useNativeDriver: true,
          }).start(() => resolve());
        });
        if (disposed) break;

        opacity.setValue(1);
        idx = (idx + 1) % phrases.length;
      }
    }

    void loop();

    return () => {
      disposed = true;
      clearTimers();
      opacity.stopAnimation();
    };
  }, [paused, phrases, opacity]);

  const visible = line.slice(0, sliceLen);

  return (
    <Animated.Text
      pointerEvents="none"
      numberOfLines={1}
      style={[styles.text, style, { opacity }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {visible}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "#9ca3af",
  },
});
