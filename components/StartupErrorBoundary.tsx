import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/common/Button';
import { colors, fontSizes, spacing } from '@/src/constants/theme';

type Props = {
  children: ReactNode;
  onRetry?: () => void;
};

type State = {
  error: Error | null;
};

export class StartupErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[startup] uncaught render error', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const message = this.state.error.message || 'Something went wrong while starting the app.';

    return (
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Unable to start</Text>
          <Text style={styles.body}>{message}</Text>
          <Text style={styles.hint}>
            If this is a preview APK, confirm EAS environment variables for Supabase and your API URL,
            then rebuild.
          </Text>
          <Button label="Try again" onPress={this.handleRetry} />
        </ScrollView>
      </View>
    );
  }
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
  body: {
    fontSize: fontSizes.md,
    color: colors.mutedText,
    lineHeight: 22,
  },
  hint: {
    fontSize: fontSizes.sm,
    color: colors.mutedText,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
});
