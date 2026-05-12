import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useWishlistToastStore,
  type WishlistToastType,
} from "@/lib/stores/wishlistToastStore";

const AUTO_DISMISS_MS = 2200;
/**
 * Lift the toast above the bottom navigation. Bottom tab bar height varies
 * (~64-72px including label + indicator + paddings); 80px keeps a comfortable
 * gap on screens with the tab bar and still feels right on screens without.
 */
const BOTTOM_NAV_OFFSET = 80;

type Props = {
  /** Override the global store (mostly used for previews / Storybook). */
  visible?: boolean;
  type?: WishlistToastType;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
};

/**
 * Floating, Myntra-style wishlist snackbar.
 *
 * - Sits ABOVE the bottom navigation, never blocks the navbar / logo.
 * - Background stays interactive: the host uses `pointerEvents="box-none"` so
 *   only the card itself captures touches.
 * - Slides up + fades in via `Animated`, auto-dismisses after ~2.2s, swipe /
 *   action / dismiss-button supported.
 */
export function WishlistToast(props: Props) {
  const storeVisible = useWishlistToastStore((s) => s.visible);
  const storeShowId = useWishlistToastStore((s) => s.showId);
  const storeType = useWishlistToastStore((s) => s.type);
  const storeMessage = useWishlistToastStore((s) => s.message);
  const storeActionText = useWishlistToastStore((s) => s.actionText);
  const storeOnAction = useWishlistToastStore((s) => s.onAction);
  const storeHide = useWishlistToastStore((s) => s.hide);

  const insets = useSafeAreaInsets();

  const visible = props.visible ?? storeVisible;
  const type = props.type ?? storeType;
  const message = props.message ?? storeMessage;
  const actionText = props.actionText ?? storeActionText;
  const onAction = props.onAction ?? storeOnAction ?? undefined;
  const onClose = props.onClose ?? storeHide;

  const [rendered, setRendered] = useState(visible);

  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const animateOut = useCallback(
    (afterAnimation?: () => void) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 30,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) afterAnimation?.();
      });
    },
    [opacity, translateY],
  );

  // Mount when becoming visible, unmount only after the exit animation completes.
  useEffect(() => {
    if (visible) {
      setRendered(true);
    }
  }, [visible]);

  // Drive the enter / exit animations.
  useEffect(() => {
    if (!rendered) return;

    if (visible) {
      if (Platform.OS !== "web") {
        Haptics.selectionAsync().catch(() => {});
      }

      translateY.setValue(40);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 90,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      clearTimer();
      dismissTimer.current = setTimeout(() => {
        onClose?.();
      }, AUTO_DISMISS_MS);
    } else {
      clearTimer();
      animateOut(() => setRendered(false));
    }

    return () => {
      clearTimer();
    };
    // `storeShowId` re-triggers the effect on consecutive shows even when other
    // values haven't changed (e.g. toggling the same product twice quickly).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, rendered, storeShowId, animateOut, clearTimer, onClose]);

  const handleAction = useCallback(() => {
    clearTimer();
    onAction?.();
    onClose?.();
  }, [clearTimer, onAction, onClose]);

  const handleDismiss = useCallback(() => {
    clearTimer();
    onClose?.();
  }, [clearTimer, onClose]);

  if (!rendered) return null;

  const bottom = Math.max(insets.bottom, 12) + BOTTOM_NAV_OFFSET;
  const isAdded = type === "added";

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom }]}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
    >
      <Animated.View
        style={[styles.card, { transform: [{ translateY }], opacity }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View
          style={[
            styles.iconWrap,
            isAdded ? styles.iconWrapAdded : styles.iconWrapRemoved,
          ]}
        >
          <MaterialIcons
            name={isAdded ? "favorite" : "favorite-border"}
            size={16}
            color={isAdded ? "#F87171" : "#E2E8F0"}
          />
        </View>

        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>

        {actionText ? (
          <Pressable
            onPress={handleAction}
            hitSlop={10}
            android_ripple={{ color: "rgba(255,255,255,0.12)", borderless: false }}
            accessibilityRole="button"
            accessibilityLabel={actionText}
            style={({ pressed }) => [
              styles.action,
              pressed && styles.actionPressed,
            ]}
          >
            <Text style={styles.actionText}>{actionText}</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleDismiss}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            style={styles.close}
          >
            <MaterialIcons name="close" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 30,
  },
  card: {
    minHeight: 50,
    maxWidth: 480,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.32,
        shadowRadius: 20,
      },
      android: {
        elevation: 14,
      },
      default: {},
    }),
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  iconWrapAdded: {
    backgroundColor: "rgba(248, 113, 113, 0.2)",
  },
  iconWrapRemoved: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  text: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  action: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  actionPressed: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  actionText: {
    color: "#FBBF24",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 1,
    includeFontPadding: false,
  },
  close: {
    marginLeft: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
