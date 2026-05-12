import React from 'react';
import { ActivityIndicator, View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing } from '@/src/constants/theme';

type Props = ViewProps & { size?: 'small' | 'large' };

export function Loader({ size = 'large', style, ...rest }: Props) {
  return (
    <View style={[styles.container, style]} {...rest}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.md },
});

