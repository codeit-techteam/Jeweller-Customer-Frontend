import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { fontSizes, radius, spacing } from "@/src/constants/theme";

const NAVY = "#1e3a5f";
const GOLD = "#c29a33";

type Props = {
    name: string;
    price: number;
    rating: number;
    reviews: number;
    limitedEdition?: boolean;
    discountLabel?: string;
};

export function ProductInfo({
    name,
    price,
    rating,
    reviews,
    limitedEdition,
    discountLabel,
}: Props) {
    const hasReviews = reviews > 0;
    const ratingLine =
        rating > 0 ? (
            <View style={styles.ratingPrimary}>
                <MaterialIcons name="star" size={20} color={GOLD} />
                <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
                {hasReviews ? (
                    <Text style={styles.ratingParen}>
                        {" "}
                        ({reviews.toLocaleString("en-IN")}{" "}
                        {reviews === 1 ? "review" : "reviews"})
                    </Text>
                ) : (
                    <Text style={styles.noReviews}> · No reviews yet</Text>
                )}
            </View>
        ) : (
            <Text style={styles.ratingMuted}>
                No ratings yet
                {!hasReviews ? " · No reviews yet" : null}
            </Text>
        );

    return (
        <View style={styles.wrap}>
            {limitedEdition ? (
                <View style={styles.limitedPill}>
                    <Text style={styles.limitedText}>LIMITED EDITION</Text>
                </View>
            ) : null}
            <Text style={styles.title}>{name}</Text>
            <View style={styles.priceRow}>
                <Text style={styles.price}>₹{price.toLocaleString("en-IN")}</Text>
                {discountLabel ? (
                    <LinearGradient
                        colors={["#fef3c7", "#fcd34d", "#fbbf24"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.discountGradient}
                    >
                        <Text style={styles.discountText}>{discountLabel}</Text>
                    </LinearGradient>
                ) : null}
            </View>
            {ratingLine}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xs,
        gap: spacing.sm,
    },
    limitedPill: {
        alignSelf: "flex-start",
        backgroundColor: GOLD,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    limitedText: {
        fontSize: fontSizes.xs,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: fontSizes["2xl"],
        fontWeight: "700",
        color: "#111827",
        lineHeight: 30,
        letterSpacing: -0.2,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    price: { fontSize: 28, fontWeight: "800", color: "#111827", letterSpacing: -0.4 },
    discountGradient: {
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
        borderRadius: radius.full,
        shadowColor: "#eab308",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(251,191,36,0.5)",
    },
    discountText: {
        fontSize: fontSizes.xs,
        fontWeight: "800",
        color: NAVY,
        letterSpacing: 0.35,
    },
    ratingPrimary: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: 4,
        gap: 2,
    },
    ratingValue: {
        fontSize: fontSizes.lg,
        fontWeight: "800",
        color: "#111827",
    },
    ratingParen: { fontSize: fontSizes.sm, color: "#6b7280", fontWeight: "500" },
    noReviews: { fontSize: fontSizes.sm, color: "#9ca3af", fontWeight: "500" },
    ratingMuted: { fontSize: fontSizes.sm, color: "#9ca3af", marginTop: 4 },
});
