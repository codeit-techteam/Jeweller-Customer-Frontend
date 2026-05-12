import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const NAVY = '#0B1B2B';

type Props = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function MyHeader({ title, showBack, onBack, right }: Props) {
  const router = useRouter();

  const goBack = () => {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  };

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable hitSlop={12} onPress={goBack} style={styles.side} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={22} color={NAVY} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.side}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  side: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: NAVY,
  },
});
