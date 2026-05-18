import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FullScreenLoader } from '@/components/loaders';
import { getAppConfigIssues, isSupabaseConfigured, logStartupConfig } from '@/lib/appConfig';
import { colors, fontSizes, spacing } from '@/src/constants/theme';

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks startup when required public config is missing (typical EAS preview misconfiguration).
 * API-only issues still allow guest browsing; screens show their own network errors.
 */
export function AppConfigGate({ children }: Props) {
  const [ready, setReady] = React.useState(false);
  const issues = getAppConfigIssues();
  const blockingIssues = issues.filter((issue) => issue.id === 'supabase');

  useEffect(() => {
    logStartupConfig();
    setReady(true);
  }, []);

  if (!ready) {
    return <FullScreenLoader label="Loading configuration..." />;
  }

  if (blockingIssues.length > 0) {
    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Configuration required</Text>
          <Text style={styles.subtitle}>
            This build is missing required environment variables. Add them in the Expo dashboard under
            Project → Environment variables (preview profile), then create a new EAS build.
          </Text>
          {blockingIssues.map((issue) => (
            <Text key={issue.id} style={styles.issue}>
              • {issue.message}
            </Text>
          ))}
          {!isSupabaseConfigured() ? (
            <Text style={styles.code}>
              EXPO_PUBLIC_SUPABASE_URL{'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY
            </Text>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  if (issues.length > 0 && __DEV__) {
    console.warn('[AppConfigGate] non-blocking config warnings:', issues);
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.mutedText,
    lineHeight: 22,
  },
  issue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: fontSizes.sm,
    color: colors.mutedText,
    marginTop: spacing.sm,
  },
});
