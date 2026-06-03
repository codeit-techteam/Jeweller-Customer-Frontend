import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

import {
  IMAGE_FALLBACK_SECONDARY,
  PLACEHOLDER_IMAGE_URI,
} from '@/lib/services/mock/imageUrls';
import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';

type Props = {
  uri?: string | null;
  /** @deprecated Tint for branded placeholder when `uri` is missing. */
  fallbackTint?: string;
  /** When set and `uri` is absent, show a branded tile instead of stock jewellery photos. */
  placeholder?: 'boutique-cover' | 'boutique-logo' | 'category';
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

function fallbackChain(primary: string, useStockFallback: boolean): string[] {
  const chain: string[] = [primary];
  if (!useStockFallback) return chain;
  if (!chain.includes(PLACEHOLDER_IMAGE_URI)) chain.push(PLACEHOLDER_IMAGE_URI);
  if (!chain.includes(IMAGE_FALLBACK_SECONDARY)) chain.push(IMAGE_FALLBACK_SECONDARY);
  return chain;
}

function BrandedBoutiquePlaceholder({
  kind,
  tint,
  style,
}: {
  kind: 'boutique-cover' | 'boutique-logo' | 'category';
  tint?: string;
  style?: StyleProp<ImageStyle>;
}) {
  const iconName =
    kind === 'boutique-logo'
      ? 'storefront'
      : kind === 'category'
        ? 'diamond'
        : 'store';
  const iconSize = kind === 'boutique-logo' ? 36 : kind === 'category' ? 32 : 48;
  const bg =
    kind === 'category' ? tint ?? '#f5f0e6' : tint ?? '#e8e4dc';
  return (
    <View
      style={[
        styles.container,
        styles.brandedPlaceholder,
        { backgroundColor: bg },
        style as object,
      ]}
    >
      <MaterialIcons
        name={iconName}
        size={iconSize}
        color="#9a8b72"
      />
    </View>
  );
}

function RemoteImageComponent({
  uri,
  fallbackTint,
  placeholder,
  style,
  resizeMode = 'cover',
}: Props) {
  const httpUri =
    uri && typeof uri === 'string' && uri.trim().startsWith('http') ? uri.trim() : null;
  const useStockFallback = !placeholder;

  const primary = useMemo(
    () => httpUri ?? (useStockFallback ? PLACEHOLDER_IMAGE_URI : ''),
    [httpUri, useStockFallback],
  );

  const chain = useMemo(
    () => fallbackChain(primary, useStockFallback),
    [primary, useStockFallback],
  );
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(httpUri));
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIdx(0);
    setFailed(false);
    setLoading(Boolean(httpUri));
    opacity.setValue(0);
  }, [httpUri, opacity]);

  if ((!httpUri || failed) && placeholder) {
    return (
      <BrandedBoutiquePlaceholder
        kind={placeholder}
        tint={fallbackTint}
        style={style}
      />
    );
  }

  const src = chain[Math.min(idx, chain.length - 1)];

  return (
    <View style={[styles.container, style as any]}>
      {loading ? <ShimmerBlock height={999} width="100%" borderRadius={0} style={styles.absolute} /> : null}
      <Animated.Image
        source={{ uri: src }}
        style={[style, { opacity }]}
        resizeMode={resizeMode}
        fadeDuration={Platform.OS === 'android' ? 0 : 220}
        progressiveRenderingEnabled
        onLoadEnd={() => {
          setLoading(false);
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        }}
        onError={() => {
          if (placeholder) {
            setFailed(true);
            setLoading(false);
            return;
          }
          setIdx((i) => Math.min(i + 1, chain.length - 1));
        }}
      />
    </View>
  );
}

export const RemoteImage = React.memo(RemoteImageComponent);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#eef2f7',
  },
  brandedPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
});
