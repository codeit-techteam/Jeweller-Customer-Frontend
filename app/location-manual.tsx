import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Input } from '@/src/components/common/Input';
import { colors, fontSizes, radius, spacing } from '@/src/constants/theme';
import { LocationOption, useLocationStore } from '@/src/store/useLocationStore';

const STATIC_LOCATIONS: LocationOption[] = [
  { id: 'mumbai', label: 'Mumbai, Maharashtra, India' },
  { id: 'new-delhi', label: 'New Delhi, Delhi, India' },
  { id: 'bangalore', label: 'Bangalore, Karnataka, India' },
  { id: 'hyderabad', label: 'Hyderabad, Telangana, India' },
  { id: 'jaipur', label: 'Jaipur, Rajasthan, India' },
];

export default function ManualLocationScreen() {
  const router = useRouter();
  const setLocation = useLocationStore((s) => s.setLocation);
  const [query, setQuery] = useState('');

  const handleSelect = (item: LocationOption) => {
    setLocation(item);
    router.replace('/(app)/home');
  };

  const data = STATIC_LOCATIONS; // Filtering can be plugged in later

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Location</Text>
      <Input
        placeholder="Search for city, area or street…"
        value={query}
        onChangeText={setQuery}
        style={styles.searchInput}
      />

      <TouchableOpacity style={styles.currentLocationRow}>
        <View style={styles.currentLocationIcon} />
        <View>
          <Text style={styles.currentLocationTitle}>Use Current Location</Text>
          <Text style={styles.currentLocationSubtitle}>Using GPS to find your address</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Popular Cities</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cityRow} onPress={() => handleSelect(item)}>
            <View style={styles.cityIcon} />
            <View>
              <Text style={styles.cityName}>{item.label.split(',')[0]}</Text>
              <Text style={styles.citySubtitle}>{item.label.replace(item.label.split(',')[0] + ',', '').trim()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <View style={styles.footerCard}>
            <Text style={styles.footerCardText}>Finding the perfect jewelry for your location.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  currentLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.text,
    marginRight: spacing.md,
  },
  currentLocationTitle: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.text,
  },
  currentLocationSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.mutedText,
  },
  sectionLabel: {
    fontSize: fontSizes.sm,
    color: colors.mutedText,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing['2xl'],
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  cityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  cityName: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  citySubtitle: {
    fontSize: fontSizes.xs,
    color: colors.mutedText,
  },
  footerCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCardText: {
    fontSize: fontSizes.sm,
    color: colors.mutedText,
    textAlign: 'center',
  },
});

