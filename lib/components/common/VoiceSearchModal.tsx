import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Voice, {
  type SpeechErrorEvent,
  type SpeechResultsEvent,
} from "@react-native-voice/voice";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ListingProductCard,
  type ListingProductCardItem,
} from "@/lib/components/common/ListingProductCard";
import { pushProductDetails } from "@/lib/navigation/productNavigation";
import {
  loadRecentVoiceSearches,
  saveRecentVoiceSearch,
  searchProductsByVoice,
  type VoiceSearchProduct,
} from "@/lib/services/voiceSearch";
import {
  isVoiceRecognitionAvailable,
  safeVoiceCancel,
  safeVoiceDestroy,
  safeVoiceStart,
  safeVoiceStop,
} from "@/lib/utils/safeVoice";
import { fontSizes, spacing } from "@/src/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Matches Find Boutiques CTA on Home */
const GOLD = "#d2bd59";
const GOLD_DARK = "#b8a040";
const GOLD_LIGHT = "#e8d48b";
const GOLD_GLOW = "rgba(210,189,89,0.35)";

const colors = {
  background: "#0A0A0A",
  surface: "#141414",
  surfaceElevated: "#1E1E1E",
  gold: GOLD,
  goldGlow: GOLD_GLOW,
  text: "#FFFFFF",
  textMuted: "#9CA3AF",
  textDim: "#6B7280",
  border: "rgba(255,255,255,0.08)",
};

type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "results"
  | "error";

type Props = {
  visible: boolean;
  onClose: () => void;
  onResultSelect?: (product: VoiceSearchProduct) => void;
  onSearchByText?: () => void;
};

const DOT_COLORS = [GOLD, GOLD_LIGHT, "#C9A227", GOLD_DARK];

function AssistantDot({ index }: { index: number }) {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withDelay(
      index * 120,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(offset);
  }, [index, offset]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.assistantDot,
        { backgroundColor: DOT_COLORS[index % DOT_COLORS.length] },
        style,
      ]}
    />
  );
}

function AssistantDots() {
  return (
    <View style={styles.dotsRow}>
      {DOT_COLORS.map((_, index) => (
        <AssistantDot key={index} index={index} />
      ))}
    </View>
  );
}

function PulseRing({ scale, delay }: { scale: { value: number }; delay: number }) {
  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(2.2, { duration: 1400, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 0 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(scale);
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: Math.max(0, 0.55 - (scale.value - 1) * 0.35),
  }));

  return <Animated.View style={[styles.pulseRing, style]} />;
}

function WaveformBar({
  height,
  active,
}: {
  height: { value: number };
  active: boolean;
}) {
  const style = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: active ? colors.gold : "rgba(210,189,89,0.25)",
  }));
  return <Animated.View style={[styles.waveBar, style]} />;
}

function toListingCardItem(product: VoiceSearchProduct): ListingProductCardItem {
  const priceLabel =
    Number.isFinite(product.price) && product.price > 0
      ? `₹ ${product.price.toLocaleString("en-IN")}`
      : "Price on request";
  return {
    id: product.id,
    name: product.name,
    price: priceLabel,
    imageUri: product.imageUri,
    imageTint: "#2d2d2d",
    boutiqueName: product.boutiqueName,
    boutiqueRating: product.boutiqueRating,
    boutiqueVerified: product.boutiqueVerified,
    tag: product.category ? product.category.toUpperCase() : "JEWELLERY",
  };
}

export function VoiceSearchModal({
  visible,
  onClose,
  onResultSelect,
  onSearchByText,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [results, setResults] = useState<VoiceSearchProduct[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [voiceReady, setVoiceReady] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const autoStartRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const voiceStateRef = useRef<VoiceState>("idle");
  const searchProductsRef = useRef<(query: string) => Promise<void>>(async () => {});

  const opacity = useSharedValue(0);
  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);
  const ring3 = useSharedValue(1);
  const bar0 = useSharedValue(10);
  const bar1 = useSharedValue(10);
  const bar2 = useSharedValue(10);
  const bar3 = useSharedValue(10);
  const bar4 = useSharedValue(10);
  const bars = [bar0, bar1, bar2, bar3, bar4];

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const resetBarAnimations = useCallback(() => {
    for (const bar of bars) {
      cancelAnimation(bar);
      bar.value = withTiming(10);
    }
  }, [bar0, bar1, bar2, bar3, bar4]);

  const openModal = useCallback(() => {
    opacity.value = withTiming(1, { duration: 280 });
  }, [opacity]);

  const closeModal = useCallback(() => {
    void safeVoiceCancel();
    opacity.value = withTiming(0, { duration: 220 });
    resetBarAnimations();
    if (autoStartRef.current) {
      clearTimeout(autoStartRef.current);
      autoStartRef.current = null;
    }
    setTimeout(() => {
      if (!mountedRef.current) return;
      onClose();
    }, 220);
  }, [onClose, opacity, resetBarAnimations]);

  voiceStateRef.current = voiceState;

  const searchProducts = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setErrorMessage("No speech detected. Please try again.");
      setVoiceState("error");
      return;
    }
    setVoiceState("processing");
    setTranscript(trimmed);
    try {
      const products = await searchProductsByVoice(trimmed, 12);
      setResults(products);
      if (products.length > 0) {
        setVoiceState("results");
      } else {
        setErrorMessage(`No products found for "${trimmed}". Try different words.`);
        setVoiceState("error");
      }
      await saveRecentVoiceSearch(trimmed);
      const recent = await loadRecentVoiceSearches();
      setRecentSearches(recent);
    } catch {
      setErrorMessage("Search failed. Check your connection and try again.");
      setVoiceState("error");
    }
  }, []);

  useEffect(() => {
    searchProductsRef.current = searchProducts;
  }, [searchProducts]);

  const startListening = useCallback(async () => {
    if (voiceReady === false) {
      setErrorMessage(
        "Voice search requires a development build on your device. Use Search by Text for now.",
      );
      setVoiceState("error");
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLiveTranscript("");
      setTranscript("");
      setResults([]);
      setErrorMessage(null);
      setVoiceState("listening");
      const started = await safeVoiceStart("en-IN");
      if (!started) {
        setErrorMessage(
          "Microphone unavailable. Allow mic access in Settings or use Search by Text.",
        );
        setVoiceState("error");
      }
    } catch {
      setErrorMessage("Could not start listening. Please try again.");
      setVoiceState("error");
    }
  }, [voiceReady]);

  const stopListening = useCallback(async () => {
    try {
      await safeVoiceStop();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setErrorMessage("Could not stop listening. Please try again.");
      setVoiceState("error");
    }
  }, []);

  const handleMicPress = useCallback(() => {
    if (voiceState === "listening") {
      void stopListening();
      return;
    }
    if (voiceState === "results" || voiceState === "error") {
      setErrorMessage(null);
      setVoiceState("idle");
      void startListening();
      return;
    }
    void startListening();
  }, [startListening, stopListening, voiceState]);

  useEffect(() => {
    mountedRef.current = true;
    void isVoiceRecognitionAvailable().then((ready) => {
      if (mountedRef.current) setVoiceReady(ready);
    });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = () => setVoiceState("listening");
    Voice.onSpeechEnd = () => {
      if (voiceStateRef.current !== "error") setVoiceState("processing");
    };
    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const text = event.value?.[0] ?? "";
      setTranscript(text);
      void searchProductsRef.current(text);
    };
    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      setLiveTranscript(event.value?.[0] ?? "");
    };
    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      if (__DEV__) console.log("Voice error:", event);
      setErrorMessage("Couldn't hear you clearly. Speak louder or check mic permissions.");
      setVoiceState("error");
    };

    return () => {
      void safeVoiceDestroy();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    setVoiceState("idle");
    setTranscript("");
    setLiveTranscript("");
    setResults([]);
    setErrorMessage(null);
    openModal();
    void loadRecentVoiceSearches().then(setRecentSearches);
    autoStartRef.current = setTimeout(() => {
      void startListening();
    }, 500);
    return () => {
      if (autoStartRef.current) {
        clearTimeout(autoStartRef.current);
        autoStartRef.current = null;
      }
    };
  }, [openModal, startListening, visible]);

  useEffect(() => {
    if (voiceState === "listening") {
      bars.forEach((bar, index) => {
        bar.value = withRepeat(
          withSequence(
            withTiming(10 + Math.random() * 28, { duration: 140 + index * 40 }),
            withTiming(10, { duration: 140 + index * 40 }),
          ),
          -1,
          true,
        );
      });
      return;
    }
    resetBarAnimations();
  }, [voiceState, resetBarAnimations, bar0, bar1, bar2, bar3, bar4]);

  const handleRecentPress = useCallback(
    (query: string) => {
      void searchProducts(query);
    },
    [searchProducts],
  );

  const handleProductPress = useCallback(
    (product: VoiceSearchProduct) => {
      if (onResultSelect) {
        onResultSelect(product);
      } else {
        pushProductDetails(router, product.id);
      }
      closeModal();
    },
    [closeModal, onResultSelect, router],
  );

  const renderProduct = useCallback(
    ({ item }: { item: VoiceSearchProduct }) => (
      <View style={styles.productCell}>
        <ListingProductCard
          item={toListingCardItem(item)}
          onPress={() => handleProductPress(item)}
        />
      </View>
    ),
    [handleProductPress],
  );

  const displayQuery = transcript || liveTranscript;
  const showListeningVisual =
    voiceState === "listening" || voiceState === "processing" || voiceState === "idle";
  const statusTitle =
    voiceState === "listening"
      ? "Listening..."
      : voiceState === "processing"
        ? "Searching GehnaHub"
        : voiceState === "idle"
          ? "What are you looking for?"
          : "";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeModal}
      statusBarTranslucent
    >
      <Animated.View style={[styles.fullscreen, overlayStyle]}>
        <LinearGradient
          colors={["#0A0A0A", "#111111", "#0A0A0A"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={closeModal} hitSlop={14} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        {voiceState === "results" ? (
          <Animated.View entering={FadeIn.duration(240)} style={styles.resultsPane}>
            <Text style={styles.resultsTitle} numberOfLines={2}>
              Results for &ldquo;{transcript}&rdquo;
            </Text>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.resultsRow}
              contentContainerStyle={[
                styles.resultsList,
                { paddingBottom: Math.max(insets.bottom, spacing.xl) },
              ]}
              renderItem={renderProduct}
              showsVerticalScrollIndicator={false}
            />
            <Pressable
              onPress={handleMicPress}
              style={[styles.retryLink, { marginBottom: insets.bottom + spacing.sm }]}
            >
              <Ionicons name="mic" size={16} color={colors.gold} />
              <Text style={styles.retryLinkText}>Not what you meant? Try again</Text>
            </Pressable>
          </Animated.View>
        ) : voiceState === "error" ? (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.centerPane}>
            <View style={styles.errorIconWrap}>
              <Ionicons name="mic-off" size={40} color={colors.gold} />
            </View>
            <Text style={styles.statusTitle}>Couldn&apos;t hear you clearly</Text>
            <Text style={styles.statusSubtitle}>
              {errorMessage ?? "Try speaking louder or check mic permissions"}
            </Text>
            <View style={styles.errorActions}>
              <Pressable style={styles.primaryBtn} onPress={handleMicPress}>
                <Ionicons name="mic" size={18} color="#1A1A1A" />
                <Text style={styles.primaryBtnText}>Try Again</Text>
              </Pressable>
              {onSearchByText ? (
                <Pressable style={styles.secondaryBtn} onPress={onSearchByText}>
                  <MaterialIcons name="search" size={18} color={colors.text} />
                  <Text style={styles.secondaryBtnText}>Search by Text</Text>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        ) : (
          <View style={styles.centerPane}>
            <Text style={styles.statusTitle}>{statusTitle}</Text>

            {voiceState === "processing" && displayQuery ? (
              <Text style={styles.transcriptPreview} numberOfLines={3}>
                &ldquo;{displayQuery}&rdquo;
              </Text>
            ) : null}

            {showListeningVisual ? (
              <View style={styles.visualStack}>
                {voiceState === "listening" ? <AssistantDots /> : null}

                <View style={styles.waveformRow}>
                  {bars.map((bar, index) => (
                    <WaveformBar
                      key={index}
                      height={bar}
                      active={voiceState === "listening"}
                    />
                  ))}
                </View>

                <View style={styles.micOrbWrap}>
                  {voiceState === "listening" ? (
                    <>
                      <PulseRing scale={ring1} delay={0} />
                      <PulseRing scale={ring2} delay={450} />
                      <PulseRing scale={ring3} delay={900} />
                    </>
                  ) : null}
                  <Pressable onPress={handleMicPress} style={styles.micOrbPress}>
                    <LinearGradient
                      colors={
                        voiceState === "listening"
                          ? [GOLD_LIGHT, GOLD, GOLD_DARK]
                          : ["#2A2A2A", "#1A1A1A"]
                      }
                      style={styles.micOrb}
                    >
                      <Ionicons
                        name="mic"
                        size={38}
                        color={voiceState === "listening" ? "#1A1A1A" : colors.gold}
                      />
                    </LinearGradient>
                  </Pressable>
                </View>

                {voiceState === "listening" && liveTranscript ? (
                  <Text style={styles.liveTranscript} numberOfLines={4}>
                    {liveTranscript}
                  </Text>
                ) : null}

                {voiceState === "processing" ? (
                  <ActivityIndicator
                    size="large"
                    color={colors.gold}
                    style={styles.spinner}
                  />
                ) : null}

                <Text style={styles.hintText}>
                  {voiceState === "listening"
                    ? "Tap the mic to stop"
                    : voiceState === "processing"
                      ? "Finding the best jewellery for you..."
                      : "Tap the gold mic to speak"}
                </Text>
              </View>
            ) : null}

            {voiceState === "idle" && recentSearches.length > 0 ? (
              <View style={styles.recentSection}>
                <Text style={styles.recentLabel}>Recent searches</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipScroll}
                >
                  {recentSearches.map((entry) => (
                    <Pressable
                      key={entry}
                      style={styles.chip}
                      onPress={() => handleRecentPress(entry)}
                    >
                      <Text style={styles.chipText}>{entry}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {voiceState === "idle" && onSearchByText ? (
              <Pressable onPress={onSearchByText} style={styles.textSearchLink}>
                <Text style={styles.textSearchLinkText}>or search by text</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    alignItems: "flex-end",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  centerPane: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  resultsPane: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  statusTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  statusSubtitle: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: SCREEN_WIDTH * 0.82,
    marginBottom: spacing.xl,
  },
  transcriptPreview: {
    color: colors.gold,
    fontSize: fontSizes.lg,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 26,
  },
  visualStack: {
    alignItems: "center",
    width: "100%",
    marginTop: spacing.xl,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 28,
    marginBottom: spacing.lg,
  },
  assistantDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  waveformRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 5,
    height: 36,
    marginBottom: spacing.xl,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 10,
  },
  micOrbWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  micOrbPress: {
    zIndex: 2,
  },
  micOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: GOLD,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  pulseRing: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.goldGlow,
    backgroundColor: "transparent",
  },
  liveTranscript: {
    color: colors.text,
    fontSize: fontSizes.xl,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: 28,
    fontWeight: "500",
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  hintText: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    marginTop: spacing.xl,
    textAlign: "center",
  },
  spinner: {
    marginTop: spacing.lg,
  },
  recentSection: {
    width: "100%",
    marginTop: spacing["2xl"],
  },
  recentLabel: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    textAlign: "center",
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chipScroll: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.text,
    fontSize: fontSizes.sm,
  },
  textSearchLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  textSearchLinkText: {
    color: colors.gold,
    fontSize: fontSizes.md,
    fontWeight: "500",
  },
  resultsTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  resultsList: {
    paddingBottom: spacing.md,
  },
  resultsRow: {
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  productCell: {
    width: "48%",
  },
  retryLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
  },
  retryLinkText: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
  },
  errorIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(210,189,89,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  errorActions: {
    width: "100%",
    maxWidth: 320,
    gap: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.gold,
    borderRadius: 28,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  primaryBtnText: {
    color: "#1A1A1A",
    fontSize: fontSizes.md,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
});
