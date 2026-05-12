import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  label?: string;
};

export function FullScreenLoader({ label = 'Loading...' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#0A1F44" />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
    gap: 10,
  },
  text: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
});
