import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { HighlightedText } from "@/lib/components/common/HighlightedText";
import { getCategoryEmoji } from "@/lib/constants/categoryEmojiMap";
import { PLACEHOLDER_IMAGE_URI } from "@/lib/services/mock/imageUrls";
import type { SearchSuggestion } from "@/lib/services/buildSearchSuggestions";
import { formatCategoryLabel } from "@/lib/services/searchCatalog";

const MAX_CATEGORY_SUGGESTIONS = 3;
const MAX_PRODUCT_SUGGESTIONS = 4;
const MAX_PANEL_HEIGHT = 350;

const H_PAD = 16;
const THUMB_SIZE = 48;
const ICON_SIZE = 36;
const ICON_GAP = 12;
const PRODUCT_DIVIDER_LEFT = H_PAD + THUMB_SIZE + ICON_GAP;
const CATEGORY_DIVIDER_LEFT = H_PAD + ICON_SIZE + ICON_GAP;

type Props = {
  suggestions: SearchSuggestion[];
  searchQuery: string;
  totalProductCount: number;
  onSuggestionPress: (item: SearchSuggestion) => void;
  onSeeAllPress: () => void;
  loading?: boolean;
  empty?: boolean;
};

function SectionHeader({
  label,
  rightText,
  showTopBorder,
}: {
  label: string;
  rightText?: string;
  showTopBorder?: boolean;
}) {
  return (
    <View
      style={[
        styles.sectionHeader,
        showTopBorder && styles.sectionHeaderBorder,
      ]}
    >
      <Text style={styles.sectionHeaderLabel}>{label}</Text>
      {rightText ? (
        <Text style={styles.sectionHeaderRight}>{rightText}</Text>
      ) : null}
    </View>
  );
}

function RowChevron() {
  return (
    <Ionicons
      name="chevron-forward"
      size={16}
      color="#D1D5DB"
      style={styles.chevron}
    />
  );
}

function CategorySuggestionRow({
  item,
  searchQuery,
  isLast,
  onPress,
}: {
  item: SearchSuggestion;
  searchQuery: string;
  isLast: boolean;
  onPress: () => void;
}) {
  const slug = item.categorySlug ?? item.categoryParam ?? item.label;
  const title = formatCategoryLabel(item.label);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, category`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.categoryIcon}>
          <Text style={styles.categoryEmoji}>{getCategoryEmoji(slug)}</Text>
        </View>

        <View style={styles.content}>
          <HighlightedText
            text={title}
            highlight={searchQuery}
            style={styles.primaryText}
            highlightStyle={styles.highlight}
          />
          {item.productCount != null ? (
            <Text style={styles.secondaryText} numberOfLines={1}>
              {item.productCount}{" "}
              {item.productCount === 1 ? "product" : "products"}
            </Text>
          ) : null}
        </View>

        <RowChevron />
      </Pressable>
      {!isLast ? (
        <View
          style={[styles.divider, { marginLeft: CATEGORY_DIVIDER_LEFT }]}
        />
      ) : null}
    </>
  );
}

function ProductSuggestionRow({
  item,
  searchQuery,
  isLast,
  onPress,
}: {
  item: SearchSuggestion;
  searchQuery: string;
  isLast: boolean;
  onPress: () => void;
}) {
  const thumbUri =
    item.imageUri?.trim().startsWith("http")
      ? item.imageUri.trim()
      : PLACEHOLDER_IMAGE_URI;
  const hasPrice =
    item.price != null && Number.isFinite(item.price) && item.price > 0;
  const boutique = item.boutiqueName?.trim() || "Boutique";

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.label}, product`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.productThumbClip}>
          <Image
            source={{ uri: thumbUri }}
            style={styles.productThumbImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.content}>
          <HighlightedText
            text={item.label}
            highlight={searchQuery}
            style={styles.primaryText}
            highlightStyle={styles.highlight}
          />
          <Text style={styles.secondaryText} numberOfLines={1}>
            {hasPrice ? (
              <Text style={styles.priceText}>
                ₹{item.price!.toLocaleString("en-IN")}
              </Text>
            ) : (
              <Text style={styles.priceText}>Price on request</Text>
            )}
            <Text style={styles.metaDot}> · </Text>
            <Text style={styles.metaText}>
              {boutique}
              {item.boutiqueVerified ? (
                <Text style={styles.verifiedMark}> ✓</Text>
              ) : null}
            </Text>
          </Text>
        </View>

        <RowChevron />
      </Pressable>
      {!isLast ? (
        <View
          style={[styles.divider, { marginLeft: PRODUCT_DIVIDER_LEFT }]}
        />
      ) : null}
    </>
  );
}

function SeeAllRow({
  searchQuery,
  count,
  onPress,
}: {
  searchQuery: string;
  count: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.seeAllRow,
        pressed && styles.rowPressed,
      ]}
    >
      <Ionicons name="search" size={15} color="#C9A227" />
      <Text style={styles.seeAllText}>
        See all {count} results for &ldquo;{searchQuery}&rdquo;
      </Text>
    </Pressable>
  );
}

function OtherSuggestionRow({
  item,
  searchQuery,
  isLast,
  onPress,
}: {
  item: SearchSuggestion;
  searchQuery: string;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.label}, ${item.subtitle ?? "suggestion"}`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={[styles.categoryIcon, styles.otherIcon]}>
          <Ionicons
            name={
              item.kind === "occasion"
                ? "calendar-outline"
                : item.kind === "collection"
                  ? "layers-outline"
                  : item.kind === "trending_chip"
                    ? "trending-up"
                    : item.kind === "relationship_section"
                      ? "heart-outline"
                      : "pricetag-outline"
            }
            size={16}
            color="#9CA3AF"
          />
        </View>

        <View style={styles.content}>
          <HighlightedText
            text={item.label}
            highlight={searchQuery}
            style={styles.primaryText}
            highlightStyle={styles.highlight}
          />
          {item.subtitle ? (
            <Text style={styles.secondaryText} numberOfLines={1}>
              {item.subtitle}
            </Text>
          ) : null}
        </View>

        <RowChevron />
      </Pressable>
      {!isLast ? (
        <View
          style={[styles.divider, { marginLeft: CATEGORY_DIVIDER_LEFT }]}
        />
      ) : null}
    </>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateWrap}>
      <ActivityIndicator size="small" color="#C9A227" />
      <Text style={styles.stateText}>Searching catalogue…</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.stateWrap}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="search-off" size={28} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>
        Try a different keyword or browse categories
      </Text>
    </View>
  );
}

export function SearchSuggestionsPanel({
  suggestions,
  searchQuery,
  totalProductCount,
  onSuggestionPress,
  onSeeAllPress,
  loading = false,
  empty = false,
}: Props) {
  const { categories, products, others } = useMemo(() => {
    const categories: SearchSuggestion[] = [];
    const products: SearchSuggestion[] = [];
    const others: SearchSuggestion[] = [];

    for (const s of suggestions) {
      if (s.kind === "category") categories.push(s);
      else if (s.kind === "product") products.push(s);
      else others.push(s);
    }

    return { categories, products, others };
  }, [suggestions]);

  const visibleCategories = categories.slice(0, MAX_CATEGORY_SUGGESTIONS);
  const visibleProducts = products.slice(0, MAX_PRODUCT_SUGGESTIONS);
  const showSeeAll = totalProductCount > MAX_PRODUCT_SUGGESTIONS;

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState />
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.container}>
        <EmptyState />
      </View>
    );
  }

  if (suggestions.length === 0) return null;

  let sectionIndex = 0;

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        bounces={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleCategories.length > 0 ? (
          <>
            <SectionHeader
              label="Categories"
              showTopBorder={sectionIndex++ > 0}
            />
            {visibleCategories.map((item, index) => (
              <CategorySuggestionRow
                key={item.key}
                item={item}
                searchQuery={searchQuery}
                isLast={index === visibleCategories.length - 1}
                onPress={() => onSuggestionPress(item)}
              />
            ))}
          </>
        ) : null}

        {visibleProducts.length > 0 ? (
          <>
            <SectionHeader
              label="Products"
              rightText={`${totalProductCount} results`}
              showTopBorder={sectionIndex++ > 0}
            />
            {visibleProducts.map((item, index) => (
              <ProductSuggestionRow
                key={item.key}
                item={item}
                searchQuery={searchQuery}
                isLast={index === visibleProducts.length - 1 && !showSeeAll}
                onPress={() => onSuggestionPress(item)}
              />
            ))}
            {showSeeAll ? (
              <SeeAllRow
                searchQuery={searchQuery}
                count={totalProductCount}
                onPress={onSeeAllPress}
              />
            ) : null}
          </>
        ) : null}

        {others.length > 0 ? (
          <>
            <SectionHeader
              label="More"
              showTopBorder={sectionIndex++ > 0}
            />
            {others.map((item, index) => (
              <OtherSuggestionRow
                key={item.key}
                item={item}
                searchQuery={searchQuery}
                isLast={index === others.length - 1}
                onPress={() => onSuggestionPress(item)}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    maxHeight: MAX_PANEL_HEIGHT,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  scroll: {
    maxHeight: MAX_PANEL_HEIGHT,
  },
  scrollContent: {
    flexGrow: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FAFAFA",
  },
  sectionHeaderBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EBEBEB",
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionHeaderRight: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    minHeight: 56,
  },
  rowPressed: {
    backgroundColor: "#FFFBF5",
  },
  categoryIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: "#FFF6EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: ICON_GAP,
    flexShrink: 0,
  },
  otherIcon: {
    backgroundColor: "#F3F4F6",
  },
  categoryEmoji: {
    fontSize: 17,
  },
  productThumbClip: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
    marginRight: ICON_GAP,
    flexShrink: 0,
  },
  productThumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  content: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingRight: 6,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 20,
  },
  secondaryText: {
    marginTop: 3,
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 16,
  },
  highlight: {
    color: "#C9A227",
    fontWeight: "700",
  },
  priceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  metaDot: {
    color: "#D1D5DB",
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  verifiedMark: {
    color: "#1A73E8",
    fontWeight: "600",
  },
  chevron: {
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#F0F0F0",
    marginRight: H_PAD,
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: H_PAD,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F0F0F0",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  seeAllText: {
    fontSize: 14,
    color: "#C9A227",
    fontWeight: "600",
  },
  stateWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: H_PAD,
    minHeight: 140,
  },
  stateText: {
    marginTop: 10,
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
