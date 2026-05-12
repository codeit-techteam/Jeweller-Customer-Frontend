import React, { useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { fontSizes, radius, spacing } from "@/src/constants/theme";

const NAVY = "#1e3a5f";
const GOLD = "#c29a33";

type SizeProps = {
    label: string;
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
};

/** Premium horizontal chips with subtle scale + glow when selected. */
export function JewellerySizeChips({
    label,
    options,
    selected,
    onSelect,
}: SizeProps) {
    if (!options.length) return null;
    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>{label}</Text>
            <View style={styles.chipRow}>
                {options.map((option) => (
                    <AnimatedChip
                        key={option}
                        label={option}
                        selected={selected === option}
                        onPress={() => onSelect(option)}
                        pill
                    />
                ))}
            </View>
        </View>
    );
}

type MetalProps = {
    options: string[];
    selected: string;
    onSelect: (value: string) => void;
};

/** Segmented metal strip with elevated active segment. */
export function JewelleryMetalSegments({
    options,
    selected,
    onSelect,
}: MetalProps) {
    const ordered = useMemo(() => [...options], [options]);
    if (!ordered.length) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>METAL</Text>
            <View style={styles.segmentWrap}>
                {ordered.map((metal) => {
                    const on = selected === metal;
                    return (
                        <Pressable
                            key={metal}
                            onPress={() => onSelect(metal)}
                            style={({ pressed }) => [
                                styles.segment,
                                on && styles.segmentActive,
                                pressed && !on && { opacity: 0.92 },
                            ]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: on }}
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    on && styles.segmentTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                {metal}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

function AnimatedChip({
    label,
    selected,
    onPress,
    pill,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
    pill?: boolean;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const runPressIn = () => {
        Animated.spring(scale, {
            toValue: 0.94,
            friction: 6,
            tension: 280,
            useNativeDriver: true,
        }).start();
    };
    const runPressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 7,
            tension: 240,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={runPressIn}
            onPressOut={runPressOut}
            accessibilityRole="button"
            accessibilityState={{ selected }}
        >
            <Animated.View style={{ transform: [{ scale }] }}>
                <View
                    style={[
                        pill ? styles.chipPill : styles.chipSquarish,
                        selected ? styles.chipPillSelected : styles.chipPillIdle,
                    ]}
                >
                    <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>
                        {label}
                    </Text>
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    sectionLabel: {
        fontSize: fontSizes.xs,
        fontWeight: "700",
        color: "#374151",
        letterSpacing: 0.6,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chipPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: radius.full,
        borderWidth: 1.5,
        backgroundColor: "#fff",
    },
    chipSquarish: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: radius.md,
        borderWidth: 1.5,
        backgroundColor: "#fff",
    },
    chipPillIdle: {
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    chipPillSelected: {
        borderColor: NAVY,
        backgroundColor: "#eef2ff",
        shadowColor: GOLD,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        elevation: 4,
    },
    chipLabel: {
        fontSize: fontSizes.sm,
        color: "#4b5563",
        fontWeight: "600",
    },
    chipLabelOn: { color: NAVY, fontWeight: "800" },
    segmentWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        justifyContent: "flex-start",
    },
    segment: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 4,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#f9fafb",
        minWidth: "44%",
        flexGrow: 1,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 0,
    },
    segmentActive: {
        borderColor: NAVY,
        backgroundColor: "#fff",
        shadowOpacity: 0.12,
        elevation: 6,
        transform: [{ translateY: -2 }],
    },
    segmentText: {
        fontSize: fontSizes.xs,
        fontWeight: "600",
        color: "#6b7280",
        textAlign: "center",
    },
    segmentTextActive: {
        color: NAVY,
        fontWeight: "800",
    },
});
