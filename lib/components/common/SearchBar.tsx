import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { fontSizes, spacing } from "@/src/constants/theme";

/**
 * Unified pill-style search bar used on Home (tap-to-navigate) and Discover
 * (live typing) screens. Same visual language on both surfaces.
 *
 * Two modes:
 *  - `onPress` only           → read-only tappable trigger (Home)
 *  - `value` + `onChangeText` → live text input (Discover)
 */
type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  /** When provided, the bar renders as a tappable trigger (no TextInput). */
  onPress?: () => void;
  autoFocus?: boolean;
  onVoicePress?: () => void;
  onSubmitEditing?: () => void;
};

export function SearchBar({
  value = "",
  onChangeText,
  placeholder,
  onPress,
  autoFocus,
  onVoicePress,
  onSubmitEditing,
}: Props) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;
  const isTapMode = typeof onPress === "function";

  const body = (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <MaterialIcons
        name="search"
        size={20}
        color={focused ? "#111827" : "#9ca3af"}
        style={styles.icon}
      />

      {isTapMode ? (
        <Text style={styles.placeholder} numberOfLines={1}>
          {placeholder}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          autoFocus={autoFocus}
          clearButtonMode="never"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
        />
      )}

      {!isTapMode && hasValue ? (
        <Pressable
          accessibilityLabel="Clear search"
          hitSlop={10}
          onPress={() => onChangeText?.("")}
          style={styles.trailingBtn}
        >
          <MaterialIcons name="close" size={16} color="#6b7280" />
        </Pressable>
      ) : (
        <Pressable
          accessibilityLabel="Voice search"
          hitSlop={10}
          onPress={onVoicePress}
          disabled={!onVoicePress && !isTapMode}
          style={styles.trailingBtn}
        >
          <MaterialIcons name="mic-none" size={18} color="#6b7280" />
        </Pressable>
      )}
    </View>
  );

  if (isTapMode) {
    return (
      <Pressable
        accessibilityRole="search"
        accessibilityLabel={placeholder}
        onPress={onPress}
        android_ripple={{ color: "rgba(0,0,0,0.04)" }}
      >
        {body}
      </Pressable>
    );
  }

  return body;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 30,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderWidth: 1,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  wrapFocused: {
    backgroundColor: "#fff",
    borderColor: "#111827",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.md,
    color: "#111827",
    paddingVertical: 0,
    fontWeight: "500",
  },
  placeholder: {
    flex: 1,
    fontSize: fontSizes.md,
    color: "#9ca3af",
    fontWeight: "500",
  },
  trailingBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
});
