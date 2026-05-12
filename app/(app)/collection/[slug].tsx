import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollectionScreen } from '@/lib/components/collections/CollectionScreen';
import { getCollectionScreenConfig } from '@/lib/services/mock/collections/collectionScreenConfig';
import { fontSizes, spacing } from '@/src/constants/theme';

function paramSlug(raw: string | string[] | undefined): string {
  if (raw == null) return '';
  return Array.isArray(raw) ? raw[0] ?? '' : raw;
}

export default function CollectionBySlugScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string | string[]; type?: string | string[] }>();
  const slugParam = paramSlug(params.slug) || paramSlug(params.type);

  const config = useMemo(() => {
    if (!slugParam.trim()) return null;
    return getCollectionScreenConfig(slugParam);
  }, [slugParam]);

  if (!config) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Collection not found</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CollectionScreen
      config={config}
      collectionSlug={slugParam.trim().toLowerCase()}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: fontSizes.md, color: '#64748b', marginBottom: spacing.md },
  emptyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
