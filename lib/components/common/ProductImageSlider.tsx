import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ResizeMode, Video } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    Share,
    StyleSheet,
    Text,
    View,
    type ListRenderItemInfo,
} from "react-native";

import {
    WISHLIST_HEART_ACTIVE,
    WISHLIST_HEART_INACTIVE,
} from "@/lib/constants/wishlistHeart";
import type { ProductImage } from "@/lib/services/catalogApi";
import {
    IMAGE_FALLBACK_SECONDARY,
    PLACEHOLDER_IMAGE_URI,
} from "@/lib/services/mock/imageUrls";
import type { WishlistSnapshot } from "@/lib/services/mock/wishlist";
import { useIsWishlisted, useWishlistStore } from "@/lib/stores/wishlistStore";
import { fontSizes, radius, spacing } from "@/src/constants/theme";

const GOLD = "#c29a33";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_H = 380;

type Props = {
  productId: string;
  productName: string;
  images: ProductImage[];
  wishlistSnapshot?: WishlistSnapshot;
};

function Slide({
  item,
  isActive,
}: {
  item: ProductImage;
  isActive: boolean;
}) {
  const [stage, setStage] = useState(0);
  const [videoPosterFailed, setVideoPosterFailed] = useState(false);
  const isVideo = Boolean(item.isVideo);
  const playbackUri =
    (item.videoSrc || item.uri || "").trim() || PLACEHOLDER_IMAGE_URI;

  if (isVideo && isActive) {
    return (
      <View style={[styles.slide, { backgroundColor: item.tint }]}>
        <Video
          source={{ uri: playbackUri }}
          style={StyleSheet.absoluteFillObject}
          useNativeControls
          shouldPlay={false}
          isMuted={false}
          isLooping={false}
          resizeMode={ResizeMode.COVER}
        />
        <View style={styles.videoOverlay} pointerEvents="none" />
      </View>
    );
  }

  if (isVideo && !isActive) {
    if (item.uri && !videoPosterFailed) {
      return (
        <View style={[styles.slide, { backgroundColor: item.tint }]}>
          <Image
            source={{ uri: item.uri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => setVideoPosterFailed(true)}
          />
          <MaterialIcons
            name="play-circle-filled"
            size={68}
            color="rgba(255,255,255,0.96)"
            style={{ zIndex: 1 }}
          />
          <View style={styles.videoOverlay} pointerEvents="none" />
        </View>
      );
    }
    return (
      <View style={[styles.slide, styles.videoPosterFallback]}>
        <MaterialIcons
          name="play-circle-filled"
          size={68}
          color="rgba(255,255,255,0.96)"
          style={{ zIndex: 1 }}
        />
        <View style={styles.videoOverlay} pointerEvents="none" />
      </View>
    );
  }

  const base = item.uri || PLACEHOLDER_IMAGE_URI;
  const uri =
    stage === 0
      ? base
      : stage === 1
        ? PLACEHOLDER_IMAGE_URI
        : IMAGE_FALLBACK_SECONDARY;

  return (
    <View style={[styles.slide, { backgroundColor: item.tint }]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        onError={() => setStage((s) => Math.min(s + 1, 2))}
      />
    </View>
  );
}

function ThumbInner({ img }: { img: ProductImage }) {
  const [stage, setStage] = useState(0);
  const isVideo = Boolean(img.isVideo);

  if (isVideo) {
    const posterOk = Boolean(img.uri) && stage === 0;
    if (!posterOk) {
      return (
        <View style={[styles.thumbInner, styles.videoPosterFallback]}>
          <View style={styles.thumbVideoScrim} pointerEvents="none" />
          <MaterialIcons
            name="play-circle-filled"
            size={28}
            color="rgba(255,255,255,0.98)"
          />
          <View style={styles.thumbVideoLabel}>
            <Text style={styles.thumbVideoLabelText}>Video</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.thumbInner, { backgroundColor: img.tint }]}>
        <Image
          source={{ uri: img.uri! }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => setStage(1)}
        />
        <View style={styles.thumbPlayWrap}>
          <View style={styles.thumbVideoScrim} pointerEvents="none" />
          <MaterialIcons
            name="play-circle-filled"
            size={28}
            color="rgba(255,255,255,0.98)"
          />
        </View>
        <View style={styles.thumbVideoLabel}>
          <Text style={styles.thumbVideoLabelText}>Video</Text>
        </View>
      </View>
    );
  }

  const base = img.uri || PLACEHOLDER_IMAGE_URI;
  const uri =
    stage === 0
      ? base
      : stage === 1
        ? PLACEHOLDER_IMAGE_URI
        : IMAGE_FALLBACK_SECONDARY;
  return (
    <View style={[styles.thumbInner, { backgroundColor: img.tint }]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        onError={() => setStage((s) => Math.min(s + 1, 2))}
      />
    </View>
  );
}

export function ProductImageSlider({
  productId,
  productName,
  images,
  wishlistSnapshot,
}: Props) {
  const safeImages = images.length
    ? images
    : [{ tint: "#d4e4f0", uri: PLACEHOLDER_IMAGE_URI }];
  const listRef = useRef<FlatList<ProductImage>>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const toggleWish = useWishlistStore((s) => s.toggle);
  const wishlisted = useIsWishlisted(productId);
  const heartScale = useRef(new Animated.Value(1)).current;
  const heartOpacity = useRef(new Animated.Value(1)).current;

  const onToggleWishlist = useCallback(() => {
    void Haptics.selectionAsync();
    Animated.parallel([
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.18,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 120,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(heartOpacity, {
          toValue: 0.72,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (wishlistSnapshot) {
      void toggleWish(productId, wishlistSnapshot);
      return;
    }
    const img0 = safeImages[0];
    void toggleWish(productId, {
      id: productId,
      name: productName,
      price: 0,
      image: img0?.uri ?? PLACEHOLDER_IMAGE_URI,
      tintFallback: img0?.tint,
    });
  }, [
    heartOpacity,
    heartScale,
    productId,
    productName,
    safeImages,
    toggleWish,
    wishlistSnapshot,
  ]);

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / SCREEN_W);
      setHeroIndex(Math.min(Math.max(i, 0), safeImages.length - 1));
    },
    [safeImages.length],
  );

  const goTo = useCallback((i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setHeroIndex(i);
  }, []);

  const onShare = useCallback(async () => {
    try {
      await Share.share({ message: `${productName} — The Atelier` });
    } catch {
      /* ignore */
    }
  }, [productName]);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ProductImage>) => (
      <Slide item={item} isActive={index === heroIndex} />
    ),
    [heroIndex],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.heroWrap}>
        <FlatList
          ref={listRef}
          data={safeImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => `img-${i}`}
          removeClippedSubviews={Platform.OS === "android"}
          windowSize={4}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          onMomentumScrollEnd={onScrollEnd}
          extraData={heroIndex}
          getItemLayout={(_, i) => ({
            length: SCREEN_W,
            offset: SCREEN_W * i,
            index: i,
          })}
          onScrollToIndexFailed={({ index }) => {
            setTimeout(
              () => listRef.current?.scrollToIndex({ index, animated: true }),
              120,
            );
          }}
          renderItem={renderItem}
        />
        <View style={styles.certPill} pointerEvents="none">
          <MaterialIcons name="verified" size={14} color="#b8860b" />
          <Text style={styles.certText}>CERTIFIED AUTHENTIC</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            style={styles.iconCircle}
            onPress={onShare}
            accessibilityRole="button"
          >
            <MaterialIcons name="share" size={20} color="#111827" />
          </Pressable>
          <Animated.View
            style={[
              styles.iconCircle,
              { transform: [{ scale: heartScale }], opacity: heartOpacity },
            ]}
          >
            <Pressable
              style={styles.iconCircleTouch}
            onPress={onToggleWishlist}
            accessibilityRole="button"
            accessibilityState={{ selected: wishlisted }}
          >
            <MaterialIcons
              name={wishlisted ? "favorite" : "favorite-border"}
              size={20}
              color={
                wishlisted ? WISHLIST_HEART_ACTIVE : WISHLIST_HEART_INACTIVE
              }
            />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <View style={styles.dots}>
        {safeImages.map((_, i) => (
          <View
            key={`dot-${i}`}
            style={[styles.dot, i === heroIndex && styles.dotOn]}
          />
        ))}
      </View>

      <View style={styles.thumbRow}>
        {safeImages.map((img, i) => (
          <Pressable
            key={`thumb-${i}`}
            accessibilityRole="button"
            accessibilityState={{ selected: i === heroIndex }}
            onPress={() => goTo(i)}
            style={({ pressed }) => [
              styles.thumb,
              i === heroIndex && styles.thumbOn,
              pressed && styles.thumbPressed,
            ]}
          >
            <ThumbInner img={img} />
          </Pressable>
        ))}
      </View>
      <View style={styles.thumbDots}>
        {safeImages.map((_, i) => (
          <View
            key={`td-${i}`}
            style={[styles.tinyDot, i === heroIndex && styles.tinyDotOn]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: "#fff" },
  heroWrap: { height: HERO_H, position: "relative" },
  slide: {
    width: SCREEN_W,
    height: HERO_H,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  playWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  videoPosterFallback: {
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  certPill: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  certText: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: "#fef3c7",
    letterSpacing: 0.3,
  },
  topActions: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircleTouch: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d1d5db" },
  dotOn: { backgroundColor: "#111827", width: 18 },
  thumbRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  thumb: {
    borderRadius: radius.md + 2,
    padding: 2,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  thumbOn: {
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  thumbPressed: { opacity: 0.85 },
  thumbInner: {
    width: 56,
    height: 46,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbPlayWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbVideoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  thumbVideoLabel: {
    position: "absolute",
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  thumbVideoLabelText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.95)",
    letterSpacing: 0.4,
  },
  thumbDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  tinyDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#d1d5db" },
  tinyDotOn: { backgroundColor: "#111827", width: 10 },
});
