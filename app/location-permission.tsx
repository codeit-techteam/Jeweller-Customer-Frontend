import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Button } from '@/src/components/common/Button';
import { colors, fontSizes, radius, spacing } from '@/src/constants/theme';

const STORAGE_KEY = 'locationPermissionStatus';

export default function LocationPermissionScreen() {
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const goToApp = useCallback(() => {
    router.replace('/(app)/home');
  }, [router]);

  useEffect(() => {
    const checkStoredStatus = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'granted') {
          goToApp();
        }
      } catch {
        // ignore and keep user on permission screen
      }
    };

    void checkStoredStatus();
  }, [goToApp]);

  const handleEnableLocation = async () => {
    try {
      setIsRequesting(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      await AsyncStorage.setItem(STORAGE_KEY, status);
      if (status === 'granted') {
        goToApp();
      }
    } catch {
      // in case of error, user can still choose manual flow
    } finally {
      setIsRequesting(false);
    }
  };

  const handleManual = () => {
    router.push('/location-manual');
  };

  return (
    <View style={styles.container}>
      <View style={styles.closeRow}>
        {/* Placeholder for close icon if needed */}
      </View>
      <View style={styles.heroWrapper}>
        <View style={styles.circleOuter}>
          <View style={styles.circleInner}>
            <Text style={styles.iconText}>◆</Text>
          </View>
        </View>
        <View style={styles.heroTag}>
          <Text style={styles.heroTagText}>Boutiques Nearby</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Discover Jewellery Near You</Text>
        <Text style={styles.body}>
          Allow location access to find nearby boutiques, get personalized recommendations, and book store visits
          easily.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label={isRequesting ? 'Enabling…' : 'Enable Location'} onPress={handleEnableLocation} disabled={isRequesting} />
        <TouchableOpacity onPress={handleManual} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Enter Location Manually</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>We only use your location to show nearby boutiques.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    backgroundColor: colors.background,
  },
  closeRow: {
    height: 24,
    justifyContent: 'center',
  },
  heroWrapper: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  circleOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: colors.background,
    fontSize: 40,
  },
  heroTag: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroTagText: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  content: {
    marginTop: spacing['2xl'],
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    marginTop: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.mutedText,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing['2xl'],
    gap: spacing.md,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryText: {
    fontSize: fontSizes.md,
    color: colors.text,
  },
  footerText: {
    marginTop: spacing.lg,
    fontSize: 11,
    color: colors.mutedText,
    textAlign: 'center',
  },
});

