import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const GOLD = '#c9a227';
const NAVY = '#001b33';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
};

/** Gold Reserve — white tile + gold icon (per design) */
export function InfoCard({ icon, title, description }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <MaterialIcons name={icon} size={22} color={GOLD} />
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
    backgroundColor: '#f4f5f7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e8eaef',
    shadowColor: '#001b33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '700', color: NAVY, marginBottom: 4 },
  desc: { fontSize: 12, color: '#64748b', lineHeight: 17 },
});
