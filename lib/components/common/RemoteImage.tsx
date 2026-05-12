import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View, type ImageStyle, type StyleProp } from 'react-native';

import {
  IMAGE_FALLBACK_SECONDARY,
  PLACEHOLDER_IMAGE_URI,
} from '@/lib/services/mock/imageUrls';
import { ShimmerBlock } from '@/components/loaders/ShimmerBlock';

type Props = {
  uri?: string | null;
  /** @deprecated Ignored — images always load from HTTP URLs (see PLACEHOLDER_IMAGE_URI). */
  fallbackTint?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
};

function fallbackChain(primary: string): string[] {
  const chain: string[] = [primary];
  if (!chain.includes(PLACEHOLDER_IMAGE_URI)) chain.push(PLACEHOLDER_IMAGE_URI);
  if (!chain.includes(IMAGE_FALLBACK_SECONDARY)) chain.push(IMAGE_FALLBACK_SECONDARY);
  return chain;
}

/**
 * Always renders real remote jewellery/retail imagery — no grey placeholder views.
 */
export function RemoteImage({ uri, style, resizeMode = 'cover' }: Props) {
  const primary = useMemo(
    () =>
      uri && typeof uri === 'string' && uri.trim().startsWith('http') ? uri.trim() : PLACEHOLDER_IMAGE_URI,
    [uri],
  );

  const chain = useMemo(() => fallbackChain(primary), [primary]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setIdx(0);
    setLoading(true);
    opacity.setValue(0);
  }, [primary]);

  const src = chain[Math.min(idx, chain.length - 1)];

  return (
    <View style={[styles.container, style as any]}>
      {loading ? <ShimmerBlock height={999} width="100%" borderRadius={0} style={styles.absolute} /> : null}
      <Animated.Image
        source={{ uri: src }}
        style={[style, { opacity }]}
        resizeMode={resizeMode}
        onLoadEnd={() => {
          setLoading(false);
          Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        }}
        onError={() => setIdx((i) => Math.min(i + 1, chain.length - 1))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#eef2f7',
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
});
