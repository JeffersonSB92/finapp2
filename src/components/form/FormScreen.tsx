import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton, AppCard } from '../ui';
import { theme } from '../../theme/theme';

interface FormScreenProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  error?: string | null;
}

export function FormScreen({
  children,
  error,
  isSubmitting = false,
  onSubmit,
  submitLabel,
  subtitle,
  title,
}: FormScreenProps): React.JSX.Element {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <AppCard style={styles.formCard}>
        {children}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </AppCard>

      <AppButton
        disabled={isSubmitting}
        label={submitLabel}
        loading={isSubmitting}
        onPress={onSubmit}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.bottomSafe,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size['2xl'],
    lineHeight: theme.fonts.lineHeight['2xl'],
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  formCard: {
    gap: theme.spacing.md,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  submitButton: {
    marginTop: theme.spacing.xs,
  },
});
