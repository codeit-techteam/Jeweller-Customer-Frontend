import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  iconVariant?: 'default' | 'accent';
};

export function InfoCard({ icon, title, description, iconVariant = 'default' }: Props) {
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconBox,
          iconVariant === 'accent' && { backgroundColor: '#fff', borderWidth: 1, borderColor: '#3b82f6' },
        ]}
      >
        <MaterialIcons name={icon} size={22} color={iconVariant === 'accent' ? '#2563eb' : '#5c4a2a'} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaef',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f0e8d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '700', color: '#0b1f48', marginBottom: 4 },
  desc: { fontSize: 12, color: '#64748b', lineHeight: 17 },
});
